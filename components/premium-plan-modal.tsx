'use client';
import Link from 'next/link';
import {StudioModalPortal} from '@/components/studio-modal-portal';
import type {UpscalePlan} from '@/lib/studio-upscale';
import {subscriptionPrices} from '@/lib/subscription-pricing';

const rank:Record<UpscalePlan,number>={Free:0,Starter:1,Pro:2,Premium:3,Max:4};
const tiers=[
 {name:'Starter',desc:'2× downloads · 500 daily tool runs'},
 {name:'Pro',desc:'HD, 4× and 4K · 1,000 daily tool runs'},
 {name:'Premium',desc:'All 8K exports · 1,500 daily tool runs'},
 {name:'Max',desc:'8K and higher usage · 3,000 daily tool runs'}
] as const;

/** Shared paywall for Studio upscaling and every paid export. */
export function PremiumPlanModal({
 open,onClose,feature='High-resolution download',requiredTier='Pro',currentPlan='Free',onRetry,busy=false
}:{
 open:boolean;onClose:()=>void;feature?:string;requiredTier?:'Starter'|'Pro'|'Premium'|'Max';
 currentPlan?:UpscalePlan|string;onRetry:()=>void|Promise<void>;busy?:boolean;
}){
 return <StudioModalPortal open={open} onClose={onClose}>
  <section className="studio-paywall-dialog" role="dialog" aria-modal="true"
   aria-labelledby="studio-paywall-title" aria-describedby="studio-paywall-description">
   <header className="studio-paywall-header">
    <span className="studio-eyebrow">✧ TOOLNEXA CREATOR STUDIO</span>
    <h2 id="studio-paywall-title">Unlock {feature}</h2>
    <button type="button" data-modal-close className="studio-paywall-close"
     aria-label="Close subscription plans" onClick={onClose}>×</button>
   </header>
   <div className="studio-paywall-body" tabIndex={0} aria-label="Plans and subscription information">
    <p id="studio-paywall-description">
     Your preview stays here. {feature} requires an active <strong>{requiredTier}</strong> plan or higher.
     {currentPlan==='Free'?' Start with a subscription to download your full-quality result.':
      ' Your current plan is '+currentPlan+'. Choose an eligible plan below.'}
    </p>
    <div className="studio-paywall-grid">
     {tiers.map(tier=>{
      const eligible=rank[tier.name]>=rank[requiredTier];
      const featured=tier.name===requiredTier;
      return <article key={tier.name} className={'studio-paywall-plan'+(featured?' studio-paywall-recommended':'')}>
       {featured&&<span className="studio-paywall-minimum">RECOMMENDED FOR THIS EXPORT</span>}
       <strong>{tier.name}</strong>
       <span>{tier.name==='Starter'?'2× HD':tier.name==='Pro'?'4K':'Up to 8K'}</span>
       <small>From ${subscriptionPrices[tier.name].monthly}/month</small>
       <small>{tier.desc}</small>
       {eligible?<Link className="studio-paywall-plan-link" href={'/pricing?plan='+tier.name}
        target="_blank" rel="noopener noreferrer">View {tier.name} Plan</Link>:
        <small className="studio-paywall-ineligible">Requires {requiredTier} or higher</small>}
      </article>;
     })}
    </div>
    <p className="studio-note">Plans open in a new tab so your edited image is not lost. After your payment activates, return here and use Verify &amp; Download. Your subscription is checked securely.</p>
   </div>
   <footer className="studio-paywall-footer">
    <button type="button" className="studio-paywall-retry" disabled={busy}
     onClick={()=>void onRetry()}>{busy?'Checking PayPal subscription…':"I've subscribed — Verify & Download"}</button>
    <button type="button" className="studio-paywall-secondary" onClick={onClose}>Not now — keep my preview</button>
   </footer>
  </section>
 </StudioModalPortal>;
}
