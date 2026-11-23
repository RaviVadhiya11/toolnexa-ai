import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {configuredPayPalPlanIds,paypalSubscription,tierForPayPalPlan,type PaidTier} from '@/lib/paypal';

// Paid download access is ALWAYS checked server-side. Never trust the browser's plan label.
export async function verifyHdMember():Promise<{userId:string;plan:'Pro'|'Premium'|'Max'}|{error:string;status:number}> {
 const auth=await serverSupabase();
 if(!auth)return {error:'Account verification unavailable',status:503};
 const {data:{user},error}=await auth.auth.getUser();
 if(error||!user)return {error:'Sign in to download HD files',status:401};
 const db=adminDb();
 if(!db)return {error:'Membership verification unavailable',status:503};
 const {data:rows,error:lookupError}=await db.from('paypal_subscriptions')
  .select('subscription_id,plan_id').eq('user_id',user.id).eq('status','ACTIVE').limit(20);
 if(lookupError)return {error:'Membership lookup failed',status:503};
 if(!rows?.length)return {error:'HD downloads require Pro, Premium or Max',status:403};
 if(process.env.PAYPAL_ENV!=='live')return {error:'Live payment verification unavailable',status:503};
 const ids=configuredPayPalPlanIds();
 if(!ids.length||rows.some(row=>!ids.includes(row.plan_id)))
  return {error:'Membership configuration requires verification',status:503};
 const valid=new Set<PaidTier>();
 for(const row of rows){
  let sub;
  try{sub=await paypalSubscription(row.subscription_id)}
  catch{return {error:'Unable to verify PayPal membership',status:503}}
  const tier=tierForPayPalPlan(row.plan_id);
  if(tier&&sub.status==='ACTIVE'&&sub.id===row.subscription_id&&
   sub.plan_id===row.plan_id&&sub.custom_id===user.id)valid.add(tier);
 }
 if(valid.has('Max'))return {userId:user.id,plan:'Max'};
 if(valid.has('Premium'))return {userId:user.id,plan:'Premium'};
 if(valid.has('Pro'))return {userId:user.id,plan:'Pro'};
 return {error:'Upgrade to Pro or higher for HD downloads',status:403};
}
