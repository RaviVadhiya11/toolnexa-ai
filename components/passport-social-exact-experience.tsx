'use client';
import {useEffect,useRef,useState} from 'react';
import {Crown,ShieldCheck,Sparkles} from 'lucide-react';
import {StudioQuotaNotice,reserveStudioUsage} from '@/components/studio-quota';
import {StudioUpscalePanel} from '@/components/studio-upscale-panel';

/** The user-supplied photo UI is sandboxed. Its pixels remain on-device;
 * only explicit user export and processing actions reach the Next.js bridge.
 */
export function PassportSocialExactExperience(){
 const frame=useRef<HTMLIFrameElement|null>(null);
 const aiSection=useRef<HTMLElement|null>(null);
 const canvasRequests=useRef(new Map<string,{
  resolve:(blob:Blob)=>void;reject:(error:Error)=>void;timeout:ReturnType<typeof setTimeout>
 }>());
 const canvasSequence=useRef(0);
 const [height,setHeight]=useState(900);
 const [photoRevision,setPhotoRevision]=useState('0');
 const [showAi,setShowAi]=useState(false);

 useEffect(()=>{
  const onMessage=(event:MessageEvent)=>{
   // sandboxed source has opaque origin 'null'; both checks are required.
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
   if(data.type==='toolnexa-photo-revision'){
    if(Number.isSafeInteger(data.revision)&&data.revision>=0)
     setPhotoRevision(String(data.revision));
    return;
   }
   if(data.type==='toolnexa-photo-open-ai'){
    setShowAi(true);
    requestAnimationFrame(()=>aiSection.current?.scrollIntoView({behavior:'smooth',block:'start'}));
    return;
   }
   if(data.type==='toolnexa-photo-canvas-result'&&typeof data.id==='string'){
    const pending=canvasRequests.current.get(data.id);
    if(!pending)return;
    canvasRequests.current.delete(data.id);
    clearTimeout(pending.timeout);
    if(data.ok===true&&data.blob instanceof Blob)pending.resolve(data.blob);
    else pending.reject(new Error(typeof data.error==='string'?data.error:'Unable to read your edited photo'));
    return;
   }
   // Live subscription is verified on the server on EVERY premium request.
   if(data.type==='toolnexa-photo-premium' &&
      typeof data.id==='string' && data.id.length<80 &&
      (data.resolution==='4k'||data.resolution==='8k')){
    const source=frame.current?.contentWindow,id=data.id;
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
  const outstanding=canvasRequests.current;
  return()=>{
   window.removeEventListener('message',onMessage);
   for(const pending of outstanding.values()){
    clearTimeout(pending.timeout);pending.reject(new Error('Studio closed'));
   }
   outstanding.clear();
  };
 },[]);

 async function currentEditedCanvas():Promise<HTMLCanvasElement>{
  const source=frame.current?.contentWindow;
  if(!source)throw Error('The photo editor is not ready. Reload this page and try again.');
  const id='ai-source-'+(++canvasSequence.current);
  const blob=await new Promise<Blob>((resolve,reject)=>{
   const timeout=setTimeout(()=>{
    canvasRequests.current.delete(id);
    reject(new Error('Timed out reading the edited photo. Please retry.'));
   },15000);
   canvasRequests.current.set(id,{resolve,reject,timeout});
   source.postMessage({type:'toolnexa-photo-canvas-request',id},'*');
  });
  const bitmap=await createImageBitmap(blob);
  const canvas=document.createElement('canvas');
  canvas.width=bitmap.width;canvas.height=bitmap.height;
  const context=canvas.getContext('2d');
  if(!context){bitmap.close();throw Error('Canvas is unavailable in this browser.');}
  context.drawImage(bitmap,0,0);
  bitmap.close();
  return canvas;
 }

 return <div style={{background:'#060913',minHeight:0,overflow:'hidden'}}>
  <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6" style={{color:'#f8fafc'}}>
   <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-slate-900/70 px-4 py-3">
    <span className="flex items-center gap-2 text-xs sm:text-sm text-slate-200"><ShieldCheck size={17} className="text-cyan-300"/> Your uploaded Studio layout · Browser-local photo editing</span>
    <span className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-200 border border-amber-400/30"><Crown size={16}/> Pro HD tools in this editor ↓</span>
   </div>
   <StudioQuotaNotice/>
  </div>
  <iframe ref={frame} src="/studio-passport-social-reference.html"
   title="ToolNexa Passport and Social Photo Studio — original premium design"
   style={{display:'block',width:'100%',height:height+'px',border:0,background:'#060913'}}
   scrolling="no" loading="eager" sandbox="allow-scripts allow-downloads allow-top-navigation-by-user-activation"/>
  <section ref={aiSection} id="toolnexa-inline-ai-upscaler"
   className="mx-auto max-w-7xl px-4 pt-2 pb-8 sm:px-6"
   style={{color:'#f8fafc',scrollMarginTop:90}}>
   <div className="rounded-2xl border border-violet-500/35 bg-slate-900/80 p-4 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <div><span className="text-xs font-black tracking-wider text-cyan-300">ADVANCED · SAME-PAGE PHOTO</span>
      <h2 className="mt-2 flex items-center gap-2 text-lg sm:text-xl font-extrabold"><Sparkles size={20} className="text-violet-300"/> AI Detail &amp; 4K / 8K Upscaler</h2>
      <p className="mt-2 text-xs sm:text-sm text-slate-300">Uses your current photo, crop, color and adjustments automatically. No second upload or page change. Preview is watermarked; full HD downloads require verified plans.</p>
     </div>
     {!showAi&&<button type="button"
      className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-3 text-sm font-bold text-white"
      onClick={()=>setShowAi(true)}>Open Advanced AI Tools</button>}
    </div>
    {showAi&&<div className="mt-4">
     <StudioUpscalePanel getCanvas={currentEditedCanvas}
      format="photo" usageSlug="studio-passport-social"
      sourceKey={photoRevision} enableAI/>
    </div>}
   </div>
  </section>
 </div>;
}
