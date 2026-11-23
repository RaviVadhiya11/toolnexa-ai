'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {quotaKey,readUsage,consumeUsage,dailyLimits,isUsagePlan,type UsagePlan} from '@/lib/usage-limits';

// A single shared daily balance covers the existing 60 tools and all eight Studio workflows.
export const studioRunSlugs=[
 'studio-vector','studio-image-to-vector','studio-convert','studio-svg-editor',
 'studio-enhance','studio-background','studio-retouch','studio-restore'
] as const;
export type StudioRunSlug=typeof studioRunSlugs[number];
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
 if(balance.used>=balance.limit)throw Error('Daily limit reached. Free includes 3 shared runs per UTC day. Upgrade for more.');
 if(balance.mode==='account'){
  const res=await fetch('/api/usage/quota',{method:'POST',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({slug})});
  const json=await res.json();
  if(!res.ok)throw Error(json.error||'Cannot reserve the daily tool run');
 }else{
  const used=consumeUsage(quotaKey(balance.userId),balance.limit);
  if(used===null)throw Error('Daily free limit reached. Upgrade to continue.');
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
   {' '}Free quota is shared across all 68 tools and resets at 00:00 UTC.
   {quota.plan==='Free'&&<>{' '}<Link href="/pricing">Upgrade</Link></>}</>)}</div>;
}
