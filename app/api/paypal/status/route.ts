import {NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
export const runtime='nodejs';
export async function GET(){
 const auth=await serverSupabase();const {data:{user}}=auth?await auth.auth.getUser():{data:{user:null}};
 if(!user)return NextResponse.json({active:false},{status:401});
 const db=adminDb();if(!db)return NextResponse.json({active:false},{status:503});
 const {data,error}=await db.from('paypal_subscriptions').select('status').eq('user_id',user.id).eq('status','ACTIVE').limit(1);
 if(error)return NextResponse.json({active:false},{status:503});
 return NextResponse.json({active:!!data?.length},{headers:{'Cache-Control':'no-store'}});
}
