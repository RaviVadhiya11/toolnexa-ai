'use client';
import {useState} from 'react';
import {PayPalSubscribe} from '@/components/paypal-subscribe';
import {billingPeriods,paidTiers,subscriptionPrices,type BillingPeriod,type PaidTier} from '@/lib/subscription-pricing';

const tiers:{name:PaidTier;tagline:string;features:string[]}[]=[
 {name:'Starter',tagline:'For everyday productivity',features:['60 utility tools','20 texts per batch request','20,000 characters per text','500 tool runs per day']},
 {name:'Pro',tagline:'For creators and professionals',features:['60 utility tools','60 texts per batch request','20,000 characters per text','1,000 tool runs per day']},
 {name:'Premium',tagline:'For higher-volume workflows',features:['60 utility tools','150 texts per batch request','20,000 characters per text','1,500 tool runs per day']},
 {name:'Max',tagline:'High-capacity creator and business toolkit',features:['60 utility tools','300 texts per batch request','20,000 characters per text','3,000 tool runs per day','Gemini AI preview: 3 generations/day (shared free allowance)']}
];

type PlanIds=Record<BillingPeriod,Record<PaidTier,string>>;
export function PremiumPricing({clientId,plans,enabled,yearlyEnabled,maxEnabled}:{
 clientId:string;plans:PlanIds;enabled:boolean;yearlyEnabled:boolean;maxEnabled:boolean
}){
 const [billingPeriod,setBillingPeriod]=useState<BillingPeriod>('monthly');
 const [selected,setSelected]=useState<PaidTier|null>(null);
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
   <p>Choose monthly or yearly recurring access. Yearly billing is paid upfront for 12 months and saves approximately 16% compared with paying monthly. All 60 tools share the same daily allowance in either billing period.</p>
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
    return <article className={`tier-card ${tier.name==='Pro'?'featured':''}`} key={tier.name}>
     {tier.name==='Pro'&&<span className="popular-label">MOST POPULAR</span>}
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
    <h2 className="text-xl font-extrabold">{selected} subscription — ${selectedPrice}/{periodLabel}</h2>
    <p className="muted text-sm mt-2">Your selection renews {billingPeriod==='monthly'?'monthly':'annually'}. {billingPeriod==='yearly'?'The full annual price is charged upfront. ':''}Sign up or log in, then approve recurring billing securely with PayPal.</p>
    {available?<PayPalSubscribe key={selected+'-'+billingPeriod} clientId={clientId} planId={planId} tier={selected} billingPeriod={billingPeriod}/>:<p className="muted mt-5" role="status">Checkout for this selection is not active. The matching PayPal Live {billingPeriod} plan must be configured and verified first; no payment can be taken here yet.</p>}
   </>:<>
    <h2 className="text-xl font-extrabold">Select a plan to continue</h2>
    <p className="muted mt-2">Choose Starter, Pro, Premium, or Max above to see account and checkout options.</p>
   </>}
  </div>
  <div className="pricing-trust"><span>✓ Secure PayPal checkout when enabled</span><span>✓ Monthly or annual recurring billing</span><span>✓ Cancel through PayPal</span></div>
  <p className="small-note mt-6 text-center">Free usage: 10 successful tool runs per day across all 60 tools on this browser. Starter: 500, Pro: 1,000, Premium: 1,500 daily runs; Max: 3,000 daily runs. Allowances reset at 00:00 UTC. Paid Batch Text Analyzer sizes: Starter 20, Pro 60, Premium 150, Max 300 texts per request. Guests have a per-browser counter. Signed-in usage can sync across devices after server-side account quotas are enabled. Gemini AI preview is separately capped at 3 per signed-in user and 30 site-wide daily, not a paid AI entitlement. Local-only processing cannot be fully abuse-proof.</p>
 </section>;
}
