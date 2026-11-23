#!/usr/bin/env node
/**
 * ToolNexa PayPal live configuration audit (READ ONLY).
 *
 * Runs only when PAYPAL_LIVE_AUDIT_ENABLED=true in the Vercel Production build.
 * Calls only PayPal OAuth token, GET /v1/billing/plans/{id}, and
 * GET /v1/notifications/webhooks/{id}. Never creates subscriptions, invoices,
 * payments, plans, cancellations, or updates an existing resource.
 *
 * Logs only labels, HTTP status codes and validation summaries. Does not log
 * credentials, access tokens, PayPal IDs, or returned PayPal responses.
 * A failed audit never enables or disables checkout and must not fail website
 * builds; merchant read-only diagnostics are informational.
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
     emit(label,false,e instanceof Error?e.message.slice(0,60):'Request failed');
    }
   }
   if(!config.webhookId||!/^[A-Z0-9-]{8,80}$/i.test(config.webhookId)){
    emit('Webhook',false,'Webhook ID missing or malformed');
   }else{
    try{
     const hook=await request('/v1/notifications/webhooks/'+encodeURIComponent(config.webhookId),headers);
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
