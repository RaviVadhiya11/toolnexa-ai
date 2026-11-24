'use client';
import {useEffect,useState} from 'react';
import {PayPalSubscribe} from '@/components/paypal-subscribe';
import {billingPeriods,paidTiers,subscriptionPrices,type BillingPeriod,type PaidTier} from '@/lib/subscription-pricing';

const tiers:{name:PaidTier;tagline:string;features:string[]}[]=[
 {name:'Starter',tagline:'For everyday productivity',features:['60 utility tools','20 texts per batch request','20,000 characters per text','500 tool runs per day','2× image upscale','ZIP Maker: 50 files / 100 MB']},
 {name:'Pro',tagline:'For creators and professionals',features:['60 utility tools','60 texts per batch request','20,000 characters per text','1,000 tool runs per day','Pro HD vector PNG downloads','HD image JPEG upscaling (2×/4×)','HD transparent background PNG exports','4K upscale export','Passport 600-PPI print PDF and 2× social exports','ZIP Maker: 200 files / 300 MB']},
 {name:'Premium',tagline:'For higher-volume workflows',features:['60 utility tools','150 texts per batch request','20,000 characters per text','1,500 tool runs per day','Pro HD vector PNG downloads','HD image JPEG upscaling (2×/4×)','HD transparent background PNG exports','4K and 8K upscale export','Passport 600-PPI print PDF and 2× social exports','Batch Pro+ ZIP export of up to 8 images','ZIP Maker: 500 files / 600 MB']},
 {name:'Max',tagline:'High-capacity creator and business toolkit',features:['60 utility tools','300 texts per batch request','20,000 characters per text','3,000 tool runs per day','Pro HD vector PNG downloads','HD image JPEG upscaling (2×/4×)','HD transparent background PNG exports','4K and 8K upscale export','Batch Pro+ ZIP export of up to 8 images','Gemini AI preview: 3 generations/day (shared free allowance)','ZIP Maker: 1,000 files / 1 GB']}
];

