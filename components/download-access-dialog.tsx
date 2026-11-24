'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {PremiumPlanModal} from '@/components/premium-plan-modal';
import {GATE_EVENT,GATE_GRANTED_EVENT,type DownloadGateEvent} from '@/lib/download-access';

// One shared subscription/limit dialog for all 60 utility tools and the Studio.
export function DownloadAccessDialog(){
 const [detail,setDetail]=useState<DownloadGateEvent|null>(null);
 const [checking,setChecking]=useState(false);
 const pending=useRef<DownloadGateEvent|null>(null);
 useEffect(()=>{
  const requested=(event:Event)=>{
   const next=(event as CustomEvent<DownloadGateEvent>).detail;
   if(!next||typeof next.feature!=='string')return;
   pending.current=next;setDetail(next);
  };
  const granted=()=>{pending.current=null;setDetail(null)};
  window.addEventListener(GATE_EVENT,requested);
  window.addEventListener(GATE_GRANTED_EVENT,granted);
  return()=>{window.removeEventListener(GATE_EVENT,requested);
   window.removeEventListener(GATE_GRANTED_EVENT,granted)};
 },[]);
 const close=()=>{pending.current=null;setDetail(null)};
 async function retry(){
  const action=pending.current?.retry;
  if(!action||checking)return;
  setChecking(true);
  try{if(await action())close()}finally{setChecking(false)}
 }
 if(!detail)return null;
 if(detail.kind==='subscription')
  return <PremiumPlanModal open onClose={close}
   feature={detail.feature} requiredTier={detail.requiredTier}
   currentPlan={detail.currentPlan||'Free'}
   busy={checking} onRetry={()=>void retry()}/>;
 return <div className="studio-paywall-overlay studio-premium-paywall"
   onMouseDown={event=>{if(event.target===event.currentTarget)close()}}>
  <section className="studio-paywall-dialog" role="dialog" aria-modal="true"
   aria-labelledby="download-access-title" aria-describedby="download-access-message">
   <button type="button" className="studio-paywall-close" aria-label="Close download message"
    onClick={close}>×</button>
   <span className="studio-eyebrow">✦ TOOLNEXA AI</span>
   <h2 id="download-access-title">{detail.kind==='limit'?'Daily Limit Reached':'Download Verification Unavailable'}</h2>
   <p id="download-access-message">{detail.message}</p>
   <p className="studio-note">Your edited files and settings stay on this page. Upgrade for more daily tool runs or retry once the service is available.</p>
   <div className="studio-paywall-grid">
    <Link className="studio-paywall-plan-link" href="/pricing" target="_blank"
     rel="noopener noreferrer">View Subscription Plans</Link>
    {detail.retry&&<button className="studio-paywall-retry" type="button"
     disabled={checking} onClick={()=>void retry()}>{checking?'Checking…':'Retry Download'}</button>}
   </div>
   <button type="button" className="studio-paywall-secondary" onClick={close}>Keep My Work</button>
  </section>
 </div>;
}
