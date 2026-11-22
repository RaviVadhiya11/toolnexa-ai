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
  // A PayPal activation webhook may arrive before the buyer's browser
  // returns to /api/paypal/verify. Never lose that legitimate activation.
  // Only PayPal-confirmed ACTIVE subscriptions can be linked automatically.
  const {data:existing,error:lookupError}=await db.from('paypal_subscriptions')
   .select('user_id,plan_id').eq('subscription_id',id).maybeSingle();
  if(lookupError)return NextResponse.json({error:'Database lookup failed'},{status:500});
  if(existing){
   // Keep the original owner and plan immutable. A PayPal event must never
   // reassign a subscription already claimed by a different user.
   if(existing.plan_id!==subscription.plan_id||
      (subscription.custom_id&&existing.user_id!==subscription.custom_id))
    return NextResponse.json({ok:true});
   const {error}=await db.from('paypal_subscriptions')
    .update({status:subscription.status,updated_at:new Date().toISOString()})
    .eq('subscription_id',id).eq('user_id',existing.user_id)
    .eq('plan_id',existing.plan_id).neq('status',subscription.status);
   if(error)return NextResponse.json({error:'Database update failed'},{status:500});
  }else if(subscription.status==='ACTIVE'){
   const userId=subscription.custom_id;
   // The opaque custom_id must match a real Supabase Auth user; never link
   // an event with a missing or malformed identity.
   if(typeof userId!=='string'||!(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i).test(userId))
    return NextResponse.json({ok:true});
   const {data:owner,error:ownerError}=await db.auth.admin.getUserById(userId);
   if(ownerError)return NextResponse.json({error:'Owner lookup failed'},{status:503});
   if(!owner.user)return NextResponse.json({ok:true});
   const {error:insertError}=await db.from('paypal_subscriptions').insert({
    subscription_id:id,user_id:userId,plan_id:subscription.plan_id,
    status:'ACTIVE',updated_at:new Date().toISOString()
   });
   // Another valid claim may win the race. Never replace its owner.
   if(insertError&&insertError.code!=='23505')
    return NextResponse.json({error:'Unable to record activation'},{status:500});
  }
  // No record is created for APPROVED, CANCELLED, or otherwise non-ACTIVE
  // subscriptions. Browser verification still records valid APPROVED claims.
  // Refunds and failed payments are not necessarily cancellations. If PayPal
  // still reports ACTIVE, don't invent a cancellation; reconcile billing
  // entitlement separately before promising immediate revocation.
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Webhook processing failed'},{status:500})}
}
