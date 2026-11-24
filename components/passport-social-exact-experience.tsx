'use client';
import {useEffect,useRef,useState} from 'react';
import {Crown,ShieldCheck} from 'lucide-react';
import {downloadFile,imageBlob} from '@/lib/studio-suite-client';
import {upscaleDimensions} from '@/lib/studio-upscale';
import {StudioQuotaNotice,reserveStudioUsage} from '@/components/studio-quota';
import {withPaidDownload,showDownloadGate} from '@/lib/download-access';

/** The user-supplied photo UI is sandboxed. Its pixels remain on-device;
 * only explicit user export and processing actions reach the Next.js bridge.
 */
export function PassportSocialExactExperience(){
 const frame=useRef<HTMLIFrameElement|null>(null);
 const autoUpscaleBusy=useRef(false);
 const canvasRequests=useRef(new Map<string,{
  resolve:(blob:Blob)=>void;reject:(error:Error)=>void;timeout:ReturnType<typeof setTimeout>
 }>());
 const canvasSequence=useRef(0);
 const [height,setHeight]=useState(900);

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
   if(data.type==='toolnexa-photo-auto-upscale' &&
      typeof data.id==='string' && data.id.length<80 &&
      (data.resolution==='4k'||data.resolution==='8k')){
    void automaticHdDownload(data as {id:string;resolution:'4k'|'8k';format?:string;quality?:number});
    return;
   }
   if(data.type==='toolnexa-photo-canvas-result'&&typeof data.id==='string'){
    const pending=canvasRequests.current.get(data.id);
    if(!pending)return;
    canvasRequests.current.delete(data.id);
    clearTimeout(pending.timeout);
    if(data.ok===true && data.blob && typeof data.blob.arrayBuffer==='function')pending.resolve(data.blob as Blob);
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
       if(res.status===401||res.status===403)showDownloadGate({
        kind:'subscription',feature:'Pro HD Passport / Social Photo export',
        requiredTier:'Pro',message:json.error||'Pro or higher subscription required.',
        retry:()=>withPaidDownload({
         slug:'studio-passport-social',feature:'Pro HD Passport / Social Photo export',requiredTier:'Pro'
        },async()=>{await reserveStudioUsage('studio-passport-social');
         source?.postMessage({type:'toolnexa-photo-premium-result',id,ok:true},'*');})
       });
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
    void withPaidDownload({slug:'studio-passport-social',feature:'Passport & Social Photo download'},
     async()=>{await reserveStudioUsage('studio-passport-social');
      source?.postMessage({type:'toolnexa-photo-usage-result',id,ok:true},'*');
     }).then(allowed=>{
      if(!allowed)source?.postMessage({type:'toolnexa-photo-usage-result',id,ok:false,
       error:'Active subscription required. Choose a plan in the popup, then retry the download.'},'*');
     }).catch(error=>source?.postMessage({type:'toolnexa-photo-usage-result',id,ok:false,
      error:error instanceof Error?error.message:'Download verification unavailable'},'*'));
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

 async function automaticHdDownload(request:{
  id:string;resolution:'4k'|'8k';format?:string;quality?:number
 }):Promise<void>{
  const sourceWindow=frame.current?.contentWindow;
  if(!sourceWindow)return;
  const reply=(message:string,finished=false,ok=false,upgrade=false)=>{
   sourceWindow.postMessage({
    type:'toolnexa-photo-upscale-progress',
    id:request.id,message,finished,ok,upgrade
   },'*');
  };
  if(autoUpscaleBusy.current){
   reply('Another HD export is in progress. Please finish it first.',true,false);
   return;
  }
  autoUpscaleBusy.current=true;
  let original:HTMLCanvasElement|null=null;
  let enhanced:HTMLCanvasElement|null=null;
  let output:HTMLCanvasElement|null=null;
  try{
   reply('Verifying active PayPal subscription for '+request.resolution.toUpperCase()+'…');
   const authorization=await fetch('/api/studio/upscale-authorize',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({resolution:request.resolution,purpose:'download'})
   });
   const access=await authorization.json().catch(()=>({error:'Unable to verify your membership'})) as {
    authorized?:boolean;error?:string;plan?:string
   };
   if(!authorization.ok||access.authorized!==true){
    const upgrade=authorization.status===401||authorization.status===403;
    if(upgrade)showDownloadGate({kind:'subscription',
     feature:request.resolution.toUpperCase()+' Automatic HD Download',
     requiredTier:request.resolution==='8k'?'Premium':'Pro',
     message:access.error||'Active HD subscription required.',
     retry:()=>withPaidDownload({
      slug:'studio-passport-social',
      feature:request.resolution.toUpperCase()+' Automatic HD Download',
      requiredTier:request.resolution==='8k'?'Premium':'Pro'
     },()=>automaticHdDownload(request))
    });
    reply(access.error||'Active subscription required.',true,false,upgrade);
    return;
   }
   reply('Subscription verified. Reading the current cropped and filtered photo…');
   original=await currentEditedCanvas();
   const dimensions=upscaleDimensions(original.width,original.height,request.resolution);
   const mime=['image/jpeg','image/png','image/webp'].includes(request.format||'')
    ? request.format as 'image/jpeg'|'image/png'|'image/webp' : 'image/jpeg';
   const quality=typeof request.quality==='number'&&Number.isFinite(request.quality)
    ?Math.min(1,Math.max(.65,request.quality)):.93;
   // Reserve exactly one server-validated run for a single export, AFTER
   // entitlement verification and input dimension validation.
   await reserveStudioUsage('studio-passport-social');
   let aiApplied=false;
   // Neural enhancement is optional: it operates on a compact image,
   // is most useful for smaller originals, and can fail on low-memory phones.
   // Do not downgrade an already-large original to 320px for an AI pass.
   if(Math.max(original.width,original.height)<=900){
    try{
     const {neuralEnhance2x}=await import('@/lib/studio-neural-upscale');
     enhanced=await neuralEnhance2x(original,reply);
     aiApplied=true;
    }catch(error){
     reply('Neural model unavailable; automatically switching to high-quality local HD resize…');
     if(enhanced){enhanced.width=0;enhanced.height=0;enhanced=null;}
    }
   }else{
    reply('Preserving the original photo detail with automatic high-quality HD resize…');
   }
   // Keep image processing local. Browsers with insufficient memory report
   // a clear error instead of generating a corrupted or lower-resolution file.
   reply('Rendering '+dimensions.width+' × '+dimensions.height+' '+request.resolution.toUpperCase()+' image…');
   output=document.createElement('canvas');
   output.width=dimensions.width;
   output.height=dimensions.height;
   const ctx=output.getContext('2d',{alpha:mime!=='image/jpeg'});
   if(!ctx)throw Error('Your device cannot allocate this HD output. Try 4K on a device with more memory.');
   ctx.imageSmoothingEnabled=true;
   ctx.imageSmoothingQuality='high';
   if(mime==='image/jpeg'){
    ctx.fillStyle='#ffffff';
    ctx.fillRect(0,0,dimensions.width,dimensions.height);
   }
   ctx.drawImage(enhanced||original,0,0,dimensions.width,dimensions.height);
   reply('Saving '+request.resolution.toUpperCase()+' photo…');
   const blob=await imageBlob(output,mime,quality);
   if(blob.type!==mime)throw Error('This browser cannot export the chosen format. Select JPG and retry.');
   const ext=mime==='image/jpeg'?'jpg':mime==='image/png'?'png':'webp';
   downloadFile(blob,'toolnexa-'+request.resolution+'-auto-hd-'+dimensions.width+'x'+dimensions.height+'.'+ext);
   reply('✓ '+request.resolution.toUpperCase()+' HD download started ('+
    dimensions.width+' × '+dimensions.height+' px). '+
    (aiApplied?'Neural AI detail pass applied.':'Original details preserved with high-quality enlargement.'),true,true);
  }catch(error){
   reply(error instanceof Error?error.message:'Automatic HD export failed. Try again.',true,false);
  }finally{
   if(output){output.width=0;output.height=0;}
   if(enhanced){enhanced.width=0;enhanced.height=0;}
   if(original){original.width=0;original.height=0;}
   autoUpscaleBusy.current=false;
  }
 }

 return <div style={{background:'#060913',minHeight:0,overflow:'hidden'}}>
  <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6" style={{color:'#f8fafc'}}>
   <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-slate-900/70 px-4 py-3">
    <span className="flex items-center gap-2 text-xs sm:text-sm text-slate-200"><ShieldCheck size={17} className="text-cyan-300"/> Your uploaded Studio layout · Browser-local photo editing</span>
    <span className="inline-flex items-center gap-2 rounded-xl bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-200 border border-amber-400/30"><Crown size={16}/> Automatic 4K / 8K HD in Smart Export</span>
   </div>
   <StudioQuotaNotice/>
  </div>
  <iframe ref={frame} src="/studio-passport-social-reference.html"
   title="ToolNexa Passport and Social Photo Studio — original premium design"
   style={{display:'block',width:'100%',height:height+'px',border:0,background:'#060913'}}
   scrolling="no" loading="eager" sandbox="allow-scripts allow-downloads allow-top-navigation-by-user-activation"/>

 </div>;
}
