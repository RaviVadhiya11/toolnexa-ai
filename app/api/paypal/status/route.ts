import {NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
export const runtime='nodejs';
export async function GET(){
 const auth=await serverSupabase();const {data:{user}}=auth?await auth.auth.getUser():{data:{user:null}};
 if(!user)return NextResponse.json({active:false},{status:401,headers:{'Cache-Control':'no-store'}});
 const db=adminDb();const planId=process.env.PAYPAL_PLAN_ID;
 if(!db||!planId)return NextResponse.json({active:false},{status:503,headers:{'Cache-Control':'no-store'}});
 const {data,error}=await db.from('paypal_subscriptions').select('subscription_id').eq('user_id',user.id).eq('plan_id',planId).eq('status','ACTIVE').limit(1);
 if(error)return NextResponse.json({active:false},{status:503,headers:{'Cache-Control':'no-store'}});
 return NextResponse.json({active:!!data?.length},{headers:{'Cache-Control':'no-store'}});
}
