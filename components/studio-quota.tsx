'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {showDownloadGate} from '@/lib/download-access';
import type {StudioRunSlug} from '@/lib/studio-run-slugs';
import {quotaKey,readUsage,consumeUsage,dailyLimits,isUsagePlan,type UsagePlan} from '@/lib/usage-limits';

// A single shared daily balance covers the existing 60 tools and the active Studio workflows.
type Quota={plan:UsagePlan;limit:number;used:number;mode:'browser'|'account';userId:string|null};
export async function currentStudioQuota():Promise<Quota>{
 const res=await fetch('/api/usage/quota',{cache:'no-store'});
 const result=await res.json();
 if(!res.ok)throw Error(result.error||'Unable to verify your daily allowance');
 if(!isUsagePlan(result.plan)||!['browser','account'].includes(result.mode))
  throw Error('Invalid quota response');
 const plan=result.plan as UsagePlan,limit=dailyLimits[plan];
 const userId=typeof result.userId==='string'?result.userId:null;
 return {plan,limit,mode:result.mode,used:result.mode==='account'?Number(result.used||0):readUsage(quotaKey(userId)),userId};
}
export async function reserveStudioUsage(slug:StudioRunSlug){
 const balance=await currentStudioQuota();
 if(balance.used>=balance.limit){
  showDownloadGate({kind:'limit',feature:'Creator Studio export',requiredTier:'Starter',
   currentPlan:balance.plan,message:'Your '+balance.plan+' daily run limit is complete. Upgrade for more daily usage or try again after the UTC reset.'});
  throw Error('Daily limit reached. Upgrade for more usage.');
 }
 if(balance.mode==='account'){
  const res=await fetch('/api/usage/quota',{method:'POST',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({slug})});
  const json=await res.json();
  if(!res.ok){
   if(res.status===429)showDownloadGate({kind:'limit',feature:'Creator Studio export',
    requiredTier:'Starter',currentPlan:balance.plan,
    message:json.error||'Daily allowance exhausted. Upgrade for more runs.'});
   throw Error(json.error||'Cannot reserve the daily tool run');
  }
 }else{
  const used=consumeUsage(quotaKey(balance.userId),balance.limit);
  if(used===null){
   showDownloadGate({kind:'limit',feature:'Creator Studio export',requiredTier:'Starter',
    currentPlan:balance.plan,message:'Your daily allowance is complete. Upgrade for more runs.'});
   throw Error('Daily limit reached. Upgrade to continue.');
  }
 }
 window.dispatchEvent(new Event('toolnexa-usage-changed'));
}
export function StudioQuotaNotice(){
 const [quota,setQuota]=useState<Quota|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  const refresh=()=>void currentStudioQuota().then(q=>{if(active){setQuota(q);setError('')}})
   .catch(()=>{if(active)setError('Usage balance temporarily unavailable')});
  refresh();
  window.addEventListener('focus',refresh);
  window.addEventListener('storage',refresh);
  window.addEventListener('toolnexa-subscription-changed',refresh);
  window.addEventListener('toolnexa-usage-changed',refresh);
  return()=>{active=false;window.removeEventListener('focus',refresh);window.removeEventListener('storage',refresh);
   window.removeEventListener('toolnexa-subscription-changed',refresh);
   window.removeEventListener('toolnexa-usage-changed',refresh)};
 },[]);
 return <div className="studio-quota" aria-live="polite">{error||(!quota?'Checking daily allowance…':
  <>{quota.plan} plan: <strong>{Math.max(0,quota.limit-quota.used)} of {quota.limit} daily runs left.</strong>
   {' '}Free quota is shared across all utility and Studio tools and resets at 00:00 UTC.
   {quota.plan==='Free'&&<>{' '}<Link href="/pricing">Upgrade</Link></>}</>)}</div>;
}
