import {NextRequest,NextResponse} from 'next/server';
import {adminDb} from '@/lib/admin';
import {paypalBase,tierForPayPalPlan,paypalSubscription,paypalToken} from '@/lib/paypal';
export const runtime='nodejs';

const subscriptionEvents=new Set([
 'BILLING.SUBSCRIPTION.ACTIVATED','BILLING.SUBSCRIPTION.UPDATED',
 'BILLING.SUBSCRIPTION.CANCELLED','BILLING.SUBSCRIPTION.SUSPENDED',
 'BILLING.SUBSCRIPTION.EXPIRED','BILLING.SUBSCRIPTION.PAYMENT.FAILED'
]);
const paymentEvents=new Set(['PAYMENT.SALE.COMPLETED','PAYMENT.SALE.REFUNDED','PAYMENT.SALE.REVERSED']);
const allowedStatuses=new Set(['APPROVAL_PENDING','APPROVED','ACTIVE','SUSPENDED','CANCELLED','EXPIRED']);

export async function POST(request:NextRequest){
 try{
  const webhookId=process.env.PAYPAL_WEBHOOK_ID;
  if(!webhookId||process.env.PAYPAL_ENV!=='live')return NextResponse.json({error:'Not configured'},{status:503});
  // Reject oversized payloads before contacting PayPal.
  const raw=await request.text();
  if(raw.length>256000)return NextResponse.json({error:'Payload too large'},{status:413});
  const body=JSON.parse(raw);
  const headers=request.headers;
  const token=await paypalToken();
  const verification=await fetch(paypalBase+'/v1/notifications/verify-webhook-signature',{
   method:'POST',
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify({
    auth_algo:headers.get('paypal-auth-algo'),cert_url:headers.get('paypal-cert-url'),
    transmission_id:headers.get('paypal-transmission-id'),transmission_sig:headers.get('paypal-transmission-sig'),
    transmission_time:headers.get('paypal-transmission-time'),webhook_id:webhookId,webhook_event:body
   }),cache:'no-store'
  });
  if(!verification.ok||(await verification.json()).verification_status!=='SUCCESS')
   return NextResponse.json({error:'Invalid signature'},{status:400});
  const eventType=String(body.event_type||'');
  if(!subscriptionEvents.has(eventType)&&!paymentEvents.has(eventType))return NextResponse.json({ok:true});
  // The sale ID is not a subscription ID; only a billing agreement reference can identify it.
  const id=paymentEvents.has(eventType)?body.resource?.billing_agreement_id:body.resource?.id;
  if(typeof id!=='string'||!/^I-[A-Z0-9]+$/i.test(id))return NextResponse.json({ok:true});
  // Never trust the event's possibly stale status. Read the current PayPal state.
  const subscription=await paypalSubscription(id);
  if(subscription.id!==id||!tierForPayPalPlan(subscription.plan_id)||!allowedStatuses.has(subscription.status))
   return NextResponse.json({ok:true});
  const db=adminDb();
  if(!db)return NextResponse.json({error:'Database unavailable'},{status:503});
  // Repeated and out-of-order events converge to the same current PayPal state.
  // Only an authenticated, previously claimed subscription can be modified.
  const {error}=await db.from('paypal_subscriptions')
   .update({status:subscription.status,updated_at:new Date().toISOString()})
   .eq('subscription_id',id).eq('plan_id',subscription.plan_id).neq('status',subscription.status);
  if(error)return NextResponse.json({error:'Database update failed'},{status:500});
  // Refunds and failed payments are not necessarily cancellations. If PayPal
  // still reports ACTIVE, don't invent a cancellation; reconcile billing
  // entitlement separately before promising immediate revocation.
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Webhook processing failed'},{status:500})}
}
