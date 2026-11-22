import {NextRequest,NextResponse} from 'next/server';
import {adminDb} from '@/lib/admin';
import {paypalBase,paypalPlanId,paypalSubscription,paypalToken} from '@/lib/paypal';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 try{
  const webhookId=process.env.PAYPAL_WEBHOOK_ID;
  if(!webhookId)return NextResponse.json({error:'Not configured'},{status:503});
  const body=await request.json();
  const headers=request.headers;
  const token=await paypalToken();
  const verification=await fetch(paypalBase+'/v1/notifications/verify-webhook-signature',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({
   auth_algo:headers.get('paypal-auth-algo'),cert_url:headers.get('paypal-cert-url'),
   transmission_id:headers.get('paypal-transmission-id'),transmission_sig:headers.get('paypal-transmission-sig'),
   transmission_time:headers.get('paypal-transmission-time'),webhook_id:webhookId,webhook_event:body
  }),cache:'no-store'});
  if(!verification.ok||(await verification.json()).verification_status!=='SUCCESS')return NextResponse.json({error:'Invalid signature'},{status:400});
  const eventType=String(body.event_type||'');
  if(!['BILLING.SUBSCRIPTION.ACTIVATED','BILLING.SUBSCRIPTION.UPDATED','BILLING.SUBSCRIPTION.CANCELLED','BILLING.SUBSCRIPTION.SUSPENDED','BILLING.SUBSCRIPTION.EXPIRED','BILLING.SUBSCRIPTION.PAYMENT.FAILED','PAYMENT.SALE.COMPLETED','PAYMENT.SALE.REFUNDED','PAYMENT.SALE.REVERSED'].includes(eventType))return NextResponse.json({ok:true});
  const id=eventType.startsWith('PAYMENT.')?body.resource?.billing_agreement_id:body.resource?.id;
  if(typeof id!=='string'||!/^I-[A-Z0-9]+$/i.test(id))return NextResponse.json({ok:true});
  const subscription=await paypalSubscription(id);
  if(subscription.plan_id!==paypalPlanId)return NextResponse.json({ok:true});
  const db=adminDb();if(!db)return NextResponse.json({error:'Database unavailable'},{status:503});
  // Only update subscriptions previously claimed by an authenticated user.
  const {error}=await db.from('paypal_subscriptions').update({status:subscription.status,updated_at:new Date().toISOString()}).eq('subscription_id',id).eq('plan_id',paypalPlanId);
  if(error)return NextResponse.json({error:'Database update failed'},{status:500});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Webhook processing failed'},{status:500})}
}
