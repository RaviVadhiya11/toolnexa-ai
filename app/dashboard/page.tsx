'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {AccountStatus} from '@/components/account-status';
import {ManageSubscription} from '@/components/manage-subscription';
import {browserSupabase} from '@/lib/supabase/client';

type Plan='Free'|'Starter'|'Pro'|'Premium';
const plans:Record<Exclude<Plan,'Free'>,{price:string;batch:number}>={
 Starter:{price:'$3.99',batch:5},
 Pro:{price:'$5.99',batch:20},
 Premium:{price:'$9.99',batch:50}
};
function labelSlug(slug:string){return slug.replaceAll('-',' ')}

export default function Dashboard(){
 const [recent,setRecent]=useState<string[]>([]);
 const [plan,setPlan]=useState<Plan|null>(null);
 const [status,setStatus]=useState<'checking'|'ready'|'error'>('checking');
 const [signedIn,setSignedIn]=useState(false);
 useEffect(()=>{
  try{
   const stored=JSON.parse(localStorage.getItem('toolnexa-recent')||'[]');
   setRecent(Array.isArray(stored)?stored.filter((s):s is string=>typeof s==='string').slice(0,20):[]);
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
    if(!response.ok||!['Free','Starter','Pro','Premium'].includes(data.plan))throw Error('Status unavailable');
    setPlan(data.plan as Plan);
    setSignedIn(data.authenticated===true);
    setStatus('ready');
   }catch{if(active){setStatus('error');setPlan(null)}}
  };
  void refresh();
  const client=browserSupabase();
  const subscription=client?.auth.onAuthStateChange(()=>{
   setStatus('checking');setPlan(null);void refresh();
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
   <AccountStatus/>
  </header>
  <section className="member-hero">
   <div className="member-hero-content">
    <p className="member-kicker">{paid?'ACTIVE PREMIUM MEMBERSHIP':'YOUR MEMBERSHIP'}</p>
    <h2>{paid?`${plan} workspace`:status==='ready'?'Explore more with ToolNexa AI':'Your workspace'}</h2>
    <p>{paid
     ?`Your ${plan} subscription is verified with PayPal. Use the Batch Text Analyzer with up to ${benefits?.batch} texts per request.`
     :status==='error'?'We could not confirm your plan right now. Premium access is never assumed when verification is unavailable.'
     :status==='checking'?'Checking membership with the server…'
     :signedIn?'You are currently on the Free plan. Upgrade whenever you need bigger batches.':'Sign in to subscribe, or keep using our 20 free tools.'}</p>
    <div className="member-actions">
     {paid?<Link className="member-primary" href="/pro/text-batch">Open premium tool →</Link>
      :<Link className="member-primary" href="/pricing">View premium plans →</Link>}
     <Link className="member-secondary" href="/tools">Browse free tools</Link>
    </div>
   </div>
   <div className="member-hero-meta" aria-label="Membership summary">
    <span>Current plan</span><strong>{displayPlan}</strong>
    <span>{paid?'Monthly subscription':'Free tools available'}</span>
    {benefits&&<b>{benefits.price}/month</b>}
   </div>
  </section>
  <div className="member-overview">
   <div className="member-metric"><span>Current plan</span><strong>{displayPlan}</strong><small>{paid?'Verified paid access':status==='error'?'Please refresh later':'Your membership'}</small></div>
   <div className="member-metric"><span>Available free tools</span><strong>20</strong><small>Accessible without payment</small></div>
   <div className="member-metric"><span>Recent tools</span><strong>{recent.length}</strong><small>Saved on this device</small></div>
  </div>
  <section className="member-section" aria-label="Premium tools">
   <div className="member-section-title"><div><h2>Premium tools</h2><p className="muted">Available features depend on your active subscription.</p></div><Link href="/pricing">Compare plans →</Link></div>
   <div className="member-feature-grid">
    <article className="member-feature-card">
     <div className="member-feature-icon">✦</div>
     <h3>Batch Text Analyzer</h3>
     <p>Analyze words, characters, sentences and reading time across multiple texts in one request.</p>
     <div className="member-plan-limits">
      {(['Starter','Pro','Premium'] as const).map(t=><span key={t}>{t}: {plans[t].batch} texts</span>)}
     </div>
     <Link href={paid?'/pro/text-batch':'/pricing'} className="button mt-4">{paid?'Launch tool':'Choose a plan'}</Link>
    </article>
    <article className="member-feature-card member-feature-muted">
     <div className="member-feature-icon">◇</div>
     <h3>More premium tools</h3>
     <p>Additional premium features are planned and are not part of current subscriptions.</p>
     <span className="member-soon">Coming later</span>
    </article>
   </div>
  </section>
  <section className="member-section">
   <div className="member-section-title"><div><h2>Recent activity</h2><p className="muted">Only tools opened on this device are listed.</p></div></div>
   <div className="panel">{recent.length?recent.map((slug,i)=><p key={slug+i} className="mt-3"><Link style={{color:'var(--accent)',textTransform:'capitalize'}} href={'/tools/'+encodeURIComponent(slug)}>{labelSlug(slug)}</Link></p>):<p className="muted">No recent tools yet. Explore our free tools to get started.</p>}
    {recent.length>0&&<button className="button outline mt-5" onClick={()=>{localStorage.removeItem('toolnexa-recent');setRecent([])}}>Clear local history</button>}
   </div>
  </section>
  <ManageSubscription/>
  <section className="member-footnote"><strong>AI Credits — Coming Soon</strong><p>AI credits are not sold or included in your current plan. Your active subscription covers the Batch Text Analyzer limits displayed above.</p></section>
 </div>;
}
