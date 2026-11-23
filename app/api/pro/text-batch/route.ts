import {NextRequest,NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {configuredPayPalPlanIds,paypalSubscription,paypalTierSettings,tierForPayPalPlan,PaidTier} from '@/lib/paypal';
export const runtime='nodejs';
const noStore={'Cache-Control':'no-store'};
async function resolveTier(db:NonNullable<ReturnType<typeof adminDb>>,userId:string){
 const ids=configuredPayPalPlanIds();
 if(!ids.length||process.env.PAYPAL_ENV!=='live')return {error:'Pro verification unavailable',code:503} as const;
 const {data,error}=await db.from('paypal_subscriptions').select('subscription_id,plan_id')
  .eq('user_id',userId).in('plan_id',ids).eq('status','ACTIVE').limit(20);
 if(error)return {error:'Unable to verify membership',code:503} as const;
 if(!data?.length)return {error:'Active paid subscription required',code:403} as const;
 const tierOrder:PaidTier[]=['Max','Premium','Pro','Starter'];
 const active=new Set<PaidTier>();
 let unavailable=false;
 for(const record of data){
  try{
   const subscription=await paypalSubscription(record.subscription_id);
   const tier=tierForPayPalPlan(record.plan_id);
   if(subscription.id!==record.subscription_id||subscription.plan_id!==record.plan_id||
    subscription.custom_id!==userId||!tier)continue;
   if(subscription.status==='ACTIVE')active.add(tier);
   else await db.from('paypal_subscriptions').update({status:subscription.status,updated_at:new Date().toISOString()})
    .eq('subscription_id',record.subscription_id).eq('user_id',userId).eq('plan_id',record.plan_id);
  }catch{unavailable=true}
 }
 // Fail closed if any membership cannot be verified, rather than guessing which tier is highest.
 if(unavailable)return {error:'PayPal verification temporarily unavailable',code:503} as const;
 const tier=tierOrder.find(t=>active.has(t));
 return tier?{tier}:{error:'Active paid subscription required',code:403} as const;
}
export async function POST(request:NextRequest){
 const auth=await serverSupabase();
 const {data:{user}}=auth?await auth.auth.getUser():{data:{user:null}};
 if(!user)return NextResponse.json({error:'Sign in required'},{status:401,headers:noStore});
 const db=adminDb();
 if(!db)return NextResponse.json({error:'Service unavailable'},{status:503,headers:noStore});
 const access=await resolveTier(db,user.id);
 if('error' in access)return NextResponse.json({error:access.error},{status:access.code,headers:noStore});
 let payload:unknown;
 try{payload=await request.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400,headers:noStore})}
 const texts=(payload as {texts?:unknown})?.texts;
 const max=paypalTierSettings[access.tier].maxTexts;
 if(!Array.isArray(texts)||texts.length<1||texts.length>max||texts.some(x=>typeof x!=='string'||x.length>20000))
  return NextResponse.json({error:`Your ${access.tier} plan supports 1–${max} texts per request (20,000 characters each).`},{status:400,headers:noStore});
 const results=(texts as string[]).map((value,index)=>{
  const words=value.trim().match(/\S+/gu)||[];
  const sentences=value.match(/[^.!?]+[.!?]+|[^.!?]+$/gu)||[];
  const lines=value.length?value.split(/\r?\n/u).length:0;
  return {item:index+1,characters:value.length,words:words.length,sentences:value.trim()?sentences.length:0,lines,readingMinutes:Math.round(words.length/200*100)/100};
 });
 return NextResponse.json({results,tier:access.tier,maxTexts:max},{headers:noStore});
}
