import {NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {configuredPayPalPlanIds,paypalSubscription,planForPayPalPlan} from '@/lib/paypal';
export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};
export async function GET(){
 try{
  const auth=await serverSupabase();
  const {data:{user},error:authError}=auth?await auth.auth.getUser():{data:{user:null},error:null};
  if(authError||!user)return NextResponse.json({active:false},{status:401,headers});
  const db=adminDb();
  if(!db)return NextResponse.json({error:'Membership verification unavailable'},{status:503,headers});
  const {data,error}=await db.from('paypal_subscriptions').select('subscription_id,plan_id')
   .eq('user_id',user.id).eq('status','ACTIVE').limit(20);
  if(error)return NextResponse.json({error:'Membership lookup unavailable'},{status:503,headers});
  if(!data?.length)return NextResponse.json({active:false},{headers});
  const ids=configuredPayPalPlanIds();
  if(process.env.PAYPAL_ENV!=='live'||!ids.length||data.some(row=>!ids.includes(row.plan_id)))
   return NextResponse.json({error:'PayPal verification unavailable'},{status:503,headers});
  const active:{tier:string;billingPeriod:string}[]=[];
  for(const row of data){
   const membership=await paypalSubscription(row.subscription_id);
   const matched=planForPayPalPlan(row.plan_id);
   if(membership.id===row.subscription_id&&membership.plan_id===row.plan_id&&
      membership.custom_id===user.id&&membership.status==='ACTIVE'&&matched)active.push(matched);
  }
  return NextResponse.json({active:active.length>0,plans:active},{headers});
 }catch{return NextResponse.json({error:'Membership verification unavailable'},{status:503,headers})}
}
