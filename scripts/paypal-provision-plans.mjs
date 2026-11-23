#!/usr/bin/env node
/**
 * Manual merchant-only PayPal plan provisioning; NEVER run during website build.
 *
 * Safe default: show plan configuration and exit without network or credentials.
 * Only an operator with access to a PayPal Business merchant account and an
 * existing PAYPAL_PRODUCT_ID can create new plans, one at a time.
 *
 * Example (sandbox first): PAYPAL_ENV=sandbox ... node scripts/paypal-provision-plans.mjs --only=Max-monthly --execute
 * Live additionally requires --confirm-live-payments.
 *
 * The tool NEVER enables checkout and NEVER changes existing subscriptions.
 * Capture and configure the returned Plan ID before creating another plan.
 */
import {randomUUID} from 'node:crypto';
const plans=[
 ['Starter','monthly','3.99','PAYPAL_PLAN_ID_STARTER'],
 ['Pro','monthly','5.99','PAYPAL_PLAN_ID_PRO'],
 ['Premium','monthly','9.99','PAYPAL_PLAN_ID_PREMIUM'],
 ['Max','monthly','14.99','PAYPAL_PLAN_ID_MAX'],
 ['Starter','yearly','39.99','PAYPAL_PLAN_ID_STARTER_YEARLY'],
 ['Pro','yearly','59.99','PAYPAL_PLAN_ID_PRO_YEARLY'],
 ['Premium','yearly','99.99','PAYPAL_PLAN_ID_PREMIUM_YEARLY'],
 ['Max','yearly','149.99','PAYPAL_PLAN_ID_MAX_YEARLY']
];
const args=process.argv.slice(2);
if(args.some(s=>!['--execute','--confirm-live-payments'].includes(s)&&!/^--only=(Starter|Pro|Premium|Max)-(monthly|yearly)$/.test(s))){
 console.error('Unknown option. Use --only=Max-monthly, --execute, and (for Live only) --confirm-live-payments.');
 process.exitCode=2;
}else{
 const requested=args.find(s=>s.startsWith('--only='))?.slice(7);
 const mode=process.env.PAYPAL_ENV||'sandbox';
 if(!['sandbox','live'].includes(mode)){
  console.error('PAYPAL_ENV must be sandbox or live.');process.exitCode=2;
 }else{
  const selected=plans.filter(([tier,period])=>!requested||requested===tier+'-'+period);
  console.log('PayPal '+mode.toUpperCase()+' billing plan preparation — '+(args.includes('--execute')?'CREATE':'DRY RUN'));
  for(const [tier,period,price,key] of selected){
   const configured=!!(process.env[key]||(key==='PAYPAL_PLAN_ID_STARTER'&&process.env.PAYPAL_PLAN_ID));
   console.log(key+': '+(configured?'ALREADY CONFIGURED; WILL NOT RECREATE':'NOT CONFIGURED')+
    ' | $'+price+' USD / '+period.toUpperCase()+' | '+tier+' fixed '+period+'ly recurrence');
  }
  if(args.includes('--execute')){
   const exitError=message=>{console.error(message);process.exitCode=1;};
   if(!requested)exitError('For safety, provide --only=Tier-monthly or --only=Tier-yearly to create ONE plan per run.');
   else if(mode==='live'&&!args.includes('--confirm-live-payments'))
    exitError('Live plans require --confirm-live-payments after verifying merchant eligibility, amounts and business details.');
   else if(!/^PROD-[A-Z0-9]+$/i.test(process.env.PAYPAL_PRODUCT_ID||''))
    exitError('Provide an existing PAYPAL_PRODUCT_ID from the SAME PayPal merchant environment.');
   else if(!process.env.PAYPAL_CLIENT_ID||!process.env.PAYPAL_CLIENT_SECRET)
    exitError('PayPal Client ID and Secret must be set privately in the operator environment.');
   else{
    const [tier,period,price,key]=selected[0];
    if(process.env[key]||(key==='PAYPAL_PLAN_ID_STARTER'&&process.env.PAYPAL_PLAN_ID)){
     exitError('Plan ID already configured. Refusing to create a duplicate.');
    }else{
     const base=mode==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';
     const id=process.env.PAYPAL_CLIENT_ID,secret=process.env.PAYPAL_CLIENT_SECRET;
     try{
      const tokenResponse=await fetch(base+'/v1/oauth2/token',{
       method:'POST',headers:{
        Authorization:'Basic '+Buffer.from(id+':'+secret).toString('base64'),
        'Content-Type':'application/x-www-form-urlencoded'
       },body:'grant_type=client_credentials',cache:'no-store'
      });
      if(!tokenResponse.ok)throw Error('PayPal merchant authentication rejected ('+tokenResponse.status+').');
      const token=(await tokenResponse.json()).access_token;
      if(typeof token!=='string'||!token)throw Error('PayPal authentication did not return a token.');
      const body={
       product_id:process.env.PAYPAL_PRODUCT_ID,
       name:'ToolNexa AI '+tier+' '+(period==='monthly'?'Monthly':'Yearly'),
       description:tier+' subscription. Daily tools: '+({Starter:500,Pro:1000,Premium:1500,Max:3000}[tier])+
        '. Batch analyzer texts: '+({Starter:20,Pro:60,Premium:150,Max:300}[tier])+'. No paid AI credits.',
       billing_cycles:[{
        frequency:{interval_unit:period==='monthly'?'MONTH':'YEAR',interval_count:1},
        tenure_type:'REGULAR',sequence:1,total_cycles:0,
        pricing_scheme:{fixed_price:{value:price,currency_code:'USD'}}
       }],
       payment_preferences:{auto_bill_outstanding:true,payment_failure_threshold:1}
      };
      const response=await fetch(base+'/v1/billing/plans',{
       method:'POST',headers:{
        Authorization:'Bearer '+token,'Content-Type':'application/json',
        'PayPal-Request-Id':randomUUID()
       },body:JSON.stringify(body),cache:'no-store'
      });
      if(!response.ok)throw Error('PayPal rejected plan creation ('+response.status+'). Verify merchant recurring billing eligibility.');
      const plan=await response.json();
      if(typeof plan.id!=='string'||!/^P-[A-Z0-9]+$/i.test(plan.id))
       throw Error('Unexpected PayPal Plan ID; check the merchant dashboard before retrying.');
      const check=await fetch(base+'/v1/billing/plans/'+encodeURIComponent(plan.id),{
       headers:{Authorization:'Bearer '+token},cache:'no-store'
      });
      if(!check.ok)throw Error('Created plan but verification request failed. Look up the newly created plan in PayPal.');
      const verified=await check.json(),cycle=verified.billing_cycles?.[0];
      const valid=verified.status==='ACTIVE'&&verified.product_id===body.product_id&&
       verified.billing_cycles?.length===1&&cycle?.tenure_type==='REGULAR'&&
       cycle?.total_cycles===0&&cycle?.frequency?.interval_unit===body.billing_cycles[0].frequency.interval_unit&&
       cycle?.frequency?.interval_count===1&&cycle?.pricing_scheme?.fixed_price?.value===price&&
       cycle?.pricing_scheme?.fixed_price?.currency_code==='USD';
      if(!valid)throw Error('Plan created but the returned price, recurrence or status differs. Do not enable checkout.');
      console.log('VERIFIED NEW PAYPAL PLAN: '+key+'='+plan.id);
      console.log('Set this ID in Vercel Production, then test subscription/webhook/cancellation. Checkout stays OFF.');
     }catch(err){exitError(err instanceof Error?err.message:'Unknown PayPal setup error');}
    }
   }
  }else{
   console.log('No PayPal API called. To create one plan, set merchant credentials privately and pass --only=Tier-period --execute.');
   if(mode==='live')console.log('Live creation also requires --confirm-live-payments. Always test in Sandbox first.');
  }
 }
}
