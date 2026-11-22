import {NextRequest,NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {paypalBase,paypalTierSettings,paypalSubscription,paypalToken,tierForPayPalPlan} from '@/lib/paypal';

export const runtime='nodejs';
type Tier='Starter'|'Pro'|'Premium';
const tiers=new Set<Tier>(['Starter','Pro','Premium']);
const noStore={'Cache-Control':'no-store'};

export async function POST(request:NextRequest){
 try{
  if(process.env.PAYPAL_CHECKOUT_ENABLED!=='true'||process.env.PAYPAL_ENV!=='live'||
     !process.env.PAYPAL_CLIENT_ID||!process.env.PAYPAL_CLIENT_SECRET||
     !process.env.PAYPAL_WEBHOOK_ID)
   return NextResponse.json({error:'Live PayPal checkout is unavailable'},{status:503,headers:noStore});
  const origin=request.headers.get('origin');
  if(!origin||origin!==request.nextUrl.origin)
   return NextResponse.json({error:'Invalid request origin'},{status:403,headers:noStore});
  const auth=await serverSupabase();
  const {data:{user}}=auth?await auth.auth.getUser():{data:{user:null}};
  if(!user)return NextResponse.json({error:'Sign in required'},{status:401,headers:noStore});
  const body=await request.json();
  const tier=body?.tier as Tier;
  if(typeof tier!=='string'||!tiers.has(tier))
   return NextResponse.json({error:'Invalid subscription tier'},{status:400,headers:noStore});
  const planId=paypalTierSettings[tier].planId;
  if(!planId||tierForPayPalPlan(planId)!==tier)
   return NextResponse.json({error:'Subscription plan not configured'},{status:503,headers:noStore});

  // Prevent accidental duplicate subscriptions for already subscribed users.
  const db=adminDb();
  if(!db)return NextResponse.json({error:'Membership service unavailable'},{status:503,headers:noStore});
  const {data:existing,error:existingError}=await db.from('paypal_subscriptions')
   .select('subscription_id,plan_id').eq('user_id',user.id)
   .in('plan_id',Object.values(paypalTierSettings).map(p=>p.planId).filter(Boolean))
   .in('status',['APPROVED','ACTIVE']).limit(20);
  if(existingError)return NextResponse.json({error:'Membership lookup unavailable'},{status:503,headers:noStore});
  for(const entry of existing??[]){
   let subscription;
   try{subscription=await paypalSubscription(entry.subscription_id)}
   catch{return NextResponse.json({error:'Could not verify existing membership'},{status:503,headers:noStore})}
   if(subscription.custom_id===user.id&&subscription.plan_id===entry.plan_id&&
      ['APPROVED','ACTIVE'].includes(subscription.status))
    return NextResponse.json({error:'You already have an approved or active subscription. Manage the existing plan before starting another.'},{status:409,headers:noStore});
  }

  const token=await paypalToken();
  // Fixed, trusted return URLs avoid untrusted Host header based redirects.
  const site='https://toolnexa-ai.vercel.app';
  const response=await fetch(paypalBase+'/v1/billing/subscriptions',{
   method:'POST',
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',
    'PayPal-Request-Id':'toolnexa-'+user.id.slice(0,8)+'-'+crypto.randomUUID()},
   body:JSON.stringify({
    plan_id:planId,custom_id:user.id,
    application_context:{
     brand_name:'ToolNexa AI',user_action:'SUBSCRIBE_NOW',
     return_url:site+'/subscribe/return',
     cancel_url:site+'/pricing?checkout=cancelled'
    }
   }),cache:'no-store'
  });
  if(!response.ok){
   // Do not leak raw PayPal response or credentials to the customer.
   return NextResponse.json({error:'PayPal could not start this subscription. Please contact support if it continues.'},{status:502,headers:noStore});
  }
  const result=await response.json() as {id?:string;links?:{href?:string;rel?:string}[]};
  const link=result.links?.find(l=>l.rel==='approve')?.href;
  if(!link)return NextResponse.json({error:'PayPal approval link unavailable'},{status:502,headers:noStore});
  const url=new URL(link);
  if(url.protocol!=='https:'||!(url.hostname==='paypal.com'||url.hostname.endsWith('.paypal.com')))
   return NextResponse.json({error:'Invalid payment approval destination'},{status:502,headers:noStore});
  return NextResponse.json({approvalUrl:url.toString()},{headers:noStore});
 }catch{return NextResponse.json({error:'Unable to start subscription'},{status:502,headers:noStore})}
}
