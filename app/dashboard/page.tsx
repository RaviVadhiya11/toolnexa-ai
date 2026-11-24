'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ManageSubscription} from '@/components/manage-subscription';
import {browserSupabase} from '@/lib/supabase/client';
import {tools} from '@/lib/tools';
import {dailyLimits,quotaKey,readUsage} from '@/lib/usage-limits';
import {subscriptionPrices,type BillingPeriod} from '@/lib/subscription-pricing';

type Plan='Free'|'Starter'|'Pro'|'Premium'|'Max';
const plans:Record<Exclude<Plan,'Free'>,{batch:number}>={
 Starter:{batch:20},
 Pro:{batch:60},
 Premium:{batch:150},
 Max:{batch:300}
};
const validToolSlugs=new Set(tools.map(tool=>tool.slug));
function labelSlug(slug:string){return slug.replaceAll('-',' ')}

export default function Dashboard(){
 const [recent,setRecent]=useState<string[]>([]);
 const [plan,setPlan]=useState<Plan|null>(null);
 const [billingPeriod,setBillingPeriod]=useState<BillingPeriod|null>(null);
 const [status,setStatus]=useState<'checking'|'ready'|'error'>('checking');
 const [signedIn,setSignedIn]=useState(false);
 const [dailyUsed,setDailyUsed]=useState(0);
 useEffect(()=>{
  try{
   const stored=JSON.parse(localStorage.getItem('toolnexa-recent')||'[]');
   setRecent(Array.isArray(stored)?stored.filter((s):s is string=>typeof s==='string'&&validToolSlugs.has(s)).slice(0,20):[]);
  }catch{setRecent([])}
 },[]);
 useEffect(()=>{
  let active=true;
  const refresh=async()=>{
   if(!active)return;
   try{
    const response=await fetch('/api/pro/status',{cache:'no-store'});
    const data=await response.json();
    if(!active)return;
    if(!response.ok||!['Free','Starter','Pro','Premium','Max'].includes(data.plan))throw Error('Status unavailable');
    setPlan(data.plan as Plan);
    setBillingPeriod(data.billingPeriod==='monthly'||data.billingPeriod==='yearly'?data.billingPeriod:null);
    setSignedIn(data.authenticated===true);
    const owner=typeof data.userId==='string'?data.userId:null;
    try{
     const allowanceResponse=await fetch('/api/usage/quota',{cache:'no-store'});
     const allowance=await allowanceResponse.json() as {mode?:string;used?:number};
     if(allowanceResponse.ok&&allowance.mode==='account'&&typeof allowance.used==='number')
      setDailyUsed(allowance.used);
     else setDailyUsed(readUsage(quotaKey(owner)));
    }catch{setDailyUsed(readUsage(quotaKey(owner)))}
    setStatus('ready');
   }catch{if(active){setStatus('error');setPlan(null);setBillingPeriod(null)}}
  };
  void refresh();
  const client=browserSupabase();
  const subscription=client?.auth.onAuthStateChange(()=>{
   setStatus('checking');setPlan(null);setBillingPeriod(null);void refresh();
  }).data.subscription;
  const onFocus=()=>void refresh();
  window.addEventListener('focus',onFocus);
  window.addEventListener('toolnexa-subscription-changed',onFocus);
  return()=>{
   active=false;subscription?.unsubscribe();
   window.removeEventListener('focus',onFocus);
   window.removeEventListener('toolnexa-subscription-changed',onFocus);
  };
 },[]);
 const paid=status==='ready'&&plan!==null&&plan!=='Free';
 const benefits=paid?plans[plan as Exclude<Plan,'Free'>]:null;
 const displayPlan=status==='checking'?'Checking…':status==='error'?'Unavailable':plan??'Free';
 return <div className="member-dashboard">
  <header className="member-heading">
   <div><p className="eyebrow muted">TOOLNEXA AI WORKSPACE</p><h1>Your Dashboard</h1>
    <p className="muted mt-2">Your tools, membership and subscriptions in one place.</p></div>
  </header>
  <section className="member-hero">
   <div className="member-hero-content">
    <p className="member-kicker">{paid?'ACTIVE PREMIUM MEMBERSHIP':'YOUR MEMBERSHIP'}</p>
    <h2>{paid?`${plan} workspace`:status==='ready'?'Explore more with ToolNexa AI':'Your workspace'}</h2>
    <p>{paid
     ?`Your ${plan} subscription is verified with PayPal. Use the Batch Text Analyzer with up to ${benefits?.batch} texts per request.`
     :status==='error'?'We could not confirm your plan right now. Premium access is never assumed when verification is unavailable.'
     :status==='checking'?'Checking membership with the server…'
     :signedIn?'You are currently on the Free plan. Upgrade whenever you need bigger batches.':'Sign in to subscribe, or keep using our 60 utility tools.'}</p>
    <div className="member-actions">
     {paid?<Link className="member-primary" href="/pro/text-batch">Open premium tool →</Link>
      :<Link className="member-primary" href="/pricing">View premium plans →</Link>}
     <Link className="member-secondary" href="/tools">Browse free tools</Link>
    </div>
   </div>
   <div className="member-hero-meta" aria-label="Membership summary">
    <span>Current plan</span><strong>{displayPlan}</strong>
    <span>{paid?(billingPeriod==='yearly'?'Annual subscription':billingPeriod==='monthly'?'Monthly subscription':'Verified subscription'):'Free tools available'}</span>
    {benefits&&billingPeriod&&plan&&plan!=='Free'&&<b>${subscriptionPrices[plan][billingPeriod]}/{billingPeriod==='yearly'?'year':'month'}</b>}
   </div>
  </section>
  <div className="member-overview">
   <div className="member-metric"><span>Current plan</span><strong>{displayPlan}</strong><small>{paid?'Verified paid access':status==='error'?'Please refresh later':'Your membership'}</small></div>
   <div className="member-metric"><span>Daily tool uses left</span><strong>{status==='ready'?Math.max(0,dailyLimits[plan??'Free']-dailyUsed):'—'}</strong><small>{status==='ready'?dailyUsed+' / '+dailyLimits[plan??'Free']+' used today · '+plan+' plan':'Verifying allowance'}</small></div>
   <div className="member-metric"><span>Recent tools</span><strong>{recent.length}</strong><small>Saved on this device</small></div>
  </div>
  <section className="member-section flagship-dashboard-studio" aria-label="Creator Studio shortcuts">
   <div className="member-section-title"><div><h2>Creator Studio Workspaces</h2><p className="muted">Direct access to your real editors. Download rights depend on verified plan eligibility.</p></div><Link href="/studio">Browse all →</Link></div>
   <div className="flagship-dashboard-quick">
    {([
     ['/studio/enhance','✦ Enhance & Upscale'],
     ['/studio/background-remove','✂ Remove Background'],
     ['/studio/image-to-vector','◇ Vectorize Image'],
     ['/studio/vector','✧ Logo Studio'],
     ['/studio/batch','⚡ Batch Pro+'],
     ['/studio/passport-social','▧ Passport / Social Photo'],
     ['/studio/zip-maker','▤ Advanced ZIP Maker']
    ] as const).map(([href,title])=><Link href={href} key={href}>{title}<span aria-hidden="true">→</span></Link>)}
   </div>
  </section>
  <section className="member-section" aria-label="Premium tools">
   <div className="member-section-title"><div><h2>Premium tools</h2><p className="muted">Available features depend on your active subscription.</p></div><Link href="/pricing">Compare plans →</Link></div>
   <div className="member-feature-grid">
    <article className="member-feature-card">
     <div className="member-feature-icon">✦</div>
     <h3>Batch Text Analyzer</h3>
     <p>Analyze words, characters, sentences and reading time across multiple texts in one request.</p>
     <div className="member-plan-limits">
      {(['Starter','Pro','Premium','Max'] as const).map(t=><span key={t}>{t}: {plans[t].batch} texts</span>)}
     </div>
     <Link href={paid?'/pro/text-batch':'/pricing'} className="button mt-4">{paid?'Launch tool':'Choose a plan'}</Link>
    </article>
    <article className="member-feature-card">
     <div className="member-feature-icon">⚡</div>
     <h3>Premium Batch Image ZIP Export</h3>
     <p>Enhance up to eight images locally and export a ZIP file. Premium and Max members can use the feature after a live PayPal entitlement check.</p>
     <div className="member-plan-limits"><span>Premium: 1,500 daily runs</span><span>Max: 3,000 daily runs</span></div>
     <Link href="/studio/batch" className="button mt-4">{plan==='Premium'||plan==='Max'?'Open Batch Studio':'View Batch Studio & Plans'}</Link>
    </article>
   </div>
  </section>
  <section className="member-section">
   <div className="member-section-title"><div><h2>Recent activity</h2><p className="muted">Only tools opened on this device are listed.</p></div></div>
   <div className="panel">{recent.length?recent.map((slug,i)=><p key={slug+i} className="mt-3"><Link style={{color:'var(--accent)',textTransform:'capitalize'}} href={'/tools/'+encodeURIComponent(slug)}>{labelSlug(slug)}</Link></p>):<p className="muted">No recent tools yet. Explore our free tools to get started.</p>}
    {recent.length>0&&<button className="button outline mt-5" onClick={()=>{localStorage.removeItem('toolnexa-recent');setRecent([])}}>Clear local history</button>}
   </div>
  </section>
  {status==='checking'?<section className="panel mt-5" aria-label="Loading billing"><h2 className="font-bold text-xl">Manage Subscription</h2><p className="muted mt-3">Checking account status…</p></section>
   :status==='ready'&&!signedIn?<section className="panel mt-5" aria-label="Sign in to manage subscriptions"><h2 className="font-bold text-xl">Manage Subscription</h2><p className="muted mt-3">Sign in to view your subscription, payment status, and cancellation options.</p><Link className="button mt-4" href="/login">Sign in to manage billing</Link></section>
   :<ManageSubscription/>}
  <section className="member-footnote"><strong>AI Credits — Coming Soon</strong><p>AI credits are not sold or included in your current plan. Your active subscription covers the Batch Text Analyzer limits displayed above.</p></section>
 </div>;
}
