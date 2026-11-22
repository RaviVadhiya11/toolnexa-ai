'use client';
import {useState} from 'react';
import {PayPalSubscribe} from '@/components/paypal-subscribe';

type Tier='Starter'|'Pro'|'Premium';
const tiers:{name:Tier;price:string;tagline:string;features:string[]}[]=[
 {name:'Starter',price:'$3.99',tagline:'For everyday productivity',features:['All 20 free utility tools','Batch text analysis: 5 texts per request','Up to 20,000 characters per text','Monthly recurring access']},
 {name:'Pro',price:'$5.99',tagline:'For creators and professionals',features:['All 20 free utility tools','Batch text analysis: 20 texts per request','Up to 20,000 characters per text','Monthly recurring access']},
 {name:'Premium',price:'$9.99',tagline:'For higher-volume workflows',features:['All 20 free utility tools','Batch text analysis: 50 texts per request','Up to 20,000 characters per text','Monthly recurring access']}
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
   <p>Choose the right monthly plan for your workflow. Start small or work with bigger batches whenever you need.</p>
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
  <p className="small-note mt-6 text-center">Current paid feature: Batch Text Analyzer. Other premium tools and team features are not included yet. Plans have different per-request batch sizes; monthly usage quotas are not part of these plans.</p>
 </section>;
}
