import {NextRequest,NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {dailyLimits,type UsagePlan} from '@/lib/usage-limits';
import {tools} from '@/lib/tools';
import {configuredPayPalPlanIds,paypalSubscription,tierForPayPalPlan,type PaidTier} from '@/lib/paypal';
export const runtime='nodejs';
const noStore={'Cache-Control':'no-store'};
const allowed=new Set(tools.map(tool=>tool.slug));
const reply=(data:object,status=200)=>NextResponse.json(data,{status,headers:noStore});

async function member(){
 const auth=await serverSupabase();
 if(!auth)return {error:'Account verification is not configured',status:503} as const;
 const {data:{user},error}=await auth.auth.getUser();
 if(error||!user)return {user:null,plan:'Free' as UsagePlan} as const;
 const db=adminDb();
 if(!db)return {error:'Membership database unavailable',status:503} as const;
 const {data,error:lookupError}=await db.from('paypal_subscriptions')
  .select('subscription_id,plan_id').eq('user_id',user.id).eq('status','ACTIVE').limit(20);
 if(lookupError)return {error:'Membership lookup unavailable',status:503} as const;
 // A genuinely Free signed-in user must not depend on PayPal configuration or availability.
 if(!data?.length)return {user,plan:'Free' as UsagePlan} as const;
 const planIds=configuredPayPalPlanIds();
 if(process.env.PAYPAL_ENV!=='live'||!planIds.length||
    data.some(record=>!planIds.includes(record.plan_id)))
  return {error:'Paid membership verification temporarily unavailable',status:503} as const;
 const tiers=new Set<PaidTier>();
 for(const row of data??[]){
  let subscription;
  try{subscription=await paypalSubscription(row.subscription_id)}
  catch{return {error:'PayPal membership verification unavailable',status:503} as const}
  const tier=tierForPayPalPlan(row.plan_id);
  if(!tier||subscription.id!==row.subscription_id||subscription.plan_id!==row.plan_id||subscription.custom_id!==user.id)continue;
  if(subscription.status==='ACTIVE')tiers.add(tier);
 }
 const plan:UsagePlan=tiers.has('Max')?'Max':tiers.has('Premium')?'Premium':tiers.has('Pro')?'Pro':tiers.has('Starter')?'Starter':'Free';
 return {user,plan} as const;
}

async function handler(request:NextRequest,consume:boolean){
 try{
  if(consume){
   const origin=request.headers.get('origin');
   if(!origin||origin!==request.nextUrl.origin)return reply({error:'Invalid request origin'},403);
   const type=request.headers.get('content-type')??'';
   if(!type.startsWith('application/json'))return reply({error:'Invalid request content type'},415);
  }
  const verified=await member();
  if('error' in verified)return reply({error:verified.error},verified.status);
  const {user,plan}=verified;
  const limit=dailyLimits[plan];
  // Anonymous visitors remain on the original shared per-browser daily allowance.
  if(!user)return consume?reply({error:'Guest usage is managed on this browser'},400):reply({mode:'browser',plan,limit,userId:null});
  // The capped Max tier requires server-enforced counters; never fall back to a bypassable browser-only quota.
  if(plan==='Max'&&process.env.USAGE_DB_QUOTAS_ENABLED!=='true')
   return reply({error:'Max account quotas are not enabled'},503);
  // Deploy this code before applying the migration without breaking existing tools.
  if(process.env.USAGE_DB_QUOTAS_ENABLED!=='true')
   return consume?reply({error:'Account quota migration is not enabled'},503):reply({mode:'browser',plan,limit,userId:user.id});
  const db=adminDb();
  if(!db)return reply({error:'Usage database unavailable'},503);
  if(consume){
   let body:unknown;
   try{body=await request.json()}catch{return reply({error:'Invalid request body'},400)}
   const slug=body&&typeof body==='object'&&'slug' in body?(body as {slug:unknown}).slug:null;
   if(typeof slug!=='string'||!allowed.has(slug))return reply({error:'Unknown tool'},400);
   const {data,error}=await db.rpc('consume_daily_tool_usage',{p_user_id:user.id,p_limit:limit});
   if(error)return reply({error:'Account quota unavailable. Check database migration.'},503);
   if(data===null){
    return reply({error:'Daily account usage limit reached. Upgrade for more runs.',mode:'account',plan,limit,used:limit},429);
   }
   if(typeof data!=='number'||data<1||data>limit)return reply({error:'Unexpected quota state'},503);
   return reply({mode:'account',plan,limit,used:data,userId:user.id});
  }
  const utcDay=new Date().toISOString().slice(0,10);
  const {data,error}=await db.from('daily_tool_usage').select('used')
   .eq('user_id',user.id).eq('usage_day',utcDay).maybeSingle();
  if(error)return reply({error:'Account quota unavailable. Check database migration.'},503);
  return reply({mode:'account',plan,limit,used:data?.used??0,userId:user.id});
 }catch{return reply({error:'Unable to verify usage allowance'},503)}
}
export async function GET(request:NextRequest){return handler(request,false)}
export async function POST(request:NextRequest){return handler(request,true)}
