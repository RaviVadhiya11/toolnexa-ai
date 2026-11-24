'use client';
import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
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
   const requestedBilling=new URLSearchParams(window.location.search).get('billing');
   if(requestedBilling==='monthly'||requestedBilling==='yearly')setBillingPeriod(requestedBilling);
   setSelected(chosen as PaidTier);
   setPaymentMethod('paypal');
  }
 },[]);
 useEffect(()=>{
  if(!selected)return;
  const previous=document.activeElement as HTMLElement|null;
  const priorOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();setSelected(null);return}
   if(event.key!=='Tab')return;
   const modal=document.getElementById('subscription-checkout');
   const focusable=modal?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])');
   if(!focusable?.length)return;
   const first=focusable[0],last=focusable[focusable.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  };
  const raf=requestAnimationFrame(()=>document.getElementById('secure-checkout-close')?.focus());
  document.addEventListener('keydown',onKey);
  return()=>{cancelAnimationFrame(raf);document.body.style.overflow=priorOverflow;document.removeEventListener('keydown',onKey);previous?.focus()};
 },[selected]);
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
      onClick={()=>{setSelected(tier.name);setPaymentMethod('paypal')}}
      aria-pressed={active}>
      {active?'Selected · Open Checkout':ready?'Choose '+tier.name:'View '+tier.name+' plan'}
     </button>
     {!ready&&<p className="small-note">{billingPeriod==='yearly'?'Yearly PayPal checkout is not yet configured for this tier.':'Subscription checkout for this tier is not yet configured.'}</p>}
    </article>;
   })}
  </div>
  {selected&&typeof document!=='undefined'&&createPortal(<div className="premium-shell secure-checkout-portal-root">
  <div className="secure-checkout-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setSelected(null)}}>
   <section id="subscription-checkout" role="dialog" aria-modal="true" aria-labelledby="secure-checkout-title" aria-describedby="secure-checkout-description" className="secure-checkout-dialog">
    <header className="secure-checkout-header">
     <span className="secure-checkout-lock" aria-hidden="true">✦</span>
     <div className="secure-checkout-heading">
      <h2 id="secure-checkout-title">ToolNexa AI · Secure Checkout</h2>
      <p id="secure-checkout-description">Plan activation after verified payment · Secure provider checkout</p>
     </div>
     <button id="secure-checkout-close" type="button" className="secure-checkout-close" onClick={()=>setSelected(null)} aria-label="Close secure checkout">×</button>
    </header>
    <div className="secure-checkout-scroll">
     <section className="secure-checkout-methods" aria-label="Payment method">
      <h3>Select Payment Method</h3>
      <div className="secure-checkout-tabs" role="group" aria-label="Select payment gateway">
       <button type="button" aria-pressed={paymentMethod==='paypal'} onClick={()=>setPaymentMethod('paypal')} className={paymentMethod==='paypal'?'is-active':''}>
        <span className="secure-checkout-gateway-icon" aria-hidden="true">P</span>
        <strong>PayPal</strong><small>International · USD</small>
       </button>
       <button type="button" aria-pressed={paymentMethod==='phonepe'} onClick={()=>setPaymentMethod('phonepe')} className={paymentMethod==='phonepe'?'is-active':''}>
        <span className="secure-checkout-gateway-icon secure-checkout-phonepe-icon" aria-hidden="true">पे</span>
        <strong>PhonePe PG</strong><small>India · INR</small>
       </button>
      </div>
      {paymentMethod==='paypal'?<div className="secure-checkout-method-info" role="status">
       <strong>PayPal · Active international subscription checkout</strong>
       <span>USD · {billingPeriod==='monthly'?'Monthly':'Yearly'} recurring billing. Approval happens securely on PayPal.</span>
      </div>:<div className="secure-checkout-method-info" role="status">
       <strong>PhonePe PG · India checkout</strong>
       <span>UPI and card options will be provided by PhonePe after its recurring subscription integration is enabled. Production credentials, merchant approval and verified callbacks are still required. No payment is taken now.</span>
      </div>}
     </section>
     <section className="secure-checkout-summary" aria-label="Selected subscription">
      <div className="secure-checkout-summary-head">
       <div><span className="secure-checkout-eyebrow">Selected Plan</span><h3>{selected}</h3><p>{billingPeriod==='monthly'?'Monthly':'Yearly'} billing</p></div>
       <div className="secure-checkout-price">{paymentMethod==='paypal'?<><strong>${selectedPrice}</strong><small>USD / {periodLabel}</small></>:<><strong>INR</strong><small>Pricing pending</small></>}</div>
      </div>
      <p className="secure-checkout-disclosure">{paymentMethod==='paypal'?
       `PayPal will show the full ${billingPeriod==='monthly'?'monthly':'annual'} charge before you approve recurring billing. You can manage the subscription in your account.`:
       'PhonePe is not ready to charge yet. INR prices, recurring mandate approval, production keys and payment verification must be configured before checkout can open.'}</p>
      <p className="secure-checkout-promo">Promo codes are not currently configured. No discount is assumed.</p>
     </section>
    </div>
    <div className="secure-checkout-action" aria-label="Single secure payment action">
      {paymentMethod==='paypal'?(available?
        <PayPalSubscribe key={selected+'-'+billingPeriod} clientId={clientId} planId={planId} tier={selected} billingPeriod={billingPeriod} singleAction/>:
        <button type="button" className="secure-checkout-primary" disabled>PayPal checkout is not available for this plan</button>):
       <button type="button" className="secure-checkout-primary" disabled>PhonePe PG · Activation pending</button>}
      <p className="secure-checkout-note">{paymentMethod==='paypal'?'Secure PayPal approval · No payment is taken until you confirm.':'PhonePe checkout is unavailable until approved. No card or UPI information is collected here.'}</p>
    </div>
   </section>
  </div></div>,document.body)}
  <div className="pricing-trust"><span>✓ Live PayPal subscriptions</span><span>✓ PhonePe PG India option prepared — pending activation</span><span>✓ Server-verified recurring billing only</span></div>
  <p className="small-note mt-6 text-center">Free usage: 3 shared tool runs per UTC day across all 60 utility tools and 11 Studio workspaces. Free users can preview an upscale, but high-resolution downloads require an eligible active paid plan. Each preview operation counts toward daily usage. Starter: 500, Pro: 1,000, Premium: 1,500 daily runs; Max: 3,000 daily runs. Allowances reset at 00:00 UTC. Paid Batch Text Analyzer sizes: Starter 20, Pro 60, Premium 150, Max 300 texts per request. Guests have a per-browser counter. Signed-in usage can sync across devices after server-side account quotas are enabled. Gemini AI preview is separately capped at 3 per signed-in user and 30 site-wide daily, not a paid AI entitlement. Local-only processing cannot be fully abuse-proof.</p>
 </section>;
}