type PlanIds=Record<BillingPeriod,Record<PaidTier,string>>;
export function PremiumPricing({clientId,plans,enabled,yearlyEnabled,maxEnabled}:{
 clientId:string;plans:PlanIds;enabled:boolean;yearlyEnabled:boolean;maxEnabled:boolean
}){
 const [billingPeriod,setBillingPeriod]=useState<BillingPeriod>('monthly');
 const [selected,setSelected]=useState<PaidTier|null>(null);
 const [paymentMethod,setPaymentMethod]=useState<'paypal'|'phonepe'>('paypal');
 useEffect(()=>{
  const chosen=new URLSearchParams(window.location.search).get('plan');
  if(chosen&&paidTiers.includes(chosen as PaidTier)){
   setSelected(chosen as PaidTier);
   requestAnimationFrame(()=>document.getElementById('subscription-checkout')?.scrollIntoView({behavior:'smooth',block:'start'}));
  }
 },[]);
 const planId=selected?plans[billingPeriod][selected]:'';
 const allIds=billingPeriods.flatMap(period=>paidTiers.map(tier=>plans[period][tier])).filter(Boolean);
 const isReady=(tier:PaidTier)=>enabled&&(billingPeriod==='monthly'||yearlyEnabled)&&(tier!=='Max'||maxEnabled)&&
  !!plans[billingPeriod][tier]&&allIds.filter(id=>id===plans[billingPeriod][tier]).length===1;
 const available=!!selected&&isReady(selected);
 const periodLabel=billingPeriod==='monthly'?'month':'year';
 const selectedPrice=selected?subscriptionPrices[selected][billingPeriod]:null;
 return <section aria-label="Monthly and yearly subscription pricing">
  <header className="pricing-intro">
   <span className="tier-tag">TOOLNEXA AI PREMIUM</span>
   <h1>Simple plans. More possibilities.</h1>
   <p>Choose monthly or yearly recurring access. Yearly billing is paid upfront for 12 months and saves approximately 16% compared with paying monthly. All 60 utility tools and 11 Studio workspaces share the same daily allowance in either billing period.</p>
  </header>
  <div className="flex flex-wrap justify-center items-center gap-3 mt-6 mb-6" role="group" aria-label="Choose billing period">
   {billingPeriods.map(period=><button type="button" key={period}
    className={billingPeriod===period?'button':'button outline'}
    aria-pressed={billingPeriod===period}
    onClick={()=>setBillingPeriod(period)}>
    {period==='monthly'?'Monthly':'Yearly · Save ~16%'}
   </button>)}
  </div>
  <p className="muted text-sm text-center mb-5" role="status">
   {billingPeriod==='yearly'?'Prices below are billed once per year and renew annually. Yearly checkout requires a verified PayPal annual plan.':'Prices below recur every month. You may switch to the yearly price view above.'}
  </p>
  <div className="tier-grid">
   {tiers.map(tier=>{
    const ready=isReady(tier.name);
    const active=selected===tier.name;
    const price=subscriptionPrices[tier.name][billingPeriod];
    const monthlyEquivalent=(Number(subscriptionPrices[tier.name].yearly)/12).toFixed(2);
    return <article className={`tier-card ${tier.name==='Pro'?'featured':''} ${tier.name==='Max'?'flagship-gold-tier':''}`} key={tier.name}>
     {tier.name==='Pro'&&<span className="popular-label">MOST POPULAR</span>}
     {tier.name==='Max'&&<span className="flagship-tier-ribbon">✦ FLAGSHIP MAX</span>}
     <div><span className="tier-tag">{tier.name}</span><h2 className="mt-2">{tier.name}</h2><p className="muted text-sm mt-2">{tier.tagline}</p></div>
     <p className="tier-price">${price}<span> / {periodLabel}</span></p>
     {billingPeriod==='yearly'&&<p className="muted text-sm mt-2">Equivalent to ${monthlyEquivalent}/month · billed ${price} upfront yearly</p>}
     <ul className="tier-features">{[...tier.features,billingPeriod==='yearly'?'12-month recurring subscription':'Monthly recurring subscription'].map(feature=><li key={feature}>{feature}</li>)}</ul>
     <button type="button" className={`tier-cta ${active?'selected':''}`}
      onClick={()=>{setSelected(tier.name);document.getElementById('subscription-checkout')?.scrollIntoView({behavior:'smooth',block:'center'})}}
      aria-pressed={active}>
      {active?'Selected — continue below':ready?'Choose '+tier.name:'View '+tier.name+' plan'}
     </button>
     {!ready&&<p className="small-note">{billingPeriod==='yearly'?'Yearly PayPal checkout is not yet configured for this tier.':'Subscription checkout for this tier is not yet configured.'}</p>}
    </article>;
   })}
  </div>
  <div id="subscription-checkout" className="subscribe-panel" aria-live="polite">
   {selected?<>
    <h2 className="text-xl font-extrabold">Choose how to pay for {selected}</h2>
    <p className="muted text-sm mt-2">Both gateways stay on ToolNexa AI. PayPal subscriptions are billed in USD. PhonePe PG is intended for India with INR and recurring AutoPay after your merchant setup is approved.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5" role="group" aria-label="Select payment gateway">
     <button type="button" aria-pressed={paymentMethod==='paypal'} onClick={()=>setPaymentMethod('paypal')}
      className={`rounded-2xl border text-left p-4 transition-colors ${paymentMethod==='paypal'?'border-cyan-300 bg-indigo-600/25 shadow-[0_0_20px_rgba(76,194,255,.12)]':'border-indigo-400/30 bg-slate-900/40 hover:border-indigo-300/70'}`}>
      <span className="block font-extrabold text-base text-white">🌍 PayPal</span>
      <span className="block text-xs text-slate-300 mt-1">International · USD · Recurring</span>
      <span className="block text-xs text-cyan-200 font-semibold mt-2">{available?'Live checkout available':'View checkout status'}</span>
     </button>
     <button type="button" aria-pressed={paymentMethod==='phonepe'} onClick={()=>setPaymentMethod('phonepe')}
      className={`rounded-2xl border text-left p-4 transition-colors ${paymentMethod==='phonepe'?'border-violet-300 bg-violet-600/25 shadow-[0_0_20px_rgba(160,111,245,.15)]':'border-indigo-400/30 bg-slate-900/40 hover:border-indigo-300/70'}`}>
      <span className="block font-extrabold text-base text-white">🇮🇳 PhonePe PG</span>
      <span className="block text-xs text-slate-300 mt-1">India · INR · UPI AutoPay</span>
      <span className="block text-xs text-amber-200 font-semibold mt-2">Merchant activation pending</span>
     </button>
    </div>
    {paymentMethod==='paypal'?<section aria-label="PayPal checkout" className="mt-5">
     <h3 className="font-bold text-lg">PayPal — ${selectedPrice} USD / {periodLabel}</h3>
     <p className="muted text-sm mt-2">Your selection renews {billingPeriod==='monthly'?'monthly':'annually'}. {billingPeriod==='yearly'?'The full annual price is charged upfront. ':''}Sign in, then approve recurring billing securely with PayPal.</p>
     {available?<PayPalSubscribe key={selected+'-'+billingPeriod} clientId={clientId} planId={planId} tier={selected} billingPeriod={billingPeriod}/>:<p className="muted mt-5" role="status">PayPal checkout for this selection is not active. Its matching live plan must be configured and verified first; no payment can be taken here yet.</p>}
    </section>:<section aria-label="PhonePe PG checkout status" className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-400/5 px-4 py-5">
     <h3 className="font-extrabold text-lg text-white">PhonePe PG — India checkout</h3>
     <p className="text-sm text-amber-100 mt-2" role="status">PhonePe recurring subscription checkout is not live yet. No PhonePe charge or automatic plan activation can be initiated from this page.</p>
     <p className="text-sm text-slate-300 mt-3">To activate {selected} {billingPeriod} billing in INR, we need your merchant account's PhonePe UPI AutoPay / subscriptions access, production API credentials, INR plan prices, and verified payment callbacks. Your PayPal checkout remains available.</p>
     <a href="https://developer.phonepe.com/payment-gateway/autopay/api-integration/introduction" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-semibold text-cyan-300 underline underline-offset-4">PhonePe AutoPay setup documentation</a>
     <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" className="button outline" onClick={()=>setPaymentMethod('paypal')}>Use PayPal instead</button>
     </div>
    </section>}
   </>:<>
    <h2 className="text-xl font-extrabold">Select a plan to continue</h2>
    <p className="muted mt-2">Choose Starter, Pro, Premium, or Max above to see account and checkout options.</p>
   </>}
  </div>
  <div className="pricing-trust"><span>✓ Live PayPal subscriptions</span><span>✓ PhonePe PG India option prepared — pending activation</span><span>✓ Server-verified recurring billing only</span></div>
  <p className="small-note mt-6 text-center">Free usage: 3 shared tool runs per UTC day across all 60 utility tools and 11 Studio workspaces. Free users can preview an upscale, but high-resolution downloads require an eligible active paid plan. Each preview operation counts toward daily usage. Starter: 500, Pro: 1,000, Premium: 1,500 daily runs; Max: 3,000 daily runs. Allowances reset at 00:00 UTC. Paid Batch Text Analyzer sizes: Starter 20, Pro 60, Premium 150, Max 300 texts per request. Guests have a per-browser counter. Signed-in usage can sync across devices after server-side account quotas are enabled. Gemini AI preview is separately capped at 3 per signed-in user and 30 site-wide daily, not a paid AI entitlement. Local-only processing cannot be fully abuse-proof.</p>
 </section>;
}
