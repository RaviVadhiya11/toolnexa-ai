import {NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {configuredPayPalPlanIds,paypalSubscription,planForPayPalPlan,type PaidTier,type BillingPeriod} from '@/lib/paypal';
export const runtime='nodejs';
export async function GET(){
 const headers={'Cache-Control':'no-store'};
 try{
  const auth=await serverSupabase();
  const {data:{user},error:authError}=auth?await auth.auth.getUser():{data:{user:null},error:null};
  if(authError||!user)return NextResponse.json({plan:'Free',authenticated:false,userId:null},{headers});
  const db=adminDb();
  if(!db)return NextResponse.json({error:'Membership database unavailable'},{status:503,headers});
  const {data,error}=await db.from('paypal_subscriptions').select('subscription_id,plan_id')
   .eq('user_id',user.id).eq('status','ACTIVE').limit(20);
  if(error)return NextResponse.json({error:'Membership lookup failed'},{status:503,headers});
  if(!data?.length)return NextResponse.json({plan:'Free',billingPeriod:null,authenticated:true,userId:user.id},{headers});
  const ids=configuredPayPalPlanIds();
  if(!ids.length||process.env.PAYPAL_ENV!=='live'||data.some(row=>!ids.includes(row.plan_id)))
   return NextResponse.json({error:'Paid membership verification unavailable'},{status:503,headers});
  const active=new Map<PaidTier,BillingPeriod>();
  for(const record of data){
   let subscription;
   try{subscription=await paypalSubscription(record.subscription_id)}
   catch{return NextResponse.json({error:'PayPal membership verification unavailable'},{status:503,headers})}
   const billingPlan=planForPayPalPlan(record.plan_id);
   if(!billingPlan||subscription.id!==record.subscription_id||subscription.plan_id!==record.plan_id||subscription.custom_id!==user.id)continue;
   if(subscription.status==='ACTIVE')active.set(billingPlan.tier,billingPlan.billingPeriod);
   else await db.from('paypal_subscriptions')
    .update({status:subscription.status,updated_at:new Date().toISOString()})
    .eq('subscription_id',record.subscription_id).eq('user_id',user.id).eq('plan_id',record.plan_id);
  }
  const plan=active.has('Max')?'Max':active.has('Premium')?'Premium':active.has('Pro')?'Pro':active.has('Starter')?'Starter':'Free';
  if(plan==='Max'&&process.env.USAGE_DB_QUOTAS_ENABLED!=='true')return NextResponse.json({error:'Max daily quota service is not ready'},{status:503,headers});
  return NextResponse.json({plan,billingPeriod:plan==='Free'?null:active.get(plan as PaidTier)??null,authenticated:true,userId:user.id},{headers});
 }catch{return NextResponse.json({error:'Membership service unavailable'},{status:503,headers})}
}
