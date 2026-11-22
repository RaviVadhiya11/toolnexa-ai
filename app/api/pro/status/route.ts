import {NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {paypalPlanId,paypalSubscription} from '@/lib/paypal';

export const runtime='nodejs';

export async function GET(){
 const headers={'Cache-Control':'no-store'};
 try{
  const auth=await serverSupabase();
  const {data:{user},error:authError}=auth?await auth.auth.getUser():{data:{user:null},error:null};
  if(authError||!user)return NextResponse.json({plan:'Free',authenticated:false},{headers});
  const db=adminDb();
  if(!db||!paypalPlanId||process.env.PAYPAL_ENV!=='live')
   return NextResponse.json({error:'Membership service unavailable'},{status:503,headers});
  const {data,error}=await db.from('paypal_subscriptions')
   .select('subscription_id').eq('user_id',user.id).eq('plan_id',paypalPlanId).eq('status','ACTIVE').limit(1);
  if(error)return NextResponse.json({error:'Membership lookup failed'},{status:503,headers});
  if(!data?.length)return NextResponse.json({plan:'Free',authenticated:true},{headers});
  let subscription;
  try{subscription=await paypalSubscription(data[0].subscription_id)}
  catch{return NextResponse.json({error:'PayPal membership verification unavailable'},{status:503,headers})}
  const valid=subscription.id===data[0].subscription_id &&
   subscription.plan_id===paypalPlanId &&
   subscription.custom_id===user.id &&
   subscription.status==='ACTIVE';
  if(!valid){
   if(subscription.id===data[0].subscription_id &&
      subscription.plan_id===paypalPlanId &&
      subscription.custom_id===user.id &&
      subscription.status!=='ACTIVE'){
    await db.from('paypal_subscriptions')
     .update({status:subscription.status,updated_at:new Date().toISOString()})
     .eq('subscription_id',subscription.id).eq('user_id',user.id).eq('plan_id',paypalPlanId);
   }
   return NextResponse.json({plan:'Free',authenticated:true},{headers});
  }
  return NextResponse.json({plan:'Pro',authenticated:true},{headers});
 }catch{return NextResponse.json({error:'Membership service unavailable'},{status:503,headers})}
}
