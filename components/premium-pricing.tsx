'use client';
import {useState} from 'react';
import {PayPalSubscribe} from '@/components/paypal-subscribe';

type Tier='Starter'|'Pro'|'Premium';
const tiers:{name:Tier;price:string;tagline:string;features:string[]}[]=[
 {name:'Starter',price:'$3.99',tagline:'For everyday productivity',features:['20 utility tools','20 texts per batch request','20,000 characters per text','500 tool runs per day','Monthly recurring access']},
 {name:'Pro',price:'$5.99',tagline:'For creators and professionals',features:['20 utility tools','60 texts per batch request','20,000 characters per text','1,000 tool runs per day','Monthly recurring access']},
 {name:'Premium',price:'$9.99',tagline:'For higher-volume workflows',features:['20 utility tools','150 texts per batch request','20,000 characters per text','1,500 tool runs per day','Monthly recurring access']}
];

export function PremiumPricing({clientId,plans,enabled}:{clientId:string;plans:Record<Tier,string>;enabled:boolean}){
 const [selected,setSelected]=useState<Tier|null>(null);
 const planId=selected?plans[selected]:'';
 const matches=selected?(['Starter','Pro','Premium'] as Tier[]).filter(tier=>plans[tier]===planId&&!!planId):[];
 const available=!!selected&&enabled&&!!planId&&matches.length===1;
 return <section aria-label="Monthly subscription pricing">
  <header className="pricing-intro">
   <span className="tier-tag">TOOLNEXA AI PREMIUM</span>
   <h1>Simple plans. More possibilities.</h1>
   <p>Choose the right monthly plan for your workflow. All 20 tools have a shared daily usage allowance. Subscribe for larger daily limits and bigger text batches.</p>
  </header>
  <div className="tier-grid">
   {tiers.map(tier=>{
    const isReady=enabled&&!!plans[tier.name]&&Object.values(plans).filter(id=>!!id&&id===plans[tier.name]).length===1;
    const active=selected===tier.name;
    return <article className={`tier-card ${tier.name==='Pro'?'featured':''}`} key={tier.name}>
     {tier.name==='Pro'&&<span className="popular-label">MOST POPULAR</span>}
     <div><span className="tier-tag">{tier.name}</span><h2 className="mt-2">{tier.name}</h2><p className="muted text-sm mt-2">{tier.tagline}</p></div>
     <p className="tier-price">{tier.price}<span> / month</span></p>
     <ul className="tier-features">{tier.features.map(feature=><li key={feature}>{feature}</li>)}</ul>
     <button type="button" className={`tier-cta ${active?'selected':''}`}
      onClick={()=>{setSelected(tier.name);document.getElementById('subscription-checkout')?.scrollIntoView({behavior:'smooth',block:'center'})}}
      aria-pressed={active}>
      {active?'Selected — continue below':isReady?'Choose '+tier.name:'View '+tier.name+' plan'}
     </button>
     {!isReady&&<p className="small-note">Subscription checkout for this tier is not yet configured.</p>}
    </article>
   })}
  </div>
  <div className="unlimited-plan-preview" aria-label="Unlimited plan preview"><div><span className="tier-tag">COMING SOON</span><h2>Unlimited Plan</h2><p>Need more than 1,500 daily tool runs? A future higher-capacity plan can include fair-use safeguards and verified billing. Price and benefits will be announced before checkout is enabled.</p></div><span className="unlimited-coming-soon">Not available yet</span></div>
  <div id="subscription-checkout" className="subscribe-panel" aria-live="polite">
   {selected?<>
    <h2 className="text-xl font-extrabold">{selected} subscription — {tiers.find(x=>x.name===selected)?.price}/month</h2>
    <p className="muted text-sm mt-2">Sign up or log in here, then approve your recurring subscription securely with PayPal.</p>
    {available?<PayPalSubscribe key={selected} clientId={clientId} planId={planId} tier={selected}/>:<p className="muted mt-5" role="status">This plan is coming soon. Its PayPal Live subscription plan must be configured before accepting payments.</p>}
   </>:<>
    <h2 className="text-xl font-extrabold">Select a plan to continue</h2>
    <p className="muted mt-2">Choose Starter, Pro, or Premium above to see login and secure checkout options.</p>
   </>}
  </div>
  <div className="pricing-trust"><span>✓ Secure checkout with PayPal</span><span>✓ Monthly recurring billing</span><span>✓ Cancel through PayPal</span></div>
  <p className="small-note mt-6 text-center">Free usage: 10 successful tool runs per day across all 20 tools on this browser. Starter: 500, Pro: 1,000, Premium: 1,500 daily runs. Allowances reset at 00:00 UTC. Current paid feature: Batch Text Analyzer. Paid Batch Text Analyzer sizes: Starter 20, Pro 60, Premium 150 texts per request. Guests have a per-browser counter. Signed-in usage can sync across devices after server-side account quotas are enabled. Local-only processing cannot be fully abuse-proof.</p>
 </section>;
}
