import {NextRequest,NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {paypalSubscription,tierForPayPalPlan} from '@/lib/paypal';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 try{
  if(process.env.PAYPAL_CHECKOUT_ENABLED!=='true'||process.env.PAYPAL_ENV!=='live'||!process.env.PAYPAL_CLIENT_ID||!process.env.PAYPAL_CLIENT_SECRET||!process.env.PAYPAL_WEBHOOK_ID)
   return NextResponse.json({error:'Live checkout not configured'},{status:503});
  const origin=request.headers.get('origin');
  if(!origin||new URL(origin).origin!==request.nextUrl.origin)return NextResponse.json({error:'Invalid origin'},{status:403});
  const auth=await serverSupabase();
  const {data:{user}}=auth?await auth.auth.getUser():{data:{user:null}};
  if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
  const body=await request.json();const id=body?.subscriptionID;
  if(typeof id!=='string'||!/^I-[A-Z0-9]+$/i.test(id))return NextResponse.json({error:'Invalid subscription'},{status:400});
  const subscription=await paypalSubscription(id);
  const tier=tierForPayPalPlan(subscription.plan_id);
  if(!tier||subscription.id!==id||subscription.custom_id!==user.id||!['APPROVED','ACTIVE'].includes(subscription.status))
   return NextResponse.json({error:'Subscription not approved or not associated with this account'},{status:403});
  const db=adminDb();if(!db)return NextResponse.json({error:'Database unavailable'},{status:503});
  const record={user_id:user.id,subscription_id:id,plan_id:subscription.plan_id,status:subscription.status,updated_at:new Date().toISOString()};
  const {error}=await db.from('paypal_subscriptions').insert(record);
  if(error){
   if(error.code!=='23505')return NextResponse.json({error:'Unable to save subscription'},{status:503});
   const {data:existing,error:lookupError}=await db.from('paypal_subscriptions')
    .select('user_id,plan_id').eq('subscription_id',id).maybeSingle();
   if(lookupError||!existing)return NextResponse.json({error:'Unable to verify subscription owner'},{status:503});
   if(existing.user_id!==user.id||existing.plan_id!==subscription.plan_id)
    return NextResponse.json({error:'Subscription belongs to a different account or plan'},{status:409});
   const {error:updateError}=await db.from('paypal_subscriptions')
    .update({status:subscription.status,updated_at:record.updated_at})
    .eq('subscription_id',id).eq('user_id',user.id).eq('plan_id',subscription.plan_id);
   if(updateError)return NextResponse.json({error:'Unable to refresh subscription'},{status:503});
  }
  return NextResponse.json({ok:true,status:subscription.status,tier},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Verification failed'},{status:502})}
}
