import {NextRequest,NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';
import {adminDb} from '@/lib/admin';
import {paypalBase,paypalPlanIdForCheckout,configuredPayPalPlanIds,paypalSubscription,paypalToken} from '@/lib/paypal';

export const runtime='nodejs';
import {paidTiers,billingPeriods,subscriptionPrices,type PaidTier,type BillingPeriod} from '@/lib/subscription-pricing';
const noStore={'Cache-Control':'no-store'};

export async function POST(request:NextRequest){
 let stage='setup';
 try{
  if(process.env.PAYPAL_CHECKOUT_ENABLED!=='true'||process.env.PAYPAL_ENV!=='live'||
     !process.env.PAYPAL_CLIENT_ID||!process.env.PAYPAL_CLIENT_SECRET||
     !process.env.PAYPAL_WEBHOOK_ID)
   return NextResponse.json({error:'Live PayPal checkout is unavailable'},{status:503,headers:noStore});
  const origin=request.headers.get('origin');
  if(!origin||origin!==request.nextUrl.origin)
   return NextResponse.json({error:'Invalid request origin'},{status:403,headers:noStore});
  stage='authentication';
  const auth=await serverSupabase();
  const {data:{user}}=auth?await auth.auth.getUser():{data:{user:null}};
  if(!user)return NextResponse.json({error:'Sign in required'},{status:401,headers:noStore});
  const body=await request.json();
  const tier=body?.tier as PaidTier;
  const billingPeriod=body?.billingPeriod ?? 'monthly';
  if(typeof tier!=='string'||!paidTiers.includes(tier))
   return NextResponse.json({error:'Invalid subscription tier'},{status:400,headers:noStore});
  if(!billingPeriods.includes(billingPeriod as BillingPeriod))
   return NextResponse.json({error:'Invalid billing period'},{status:400,headers:noStore});
  if(billingPeriod==='yearly'&&process.env.PAYPAL_YEARLY_CHECKOUT_ENABLED!=='true')
   return NextResponse.json({error:'Yearly checkout is not enabled yet'},{status:503,headers:noStore});
  const planId=paypalPlanIdForCheckout(tier,billingPeriod as BillingPeriod);
  if(!planId)
   return NextResponse.json({error:'Subscription plan not configured'},{status:503,headers:noStore});

  // Prevent accidental duplicate subscriptions for already subscribed users.
  const db=adminDb();
  if(!db)return NextResponse.json({error:'Membership service unavailable'},{status:503,headers:noStore});
  stage='membership_lookup';
  const {data:existing,error:existingError}=await db.from('paypal_subscriptions')
   .select('subscription_id,plan_id').eq('user_id',user.id)
   .in('plan_id',configuredPayPalPlanIds())
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

  stage='paypal_authentication';
  const token=await paypalToken();
  if(billingPeriod==='yearly'){
   stage='paypal_validate_yearly_plan';
   // Confirm the real PayPal billing amount and recurrence before charging.
   const detailResponse=await fetch(paypalBase+'/v1/billing/plans/'+encodeURIComponent(planId),{
    headers:{Authorization:'Bearer '+token},cache:'no-store'
   });
   if(!detailResponse.ok)return NextResponse.json({error:'Annual PayPal plan details could not be verified'},{status:503,headers:noStore});
   const details=await detailResponse.json() as {
    status?:string;billing_cycles?:Array<{
     tenure_type?:string;total_cycles?:number;
     frequency?:{interval_unit?:string;interval_count?:number};
     pricing_scheme?:{fixed_price?:{currency_code?:string;value?:string}}
    }>
   };
   const cycles=details.billing_cycles??[];
   const cycle=cycles[0];
   const expectedPrice=Number(subscriptionPrices[tier].yearly);
   const actualPrice=Number(cycle?.pricing_scheme?.fixed_price?.value);
   if(details.status!=='ACTIVE'||cycles.length!==1||cycle?.tenure_type!=='REGULAR'||
      cycle.total_cycles!==0||cycle.frequency?.interval_unit!=='YEAR'||
      cycle.frequency.interval_count!==1||cycle.pricing_scheme?.fixed_price?.currency_code!=='USD'||
      !Number.isFinite(actualPrice)||actualPrice!==expectedPrice)
    return NextResponse.json({error:'Annual PayPal plan amount or renewal frequency does not match the published price. Checkout is disabled for safety.'},{status:503,headers:noStore});
  }
  stage='paypal_create_subscription';
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
   // Only log PayPal's sanitized issue codes, HTTP status, and debug ID.
   // Never log bearer tokens, user identifiers, request bodies, or credentials.
   let issue='UNKNOWN';
   try{
    const payload=await response.json() as {
     name?:string;details?:{issue?:string;field?:string}[];debug_id?:string
    };
    issue=String(payload.details?.[0]?.issue||payload.name||'UNKNOWN').slice(0,80);
    console.error('PayPal subscription create rejected',{
     status:response.status,
     issue,
     field:String(payload.details?.[0]?.field||'').slice(0,80),
     debugId:String(payload.debug_id||response.headers.get('paypal-debug-id')||'').slice(0,80)
    });
   }catch{
    console.error('PayPal subscription create rejected',{status:response.status});
   }
   return NextResponse.json({
    error:response.status===400
     ?'PayPal rejected the subscription request. The merchant must check the plan and PayPal error details.'
     :response.status===401||response.status===403
      ?'PayPal rejected the live API credentials or account permissions.'
      :'PayPal could not start this subscription. Please contact support if it continues.'
   },{status:502,headers:noStore});
  }
  const result=await response.json() as {id?:string;links?:{href?:string;rel?:string}[]};
  const link=result.links?.find(l=>l.rel==='approve')?.href;
  if(!link)return NextResponse.json({error:'PayPal approval link unavailable'},{status:502,headers:noStore});
  const url=new URL(link);
  if(url.protocol!=='https:'||!(url.hostname==='paypal.com'||url.hostname.endsWith('.paypal.com')))
   return NextResponse.json({error:'Invalid payment approval destination'},{status:502,headers:noStore});
  return NextResponse.json({approvalUrl:url.toString()},{headers:noStore});
 }catch(error){
  // A stage label identifies the failing subsystem without exposing sensitive values.
  console.error('PayPal hosted subscription unexpected failure',{stage,errorType:error instanceof Error?error.name:'Unknown'});
  return NextResponse.json({error:stage==='paypal_authentication'?'PayPal live API authentication failed. Check the Live Client ID and Secret in Vercel.':stage==='membership_lookup'?'Could not access subscription records. Check Supabase configuration.':'Unable to start subscription. Please contact support.'},{status:502,headers:noStore});
 }
}
