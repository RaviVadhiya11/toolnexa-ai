'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {PremiumPlanModal} from '@/components/premium-plan-modal';
import {currentStudioQuota} from '@/components/studio-quota';
import type {UpscalePlan} from '@/lib/studio-upscale';

// For the existing Pro+ 2×/4× HD exports; the actual file endpoint still verifies
// live PayPal membership and atomically consumes its export quota.
export function useStudioPremiumDownload(feature:string){
 const [open,setOpen]=useState(false);
 const [checking,setChecking]=useState(false);
 const [plan,setPlan]=useState<UpscalePlan>('Free');
 const [error,setError]=useState('');
 const pending=useRef<(()=>Promise<void>)|null>(null);
 const busy=useRef(false);
 const close=useCallback(()=>setOpen(false),[]);
 useEffect(()=>{
  let active=true;
  const refresh=()=>{void currentStudioQuota().then(q=>{
   if(active){setPlan(q.plan);if(['Pro','Premium','Max'].includes(q.plan)){setOpen(false)}}
  }).catch(()=>{/* A failed lookup is not proof of a Free membership. */})};
  refresh();window.addEventListener('focus',refresh);
  window.addEventListener('toolnexa-subscription-changed',refresh);
  return()=>{active=false;window.removeEventListener('focus',refresh);
   window.removeEventListener('toolnexa-subscription-changed',refresh)};
 },[]);
 const run=useCallback(async(action:(()=>Promise<void>)|null=null)=>{
  if(busy.current)return false;
  if(action)pending.current=action;
  busy.current=true;setChecking(true);setError('');
  try{
   const response=await fetch('/api/studio/upscale-authorize',{
    method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',cache:'no-store',
    body:JSON.stringify({resolution:'4k',purpose:'download'})
   });
   const data=await response.json().catch(()=>({error:'Could not verify subscription'})) as {
    error?:string;authorized?:boolean;plan?:UpscalePlan
   };
   if(response.status===401||response.status===403){
    setOpen(true);
    setError('Subscribe to Pro, Premium or Max to unlock this full-quality HD export.');
    return false;
   }
   if(!response.ok||data.authorized!==true)
    throw Error(data.error||'Subscription service is unavailable. Please retry.');
   setPlan(data.plan??'Pro');
   setOpen(false);
   const exportAction=action??pending.current;
   if(exportAction)await exportAction();
   return true;
  }catch(err){
   setError(err instanceof Error?err.message:'Unable to download your HD file.');
   return false;
  }finally{busy.current=false;setChecking(false)}
 },[]);
 const modal=<PremiumPlanModal open={open} onClose={close} feature={feature} requiredTier="Pro"
  currentPlan={plan} busy={checking} onRetry={()=>void run()}/>;
 return {run,modal,checking,error,open,plan};
}
