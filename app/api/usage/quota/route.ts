import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {dailyLimits,type UsagePlan} from '@/lib/usage-limits';
import {tools} from '@/lib/tools';
import {studioRunSlugs} from '@/lib/studio-run-slugs';
import {configuredPayPalPlanIds,paypalSubscription,tierForPayPalPlan,type PaidTier} from '@/lib/paypal';
export const runtime='nodejs';
const noStore={'Cache-Control':'no-store'};
const allowed=new Set([...tools.map(tool=>tool.slug),...studioRunSlugs]);
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

const deviceCookie='toolnexa_device_v1';
const validDeviceId=(v:string|undefined)=>!!v&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const usageDay=()=>new Date().toISOString().slice(0,10);

async function handler(request:NextRequest,action:'read'|'consume'|'sync'){
 const existingId=request.cookies.get(deviceCookie)?.value;
 const deviceId=validDeviceId(existingId)?existingId!:randomUUID();
 const respond=(data:object,status=200)=>{
  const response=reply(data,status);
  if(!validDeviceId(existingId))
   response.cookies.set(deviceCookie,deviceId,{
    httpOnly:true,secure:request.nextUrl.protocol==='https:',sameSite:'lax',
    path:'/',maxAge:60*60*24*730
   });
  return response;
 };
 try{
  if(action!=='read'){
   if(request.headers.get('origin')!==request.nextUrl.origin)
    return respond({error:'Invalid request origin'},403);
   if(!(request.headers.get('content-type')||'').startsWith('application/json'))
    return respond({error:'Invalid request content type'},415);
  }
  const verified=await member();
  if('error' in verified)return respond({error:verified.error},verified.status);
  const {user,plan}=verified,limit=dailyLimits[plan];

  // One shared Free allowance is keyed to the long-lived first-party browser
  // cookie, regardless of account login/signup/logout. Paid tiers stay
  // account-based, with the original server-enforced limits.
  if(plan==='Free'){
   if(process.env.USAGE_DB_QUOTAS_ENABLED!=='true')
    return action==='read'?respond({mode:'browser',plan,limit,userId:user?.id??null}):
      respond({error:'Device quota database is not enabled'},503);
   const db=adminDb();
   if(!db)return respond({error:'Device usage database unavailable'},503);

   // Carry over the old account quota when a user logs in with existing usage.
   let legacyUsed=0;
   if(user){
    const legacy=await db.from('daily_tool_usage').select('used')
     .eq('user_id',user.id).eq('usage_day',usageDay()).maybeSingle();
    if(legacy.error)return respond({error:'Legacy account usage check unavailable'},503);
    legacyUsed=Number(legacy.data?.used??0);
    if(!Number.isSafeInteger(legacyUsed)||legacyUsed<0)return respond({error:'Invalid legacy usage'},503);
    legacyUsed=Math.min(legacyUsed,limit);
   }
   if(action==='read'){
    const state=await db.from('daily_device_tool_usage').select('used')
     .eq('device_id',deviceId).eq('usage_day',usageDay()).maybeSingle();
    if(state.error)return respond({error:'Device daily usage is unavailable'},503);
    let used=Number(state.data?.used??0);
    if(!Number.isSafeInteger(used)||used<0||used>limit)return respond({error:'Invalid device usage state'},503);
    if(legacyUsed>used){
     const migrated=await db.rpc('sync_daily_device_tool_usage',{
      p_device_id:deviceId,p_limit:limit,p_floor:legacyUsed
     });
     if(migrated.error||typeof migrated.data!=='number')
      return respond({error:'Unable to preserve old account usage'},503);
     used=migrated.data;
    }
    return respond({mode:'device',plan,limit,used,userId:user?.id??null});
   }
   let body:unknown;
   try{body=await request.json()}catch{return respond({error:'Invalid request body'},400)}
   const payload=body&&typeof body==='object'?body as Record<string,unknown>:null;
   const reported=action==='sync'?payload?.used:(payload?.clientUsed??0);
   if(typeof reported!=='number'||!Number.isSafeInteger(reported)||reported<0||reported>limit)
    return respond({error:'Invalid local daily usage'},400);
   const floor=Math.max(reported,legacyUsed);
   if(action==='sync'){
    const {data,error}=await db.rpc('sync_daily_device_tool_usage',{
     p_device_id:deviceId,p_limit:limit,p_floor:floor
    });
    if(error||typeof data!=='number')return respond({error:'Unable to sync Free daily usage'},503);
    return respond({mode:'device',plan,limit,used:data,userId:user?.id??null});
   }
   const slug=payload?.slug;
   if(typeof slug!=='string'||!allowed.has(slug))return respond({error:'Unknown tool'},400);
   const {data,error}=await db.rpc('consume_daily_device_tool_usage',{
    p_device_id:deviceId,p_limit:limit,p_floor:floor
   });
   if(error)return respond({error:'Device quota reservation unavailable'},503);
   if(data===null)return respond({
    error:'This device has used its Free daily runs. Upgrade or return after 00:00 UTC.',
    mode:'device',plan,limit,used:limit
   },429);
   if(typeof data!=='number'||data<1||data>limit)
    return respond({error:'Unexpected device quota state'},503);
   return respond({mode:'device',plan,limit,used:data,userId:user?.id??null});
  }

  if(action==='sync')return respond({error:'Only Free device usage can be synced'},400);
  if(!user)return respond({error:'Paid plan requires an account'},401);
  if(plan==='Max'&&process.env.USAGE_DB_QUOTAS_ENABLED!=='true')
   return respond({error:'Max account quotas are not enabled'},503);
  if(process.env.USAGE_DB_QUOTAS_ENABLED!=='true')
   return action==='consume'?respond({error:'Account quota migration is not enabled'},503):
     respond({mode:'browser',plan,limit,userId:user.id});
  const db=adminDb();
  if(!db)return respond({error:'Usage database unavailable'},503);
  if(action==='consume'){
   let body:unknown;
   try{body=await request.json()}catch{return respond({error:'Invalid request body'},400)}
   const slug=body&&typeof body==='object'&&'slug' in body?(body as {slug:unknown}).slug:null;
   if(typeof slug!=='string'||!allowed.has(slug))return respond({error:'Unknown tool'},400);
   const {data,error}=await db.rpc('consume_daily_tool_usage',{p_user_id:user.id,p_limit:limit});
   if(error)return respond({error:'Account quota unavailable. Check database migration.'},503);
   if(data===null)return respond({error:'Daily account usage limit reached. Upgrade for more runs.',mode:'account',plan,limit,used:limit},429);
   if(typeof data!=='number'||data<1||data>limit)return respond({error:'Unexpected quota state'},503);
   return respond({mode:'account',plan,limit,used:data,userId:user.id});
  }
  const {data,error}=await db.from('daily_tool_usage').select('used')
   .eq('user_id',user.id).eq('usage_day',usageDay()).maybeSingle();
  if(error)return respond({error:'Account quota unavailable. Check database migration.'},503);
  return respond({mode:'account',plan,limit,used:data?.used??0,userId:user.id});
 }catch{return respond({error:'Unable to verify usage allowance'},503)}
}
export async function GET(request:NextRequest){return handler(request,'read')}
export async function POST(request:NextRequest){return handler(request,'consume')}
export async function PATCH(request:NextRequest){return handler(request,'sync')}
