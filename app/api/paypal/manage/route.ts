import {NextRequest,NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {configuredPayPalPlanIds,paypalBase,paypalSubscription,paypalToken,tierForPayPalPlan} from '@/lib/paypal';

export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};
const reply=(data:object,status=200)=>NextResponse.json(data,{status,headers});
const activeStatuses=new Set(['ACTIVE','APPROVED','SUSPENDED']);
type MemberRow={subscription_id:string;plan_id:string;status:string};
type VerifiedMember={id:string;tier:string;status:string;nextBillingTime:string|null};
async function currentUser(){
 const auth=await serverSupabase();
 const {data:{user},error}=auth?await auth.auth.getUser():{data:{user:null},error:null};
 return error?null:user;
}
async function membershipRows(userId:string){
 const db=adminDb();
 const planIds=configuredPayPalPlanIds();
 if(!db||process.env.PAYPAL_ENV!=='live'||!planIds.length)throw new Error('configuration');
 const {data,error}=await db.from('paypal_subscriptions')
  .select('subscription_id,plan_id,status').eq('user_id',userId)
  .in('plan_id',planIds).order('updated_at',{ascending:false}).limit(30);
 if(error)throw new Error('database');
 return {db,rows:(data??[]) as MemberRow[]};
}
async function verifyRow(row:MemberRow,userId:string):Promise<VerifiedMember|null>{
 const subscription=await paypalSubscription(row.subscription_id);
 if(subscription.id!==row.subscription_id||subscription.plan_id!==row.plan_id||
    subscription.custom_id!==userId)return null;
 const tier=tierForPayPalPlan(subscription.plan_id);
 if(!tier)return null;
 return {id:subscription.id,tier,status:subscription.status,
  nextBillingTime:subscription.status==='ACTIVE'?(subscription.billing_info?.next_billing_time??null):null};
}

export async function GET(){
 try{
  const user=await currentUser();
  if(!user)return reply({error:'Sign in to manage subscriptions'},401);
  const {db,rows}=await membershipRows(user.id);
  const subscriptions:VerifiedMember[]=[];
  for(const row of rows){
   const verified=await verifyRow(row,user.id);
   if(!verified)continue;
   if(verified.status!==row.status){
    const {error}=await db.from('paypal_subscriptions')
     .update({status:verified.status,updated_at:new Date().toISOString()})
     .eq('subscription_id',row.subscription_id).eq('user_id',user.id).eq('plan_id',row.plan_id);
    if(error)throw new Error('database');
   }
   subscriptions.push(verified);
  }
  return reply({subscriptions});
 }catch{return reply({error:'Unable to load subscriptions. Please try again.'},503)}
}

export async function POST(request:NextRequest){
 try{
  if(process.env.PAYPAL_ENV!=='live')return reply({error:'Subscription management unavailable'},503);
  const origin=request.headers.get('origin');
  if(!origin||origin!==request.nextUrl.origin)return reply({error:'Invalid request origin'},403);
  const user=await currentUser();
  if(!user)return reply({error:'Sign in required'},401);
  const body=await request.json();
  const id=body?.subscriptionId;
  if(body?.action!=='cancel'||body?.confirmation!==true||typeof id!=='string'||
     !/^I-[A-Z0-9]+$/i.test(id))return reply({error:'Invalid cancellation request'},400);
  const {db,rows}=await membershipRows(user.id);
  const row=rows.find(record=>record.subscription_id===id);
  if(!row)return reply({error:'Subscription not found for this account'},404);
  const verified=await verifyRow(row,user.id);
  if(!verified)return reply({error:'Unable to verify subscription ownership'},403);
  if(verified.status==='CANCELLED'){
   const {error}=await db.from('paypal_subscriptions')
    .update({status:'CANCELLED',updated_at:new Date().toISOString()})
    .eq('subscription_id',id).eq('user_id',user.id).eq('plan_id',row.plan_id);
   if(error)return reply({error:'Unable to save cancellation status'},503);
   return reply({ok:true,status:'CANCELLED'});
  }
  if(!activeStatuses.has(verified.status))
   return reply({error:'This subscription is not eligible for cancellation',status:verified.status},409);
  const token=await paypalToken();
  const response=await fetch(paypalBase+'/v1/billing/subscriptions/'+encodeURIComponent(id)+'/cancel',{
   method:'POST',
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify({reason:'Customer requested cancellation in ToolNexa AI account dashboard'}),
   cache:'no-store'
  });
  if(response.status!==204){
   // Avoid promising cancellation if PayPal rejects or times out.
   console.error('PayPal subscription cancel failed',{status:response.status});
   return reply({error:'PayPal did not confirm cancellation. Please retry or manage it directly in PayPal.'},502);
  }
  // Independently confirm PayPal's current state; never infer cancellation from a database write alone.
  const after=await verifyRow(row,user.id);
  if(!after)return reply({error:'PayPal accepted the request, but verification is pending. Refresh later.'},202);
  const {error}=await db.from('paypal_subscriptions')
   .update({status:after.status,updated_at:new Date().toISOString()})
   .eq('subscription_id',id).eq('user_id',user.id).eq('plan_id',row.plan_id);
  if(error)return reply({error:'PayPal processed the request, but the dashboard could not sync yet. Refresh later.'},202);
  if(after.status!=='CANCELLED')
   return reply({error:'PayPal processed the cancellation request. Final status is pending; refresh shortly.',status:after.status},202);
  return reply({ok:true,status:'CANCELLED'});
 }catch{return reply({error:'Unable to confirm the cancellation. Check your PayPal account before trying again.'},503)}
}
