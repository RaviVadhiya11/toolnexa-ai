'use client';
import {useEffect,useRef,useState} from 'react';
import {Archive,CheckCircle2,ShieldCheck} from 'lucide-react';
import {currentStudioQuota,reserveStudioUsage,StudioQuotaNotice} from '@/components/studio-quota';
import {showDownloadGate} from '@/lib/download-access';
import type {DownloadTier} from '@/lib/download-access';

type ZipRequest={id:string;count:number;bytes:number;mode:'fast'|'smart'|'maximum'};
type ZipDecision={authorized?:boolean;plan?:string;requiredTier?:DownloadTier;error?:string};
function isZipRequest(data:Record<string,unknown>):data is Record<string,unknown>&ZipRequest{
 return typeof data.id==='string'&&data.id.length<=80&&
 typeof data.count==='number'&&Number.isSafeInteger(data.count)&&data.count>0&&data.count<=300&&
 typeof data.bytes==='number'&&Number.isSafeInteger(data.bytes)&&data.bytes>=0&&data.bytes<=300*1048576&&
 (data.mode==='fast'||data.mode==='smart'||data.mode==='maximum');
}

/** The user's approved ZIP Maker design runs in a source-checked sandbox.
 * Actual files remain local; PayPal membership and shared daily quotas
 * are checked by the main ToolNexa account app before ZIP creation.
 */
export function ZipMakerExperience(){
 const frame=useRef<HTMLIFrameElement|null>(null);
 const busy=useRef(false);
 const [height,setHeight]=useState(1080);
 const [status,setStatus]=useState('Choose files to create an archive. A paid subscription is required to download.');

 useEffect(()=>{
  const send=(data:object)=>frame.current?.contentWindow?.postMessage(data,'*');
  const syncPlan=async()=>{
   try{
    const q=await currentStudioQuota();
    send({type:'toolnexa-zip-plan',plan:q.plan,remaining:Math.max(0,q.limit-q.used)});
   }catch{setStatus('Account plan information temporarily unavailable. Exports will still verify your subscription.');}
  };
  async function authorize(req:ZipRequest,retry=false):Promise<boolean>{
   if(busy.current){
    if(!retry)send({type:'toolnexa-zip-access-result',id:req.id,ok:false,error:'Another ZIP export is being verified.'});
    return false;
   }
   busy.current=true;
   try{
    setStatus('Checking active PayPal membership and ZIP file limits…');
    const res=await fetch('/api/studio/zip-authorize',{
     method:'POST',credentials:'same-origin',cache:'no-store',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({count:req.count,bytes:req.bytes,mode:req.mode})
    });
    const data=await res.json().catch(()=>({error:'Subscription verification failed'})) as ZipDecision;
    if(!res.ok||data.authorized!==true){
     const upgrade=res.status===401||res.status===403;
     const message=data.error||'Cannot authorize your ZIP download.';
     setStatus(message);
     if(!retry)send({type:'toolnexa-zip-access-result',id:req.id,ok:false,error:message});
     if(upgrade&&!retry){
      showDownloadGate({kind:'subscription',feature:'Advanced ZIP Maker',
       requiredTier:data.requiredTier||'Starter',currentPlan:data.plan||'Free',
       message,retry:()=>authorize(req,true)});
     }
     return false;
    }
    // Only one shared run per ZIP. This reservation is atomic for account users.
    await reserveStudioUsage('studio-zip-maker');
    setStatus('Verified '+data.plan+' subscription. Creating the ZIP on your device…');
    if(retry)send({type:'toolnexa-zip-resume',id:req.id});
    else send({type:'toolnexa-zip-access-result',id:req.id,ok:true,plan:data.plan});
    void syncPlan();
    return true;
   }catch(error){
    const message=error instanceof Error?error.message:'Could not authorize ZIP export.';
    setStatus(message);
    if(!retry)send({type:'toolnexa-zip-access-result',id:req.id,ok:false,error:message});
    return false;
   }finally{busy.current=false;}
  }
  const onMessage=(event:MessageEvent)=>{
   // Sandboxed frame has an opaque null origin. Check its exact window as well.
   if(event.origin!=='null'||event.source!==frame.current?.contentWindow)return;
   const data=event.data;
   if(!data||typeof data!=='object')return;
   if(data.type==='toolnexa-zip-height'){
    const next=Number(data.height);
    if(Number.isFinite(next)&&next>=300&&next<=9500)
     setHeight(previous=>Math.abs(previous-next)>4?Math.ceil(next)+4:previous);
   }
   if(data.type==='toolnexa-zip-ready')void syncPlan();
   if(data.type==='toolnexa-zip-access'){
    if(isZipRequest(data))void authorize(data);
    else if(typeof data.id==='string')send({type:'toolnexa-zip-access-result',id:data.id,
     ok:false,error:'ZIP must contain 1–300 files and at most 300 MB.'});
   }
  };
  window.addEventListener('message',onMessage);
  const refresh=()=>void syncPlan();
  window.addEventListener('focus',refresh);
  window.addEventListener('toolnexa-subscription-changed',refresh);
  window.addEventListener('toolnexa-usage-changed',refresh);
  return()=>{
   window.removeEventListener('message',onMessage);
   window.removeEventListener('focus',refresh);
   window.removeEventListener('toolnexa-subscription-changed',refresh);
   window.removeEventListener('toolnexa-usage-changed',refresh);
  };
 },[]);

 return <div className="zip-maker-experience" style={{background:'#090a14',color:'#eff1ff'}}>
  <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
   <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-500/30 bg-slate-900/80 px-4 py-3">
    <div className="flex items-center gap-2 text-sm font-bold"><Archive className="text-violet-300" size={19}/> Advanced ZIP Maker Studio</div>
    <div className="flex items-center gap-2 text-xs text-emerald-300"><ShieldCheck size={16}/> Files stay on your device</div>
   </div>
   <StudioQuotaNotice/>
   <div role="status" aria-live="polite" className="my-2 flex items-start gap-2 text-xs text-slate-300">
    <CheckCircle2 size={16} className="shrink-0 text-cyan-400"/>{status}
   </div>
  </div>
  <iframe ref={frame} src="/studio-zip-maker.html"
   title="ToolNexa ZIP Maker Studio — folder upload, compression and verified ZIP download"
   sandbox="allow-scripts allow-downloads allow-top-navigation-by-user-activation"
   scrolling="no" loading="eager"
   style={{display:'block',border:0,background:'#090a14',width:'100%',height:height+'px'}}/>
 </div>;
}
