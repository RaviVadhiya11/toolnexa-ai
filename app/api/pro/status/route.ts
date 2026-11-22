import {NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
export const runtime='nodejs';
export async function GET(){
 try{
  const auth=await serverSupabase();
  const {data:{user},error:authError}=auth?await auth.auth.getUser():{data:{user:null},error:null};
  if(authError||!user)return NextResponse.json({plan:'Free',authenticated:false},{headers:{'Cache-Control':'no-store'}});
  const db=adminDb();
  if(!db||!process.env.PAYPAL_PLAN_ID)return NextResponse.json({error:'Membership service unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
  const {data,error}=await db.from('paypal_subscriptions').select('subscription_id').eq('user_id',user.id).eq('plan_id',process.env.PAYPAL_PLAN_ID).eq('status','ACTIVE').limit(1);
  if(error)return NextResponse.json({error:'Membership lookup failed'},{status:503,headers:{'Cache-Control':'no-store'}});
  return NextResponse.json({plan:data?.length?'Pro':'Free',authenticated:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Membership service unavailable'},{status:503,headers:{'Cache-Control':'no-store'})}
}
