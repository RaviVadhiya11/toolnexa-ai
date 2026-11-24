'use client';
import {useEffect,useRef,useState} from 'react';
import {Crown,ShieldCheck} from 'lucide-react';
import {StudioQuotaNotice,reserveStudioUsage} from '@/components/studio-quota';

/** Renders the user's actual supplied Studio HTML, rather than a redesigned approximation.
 *  Photo data stays inside its same-origin frame; only quota request IDs cross to Next.js.
 */
export function PassportSocialExactExperience(){
 const frame=useRef<HTMLIFrameElement|null>(null);
 const [height,setHeight]=useState(900);
 useEffect(()=>{
  const onMessage=(event:MessageEvent)=>{
   // A sandboxed frame has an opaque 'null' origin; source identity is mandatory.
   if(event.origin!=='null'||event.source!==frame.current?.contentWindow)return;
   const data=event.data;
   if(!data||typeof data!=='object')return;
   if(data.type==='toolnexa-photo-height'){
    const size=Number(data.height);
    if(Number.isFinite(size)&&size>250){
     const next=Math.max(300,Math.min(9000,Math.ceil(size)+2));
     setHeight(previous=>Math.abs(previous-next)>3?next:previous);
    }
    return;
   }

   // Premium entitlement is verified in Next.js on every request, never in
   // the sandboxed HTML editor, and usage is reserved only after approval.
   if(data.type==='toolnexa-photo-premium' &&
      typeof data.id==='string' && data.id.length<80 &&
      (data.resolution==='4k'||data.resolution==='8k')){
    const source=frame.current?.contentWindow;
    const id=data.id;
    void (async()=>{
     try{
      const res=await fetch('/api/studio/upscale-authorize',{
       method:'POST',credentials:'same-origin',cache:'no-store',
       headers:{'Content-Type':'application/json'},
       body:JSON.stringify({purpose:'download',resolution:data.resolution})
      });
      const json=await res.json().catch(()=>({error:'Membership verification failed'})) as {
       authorized?:boolean;error?:string;plan?:string
      };
      if(!res.ok||json.authorized!==true){
       source?.postMessage({type:'toolnexa-photo-premium-result',id,ok:false,
        upgrade:res.status===401||res.status===403,
        error:json.error||'Pro or higher subscription is required.'},'*');
       return;
      }
      await reserveStudioUsage('studio-passport-social');
      source?.postMessage({type:'toolnexa-photo-premium-result',id,ok:true,
       plan:json.plan},'*');
     }catch(error){
      source?.postMessage({type:'toolnexa-photo-premium-result',id,ok:false,
       error:error instanceof Error?error.message:'Premium verification unavailable'},'*');
     }
    })();
    return;
   }
   if(data.type==='toolnexa-photo-usage'&&typeof data.id==='string'&&data.id.length<80){
    const source=frame.current?.contentWindow;
    const id=data.id;
    void reserveStudioUsage('studio-passport-social')
     .then(()=>source?.postMessage({type:'toolnexa-photo-usage-result',id,ok:true},'*'))
     .catch(error=>source?.postMessage({
      type:'toolnexa-photo-usage-result',id,ok:false,
      error:error instanceof Error?error.message:'Unable to verify daily usage'
     },'*'));
   }
  };
  window.addEventListener('message',onMessage);
  return()=>window.removeEventListener('message',onMessage);
 },[]);
 return <div style={{background:'#060913',minHeight:0,overflow:'hidden'}}>
  <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6" style={{color:'#f8fafc'}}>
   <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-slate-900/70 px-4 py-3">
    <span className="flex items-center gap-2 text-xs sm:text-sm text-slate-200"><ShieldCheck size={17} className="text-cyan-300"/> Your uploaded Studio layout · Browser-local photo editing</span>
    <span className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-200 border border-amber-400/30"><Crown size={16}/> Pro HD tools in this editor ↓</span>
   </div>
   <StudioQuotaNotice/>
  </div>
  <iframe ref={frame} src="/studio-passport-social-reference.html" title="ToolNexa Passport and Social Photo Studio — original premium design"
    style={{display:'block',width:'100%',height:height+'px',border:0,background:'#060913'}}
    scrolling="no" loading="eager" sandbox="allow-scripts allow-downloads allow-top-navigation-by-user-activation"/>
 </div>;
}
