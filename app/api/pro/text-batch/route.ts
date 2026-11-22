import {NextRequest,NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {paypalPlanId,paypalSubscription} from '@/lib/paypal';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 const auth=await serverSupabase();
 const {data:{user}}=auth?await auth.auth.getUser():{data:{user:null}};
 if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
 const db=adminDb();
 if(!db)return NextResponse.json({error:'Service unavailable'},{status:503});
 // An ACTIVE database row can be stale after a missed cancellation webhook.
 // Confirm the live PayPal state before every premium operation; fail closed if unavailable.
 if(process.env.PAYPAL_ENV!=='live'||!paypalPlanId)
  return NextResponse.json({error:'Pro verification unavailable'},{status:503});
 const {data,error}=await db.from('paypal_subscriptions')
  .select('subscription_id').eq('user_id',user.id).eq('plan_id',paypalPlanId).eq('status','ACTIVE').limit(1);
 if(error)return NextResponse.json({error:'Unable to verify membership'},{status:503});
 if(!data?.length)return NextResponse.json({error:'Active Pro subscription required'},{status:403});
 let subscription;
 try{subscription=await paypalSubscription(data[0].subscription_id)}
 catch{return NextResponse.json({error:'PayPal verification temporarily unavailable'},{status:503})}
 const valid=subscription.id===data[0].subscription_id && subscription.plan_id===paypalPlanId &&
  subscription.custom_id===user.id && subscription.status==='ACTIVE';
 if(!valid){
  // Reconcile a real status change without ever granting access from an untrusted result.
  if(subscription.id===data[0].subscription_id && subscription.plan_id===paypalPlanId &&
    subscription.custom_id===user.id && subscription.status!=='ACTIVE'){
   await db.from('paypal_subscriptions').update({status:subscription.status,updated_at:new Date().toISOString()})
    .eq('subscription_id',subscription.id).eq('user_id',user.id).eq('plan_id',paypalPlanId);
  }
  return NextResponse.json({error:'Active Pro subscription required'},{status:403});
 }
 let payload:unknown;
 try{payload=await request.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 const texts=(payload as {texts?:unknown})?.texts;
 if(!Array.isArray(texts)||texts.length<1||texts.length>20||texts.some(x=>typeof x!=='string'||x.length>20000))return NextResponse.json({error:'Supply 1–20 text entries (max 20,000 characters each)'},{status:400});
 const results=(texts as string[]).map((value,index)=>{
  const words=value.trim().match(/\S+/gu)||[];
  const sentences=value.match(/[^.!?]+[.!?]+|[^.!?]+$/gu)||[];
  const lines=value.length?value.split(/\r?\n/u).length:0;
  return {item:index+1,characters:value.length,words:words.length,sentences:value.trim()?sentences.length:0,lines,readingMinutes:Math.round(words.length/200*100)/100};
 });
 return NextResponse.json({results},{headers:{'Cache-Control':'no-store'}});
}
