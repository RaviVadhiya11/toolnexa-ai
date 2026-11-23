#!/usr/bin/env node
/**
 * ToolNexa PayPal live configuration audit (READ ONLY).
 *
 * Runs only when PAYPAL_LIVE_AUDIT_ENABLED=true in the Vercel Production build.
 * Calls only PayPal OAuth token, GET plan details / list and webhook details. Never creates subscriptions, invoices,
 * payments, plans, cancellations, or updates an existing resource.
 *
 * Logs labels and validation summaries; on a 404, a uniquely price-verified
 * replacement Plan ID may be shown. Never logs auth secrets, access tokens or
 * raw PayPal responses.
 * A failed audit never enables checkout. When checkout is enabled, failed
 * merchant validation prevents release; otherwise diagnostics are informational.
 */
const isEnabled=process.env.PAYPAL_LIVE_AUDIT_ENABLED==='true';
if(!isEnabled){
 console.log('PAYPAL_LIVE_AUDIT: skipped (explicit opt-in disabled)');
 if(process.env.PAYPAL_CHECKOUT_ENABLED==='true'){
  console.error('PAYPAL_LIVE_AUDIT: refusing checkout-enabled release without PayPal live audit');
  process.exitCode=1;
 }
}else{
 const tiers=[
  ['Starter','monthly','3.99','PAYPAL_PLAN_ID_STARTER','PAYPAL_PLAN_ID'],
  ['Pro','monthly','5.99','PAYPAL_PLAN_ID_PRO'],
  ['Premium','monthly','9.99','PAYPAL_PLAN_ID_PREMIUM'],
  ['Max','monthly','14.99','PAYPAL_PLAN_ID_MAX'],
  ['Starter','yearly','39.99','PAYPAL_PLAN_ID_STARTER_YEARLY'],
  ['Pro','yearly','59.99','PAYPAL_PLAN_ID_PRO_YEARLY'],
  ['Premium','yearly','99.99','PAYPAL_PLAN_ID_PREMIUM_YEARLY'],
  ['Max','yearly','149.99','PAYPAL_PLAN_ID_MAX_YEARLY']
 ];
 const problems=[];
 const emit=(name,ok,detail)=>{
  console.log('PAYPAL_LIVE_AUDIT '+(ok?'PASS':'FAIL')+' '+name+(detail?' '+detail:''));
  if(!ok)problems.push(name);
 };
 const config={
  env:process.env.PAYPAL_ENV,
  clientId:process.env.PAYPAL_CLIENT_ID,
  clientSecret:process.env.PAYPAL_CLIENT_SECRET,
  webhookId:process.env.PAYPAL_WEBHOOK_ID
 };
 if(config.env!=='live'||!config.clientId||!config.clientSecret){
  emit('Live credentials',false,'Missing or not configured for Live environment');
 }else{
  const base='https://api-m.paypal.com';
  const auth=Buffer.from(config.clientId+':'+config.clientSecret).toString('base64');
  let token='';
  const request=async(path,headers={},method='GET',body)=>{
   const response=await fetch(base+path,{
    method,headers,body,cache:'no-store',signal:AbortSignal.timeout(14000)
   });
   if(!response.ok)throw new Error('HTTP '+response.status);
   return response.json();
  };
  try{
   const access=await request('/v1/oauth2/token',{
    Authorization:'Basic '+auth,'Content-Type':'application/x-www-form-urlencoded'
   },'POST','grant_type=client_credentials');
   if(typeof access.access_token!=='string'||!access.access_token)
    throw new Error('Missing access token');
   token=access.access_token;
   emit('Live OAuth',true);
  }catch(e){
   emit('Live OAuth',false,e instanceof Error?e.message.slice(0,60):'Request failed');
  }
  if(token){
   const headers={Authorization:'Bearer '+token};
   const unique=new Set();
   // Read-only recovery for an incorrectly copied plan ID. Page through a
   // bounded list and confirm plan name + Live recurring USD amount before
   // showing a single non-secret PayPal Plan ID in private build logs.
   const locatePlan=async(tier,period,price)=>{
    const expectedName='ToolNexa AI '+tier+' '+(period==='yearly'?'Yearly':'Monthly');
    const candidates=[];
    for(let page=1;page<=5;page++){
     const list=await request('/v1/billing/plans?page_size=20&page='+page,headers);
     const entries=Array.isArray(list.plans)?list.plans:[];
     for(const entry of entries){
      if(entry?.name!==expectedName||entry?.status!=='ACTIVE'||typeof entry?.id!=='string'||!/^P-[A-Z0-9]+$/i.test(entry.id))continue;
      const detail=await request('/v1/billing/plans/'+encodeURIComponent(entry.id),headers);
      const c=detail.billing_cycles?.[0];
      if(detail.status==='ACTIVE'&&detail.billing_cycles?.length===1&&c?.tenure_type==='REGULAR'&&
         Number(c?.total_cycles)===0&&c?.frequency?.interval_count===1&&
         c?.frequency?.interval_unit===(period==='yearly'?'YEAR':'MONTH')&&
         c?.pricing_scheme?.fixed_price?.currency_code==='USD'&&
         Number(c?.pricing_scheme?.fixed_price?.value)===Number(price))candidates.push(entry.id);
     }
     if(entries.length<20)break;
    }
    return [...new Set(candidates)];
   };
   for(const [tier,period,price,key,legacy] of tiers){
    const label=tier+' '+period;
    const id=process.env[key]||(legacy?process.env[legacy]:'');
    if(!id||!/^P-[A-Z0-9]+$/i.test(id)){
     emit(label,false,'Plan ID missing or malformed');continue;
    }
    if(unique.has(id)){
     emit(label,false,'Duplicate Plan ID');continue;
    }
    unique.add(id);
    try{
     const plan=await request('/v1/billing/plans/'+encodeURIComponent(id),headers);
     const cycle=plan.billing_cycles?.[0];
     const found=Number(cycle?.pricing_scheme?.fixed_price?.value);
     const status=plan.status==='ACTIVE';
     const billing=plan.billing_cycles?.length===1&&cycle?.tenure_type==='REGULAR'&&
      Number(cycle?.total_cycles)===0&&cycle?.frequency?.interval_count===1&&
      cycle?.frequency?.interval_unit===(period==='monthly'?'MONTH':'YEAR');
     const amount=Number.isFinite(found)&&found===Number(price)&&
      cycle?.pricing_scheme?.fixed_price?.currency_code==='USD';
     emit(label,status&&billing&&amount,
      status&&billing&&amount?'Active, correct USD price and recurring cycle':
      'Check PayPal plan status, amount, currency or recurring cycle');
    }catch(e){
     const errorText=e instanceof Error?e.message.slice(0,60):'Request failed';
     emit(label,false,errorText);
     if(errorText==='HTTP 404'){
      try{
       const matches=await locatePlan(tier,period,price);
       if(matches.length===1)console.log('PAYPAL_LIVE_AUDIT_CANDIDATE '+label+' verified_live_plan_id='+matches[0]);
       else console.log('PAYPAL_LIVE_AUDIT_CANDIDATE '+label+' matching_plans='+matches.length);
      }catch{
       console.log('PAYPAL_LIVE_AUDIT_CANDIDATE '+label+' lookup_unavailable');
      }
     }
    }
   }
   if(!config.webhookId||typeof config.webhookId!=='string'||config.webhookId.trim().length<3||config.webhookId.length>128){
    emit('Webhook',false,'Webhook ID missing or improperly configured');
   }else{
    try{
     // PayPal is authoritative for webhook IDs. Do not guess an ID pattern:
     // real merchant webhook identifiers may use several formats.
     const hook=await request('/v1/notifications/webhooks/'+encodeURIComponent(config.webhookId.trim()),headers);
     const urlOk=typeof hook.url==='string'&&
      hook.url.replace(/\/+$/,'')==='https://toolnexa-ai.vercel.app/api/paypal/webhook';
     const events=new Set((Array.isArray(hook.event_types)?hook.event_types:[]).map(x=>x.name));
     const needed=['BILLING.SUBSCRIPTION.ACTIVATED','BILLING.SUBSCRIPTION.CANCELLED','BILLING.SUBSCRIPTION.SUSPENDED'];
     const eventOk=needed.every(x=>events.has(x)||events.has('*'));
     emit('Webhook',urlOk&&eventOk,
      urlOk&&eventOk?'Target URL and subscription events present':
      'Webhook URL or essential subscription event types differ');
    }catch(e){
     emit('Webhook',false,e instanceof Error?e.message.slice(0,60):'Request failed');
    }
   }
  }
 }
 console.log('PAYPAL_LIVE_AUDIT_RESULT='+(problems.length===0?'PASS':'FAIL')+
  ' checks_failed='+problems.length);
 console.log('PAYPAL_LIVE_AUDIT_NOTE=Read-only audit cannot prove merchant payment capture, webhook delivery or cancellation.');
 // Hard fail any attempt to publish an enabled checkout unless the read-only
 // PayPal plan/webhook audit has passed in this exact production build.
 // Do not enable checkout from Vercel settings before merchant acceptance.
 if(process.env.PAYPAL_CHECKOUT_ENABLED==='true' && problems.length){
  console.error('PAYPAL_LIVE_AUDIT: checkout-enabled release blocked by failed merchant verification');
  process.exitCode=1;
 }
}
