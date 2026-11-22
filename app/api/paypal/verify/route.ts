import {NextRequest,NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {paypalPlanId,paypalSubscription} from '@/lib/paypal';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 try {
  if(process.env.PAYPAL_CHECKOUT_ENABLED!=='true')return NextResponse.json({error:'Checkout not enabled'},{status:503});
  const origin=request.headers.get('origin');
  if(!origin||new URL(origin).host!==request.nextUrl.host)return NextResponse.json({error:'Invalid origin'},{status:403});
  const auth=await serverSupabase(); const {data:{user}}=auth?await auth.auth.getUser():{data:{user:null}};
  if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
  const body=await request.json(); const id=body?.subscriptionID;
  if(typeof id!=='string'||!/^I-[A-Z0-9]+$/i.test(id))return NextResponse.json({error:'Invalid subscription'},{status:400});
  const subscription=await paypalSubscription(id);
  if(subscription.plan_id!==paypalPlanId||subscription.custom_id!==user.id||subscription.status!=='ACTIVE')return NextResponse.json({error:'Subscription not active or does not belong to this account'},{status:403});
  const db=adminDb();if(!db)return NextResponse.json({error:'Database unavailable'},{status:503});
  const {error}=await db.from('paypal_subscriptions').upsert({user_id:user.id,subscription_id:id,plan_id:paypalPlanId,status:subscription.status,updated_at:new Date().toISOString()},{onConflict:'subscription_id'});
  if(error)return NextResponse.json({error:'Unable to save subscription'},{status:409});
  return NextResponse.json({ok:true,status:subscription.status});
 }catch{return NextResponse.json({error:'Verification failed'},{status:502})}
}
