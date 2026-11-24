'use client';
export type DownloadTier='Starter'|'Pro'|'Premium';
export type GateKind='subscription'|'limit'|'error';
export type DownloadGateEvent={
 kind:GateKind;feature:string;message:string;requiredTier:DownloadTier;
 currentPlan?:string;retry?:()=>Promise<boolean>
};
export const GATE_EVENT='toolnexa-download-access-required';
export const GATE_GRANTED_EVENT='toolnexa-download-access-granted';
export function showDownloadGate(input:DownloadGateEvent){
 window.dispatchEvent(new CustomEvent<DownloadGateEvent>(GATE_EVENT,{detail:input}));
}
type Options={slug:string;feature:string;requiredTier?:DownloadTier};
// A download is allowed only after a fresh, authenticated server verification.
// This is a client-side UX helper, not a security boundary for data stored in
// the browser; server-controlled paid exports must still authorize themselves.
export async function withPaidDownload(
 options:Options,onAllowed:()=>void|Promise<void>
):Promise<boolean>{
 const tier=options.requiredTier||'Starter';
 try{
  const res=await fetch('/api/tools/download-authorize',{
   method:'POST',credentials:'same-origin',cache:'no-store',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({slug:options.slug,requiredTier:tier})
  });
  const data=await res.json().catch(()=>({error:'Unable to check subscription'})) as {
   authorized?:boolean;error?:string;plan?:string
  };
  if(res.ok&&data.authorized===true){
   await onAllowed();
   window.dispatchEvent(new Event(GATE_GRANTED_EVENT));
   return true;
  }
  const isUpgrade=res.status===401||res.status===403;
  showDownloadGate({
   kind:isUpgrade?'subscription':'error',
   feature:options.feature,requiredTier:tier,currentPlan:data.plan||'Free',
   message:data.error||'Subscription verification failed. Please retry.',
   retry:()=>withPaidDownload(options,onAllowed)
  });
  return false;
 }catch(error){
  showDownloadGate({kind:'error',feature:options.feature,requiredTier:tier,
   message:error instanceof Error?error.message:'Unable to verify download access',
   retry:()=>withPaidDownload(options,onAllowed)});
  return false;
 }
}
