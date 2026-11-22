import {NextRequest,NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {paypalPlanId,paypalSubscription} from '@/lib/paypal';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 try {
  if(process.env.PAYPAL_CHECKOUT_ENABLED!=='true'||process.env.PAYPAL_ENV!=='live'||!process.env.PAYPAL_CLIENT_ID||!process.env.PAYPAL_CLIENT_SECRET||!process.env.PAYPAL_PLAN_ID||!process.env.PAYPAL_WEBHOOK_ID)return NextResponse.json({error:'Live checkout not configured'},{status:503});
  const origin=request.headers.get('origin');
  if(!origin||new URL(origin).origin!==request.nextUrl.origin)return NextResponse.json({error:'Invalid origin'},{status:403});
  const auth=await serverSupabase();const {data:{user}}=auth?await auth.auth.getUser():{data:{user:null}};
  if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
  const body=await request.json();const id=body?.subscriptionID;
  if(typeof id!=='string'||!/^I-[A-Z0-9]+$/i.test(id))return NextResponse.json({error:'Invalid subscription'},{status:400});
  const subscription=await paypalSubscription(id);
  if(!paypalPlanId||subscription.id!==id||subscription.plan_id!==paypalPlanId||subscription.custom_id!==user.id||!['APPROVED','ACTIVE'].includes(subscription.status))
   return NextResponse.json({error:'Subscription not active or does not belong to this account'},{status:403});
  const db=adminDb();if(!db)return NextResponse.json({error:'Database unavailable'},{status:503});
  // Never upsert: an existing subscription must not be reassigned to another user.
  const {error}=await db.from('paypal_subscriptions').insert({user_id:user.id,subscription_id:id,plan_id:paypalPlanId,status:subscription.status,updated_at:new Date().toISOString()});
  if(error){
   if(error.code!=='23505')return NextResponse.json({error:'Unable to save subscription'},{status:503});
   const {data:existing,error:lookupError}=await db.from('paypal_subscriptions').select('user_id,plan_id').eq('subscription_id',id).maybeSingle();
   if(lookupError||!existing)return NextResponse.json({error:'Unable to verify subscription owner'},{status:503});
   if(existing.user_id!==user.id||existing.plan_id!==paypalPlanId)return NextResponse.json({error:'Subscription already linked to another account'},{status:409});
   const {error:updateError}=await db.from('paypal_subscriptions').update({status:'ACTIVE',updated_at:new Date().toISOString()}).eq('subscription_id',id).eq('user_id',user.id).eq('plan_id',paypalPlanId);
   if(updateError)return NextResponse.json({error:'Unable to refresh subscription'},{status:503});
  }
  return NextResponse.json({ok:true,status:subscription.status},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Verification failed'},{status:502})}
}
