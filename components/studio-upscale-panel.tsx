'use client';
import {useEffect,useRef,useState} from 'react';
import {PremiumPlanModal} from '@/components/premium-plan-modal';
import {currentStudioQuota,reserveStudioUsage} from '@/components/studio-quota';
import {downloadFile,imageBlob} from '@/lib/studio-suite-client';
import {canUpscale,upscaleDimensions,type UpscalePlan,type UpscaleResolution} from '@/lib/studio-upscale';
import type {StudioRunSlug} from '@/lib/studio-run-slugs';

export function StudioUpscalePanel({getCanvas,format='photo',disabled=false,sourceKey='',usageSlug='studio-enhance',enableAI=false}:{
 getCanvas:()=>Promise<HTMLCanvasElement>;
 format?:'photo'|'cutout'|'vector';
 disabled?:boolean;
 /** Reset ready exports whenever a source photo or processing setting changes. */
 sourceKey?:string;
 /** Charge one shared daily run when an image preview is actually processed. */
 usageSlug?:StudioRunSlug;
 /** Real neural inference is opt-in and available for photographic inputs. */
 enableAI?:boolean;
}){
 const [resolution,setResolution]=useState<UpscaleResolution>('4k');
 const [engine,setEngine]=useState<'classic'|'ai'>('classic');
 const [plan,setPlan]=useState<UpscalePlan|null>(null);
 const [planError,setPlanError]=useState(false);
 const [message,setMessage]=useState('');
 const [working,setWorking]=useState(false);
 const [checkingDownload,setCheckingDownload]=useState(false);
 const [showPlans,setShowPlans]=useState(false);
 const [result,setResult]=useState<Blob|null>(null);
 const [resultUrl,setResultUrl]=useState('');
 const [resultSize,setResultSize]=useState('');
 const [lastFormat,setLastFormat]=useState<'jpg'|'png'>('jpg');
 const prepared=useRef<HTMLCanvasElement|null>(null);
 const [approved,setApproved]=useState(false);
 const generation=useRef(0);
 useEffect(()=>{
  let active=true;
  const refresh=()=>void currentStudioQuota().then(q=>{
   if(active){setPlan(q.plan);setPlanError(false);if(canUpscale(q.plan,resolution)){setApproved(true);setShowPlans(false)}}
  }).catch(()=>{if(active){setPlan(null);setPlanError(true)}});
  refresh();
  window.addEventListener('focus',refresh);
  window.addEventListener('toolnexa-subscription-changed',refresh);
  return()=>{active=false;window.removeEventListener('focus',refresh);
   window.removeEventListener('toolnexa-subscription-changed',refresh)};
 },[]);
 useEffect(()=>()=>{if(resultUrl)URL.revokeObjectURL(resultUrl)},[resultUrl]);
 useEffect(()=>{
  generation.current+=1;
  prepared.current=null;
  setWorking(false);setResult(null);setResultUrl('');setResultSize('');setMessage('');setApproved(false);setShowPlans(false);
 },[resolution,sourceKey,engine]);
 const requiredTier=resolution==='8k'?'Premium':resolution==='2x'?'Starter':'Pro';
 const entitled=plan!==null&&canUpscale(plan,resolution);
 const resultReady=result!==null&&!working;
 async function upscale(){
  if(working||disabled)return;
  const id=++generation.current;
  setWorking(true);setMessage('Preparing upscale preview…');
  prepared.current=null;setResult(null);setResultUrl('');setResultSize('');setShowPlans(false);
  try{
   const source=await getCanvas();
   if(generation.current!==id)return;
   const {width,height}=upscaleDimensions(source.width,source.height,resolution);
   // Everyone can process a preview. Keep the original three shared daily Free runs.
   await reserveStudioUsage(usageSlug);
   if(generation.current!==id)return;
   setMessage('Preparing '+(engine==='ai'?'AI detail reconstruction':'high-quality enlargement')+'…');
   await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   let renderSource=source;
   if(enableAI&&engine==='ai'&&format==='photo'){
    const {neuralEnhance2x}=await import('@/lib/studio-neural-upscale');
    renderSource=await neuralEnhance2x(source,setMessage);
   }
   if(generation.current!==id)return;
   setMessage('Creating a fast '+resolution.toUpperCase()+' preview…');
   await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   // Preview remains light on mobile. Only paying members are offered full-size
   // rendering after a fresh, server-verified subscription check.
   const maxPreview=720;
   const ratio=Math.min(1,maxPreview/Math.max(width,height));
   const pw=Math.max(1,Math.round(width*ratio)),ph=Math.max(1,Math.round(height*ratio));
   const preview=document.createElement('canvas');preview.width=pw;preview.height=ph;
   const previewCtx=preview.getContext('2d');
   if(!previewCtx)throw Error('Could not make a preview on this device.');
   previewCtx.imageSmoothingEnabled=true;previewCtx.imageSmoothingQuality='high';
   if(format==='photo'){previewCtx.fillStyle='#fff';previewCtx.fillRect(0,0,pw,ph)}
   previewCtx.drawImage(renderSource,0,0,pw,ph);
   const labelSize=Math.max(12,Math.round(Math.min(pw,ph)*.044));
   previewCtx.font='bold '+labelSize+'px sans-serif';previewCtx.textAlign='center';
   previewCtx.fillStyle='rgba(12,18,36,.58)';
   previewCtx.fillRect(0,Math.max(0,ph-labelSize*2.8),pw,labelSize*2.8);
   previewCtx.fillStyle='#ffffff';
   previewCtx.fillText('TOOLNEXA · PREVIEW ONLY',pw/2,ph-labelSize*.9);
   const blob=await imageBlob(preview,'image/png');
   if(generation.current!==id)return;
   const url=URL.createObjectURL(blob);
   prepared.current=renderSource;
   setResult(blob);setResultUrl(url);setResultSize(width+' × '+height+' px');
   setLastFormat(format==='photo'?'jpg':'png');
   setMessage('✓ Preview ready ('+width+' × '+height+' px). Tap Download to unlock the high-resolution file. Your preview stays available when you open pricing.');
   preview.width=0;preview.height=0;
  }catch(err){
   if(generation.current===id)setMessage(err instanceof Error?err.message:'Upscale failed. Try a smaller image.');
  }finally{
   if(generation.current===id)setWorking(false);
  }
 }
 async function download(){
  if(checkingDownload||working)return;
  setCheckingDownload(true);
  setMessage('Checking your active PayPal subscription…');
  try{
   const response=await fetch('/api/studio/upscale-authorize',{
    method:'POST',headers:{'Content-Type':'application/json'},
    credentials:'same-origin',cache:'no-store',
    body:JSON.stringify({resolution,purpose:'download'})
   });
   const data=await response.json().catch(()=>({error:'Unable to verify your plan'})) as {
    authorized?:boolean;error?:string;plan?:UpscalePlan
   };
   if(response.status===401||response.status===403){
    setApproved(false);setShowPlans(true);
    setMessage('Full-resolution '+resolution.toUpperCase()+' download requires '+requiredTier+
     ' or higher. Select a subscription in the popup. No file was downloaded.');
    return;
   }
   if(!response.ok||data.authorized!==true)throw Error(data.error||'Subscription verification failed. Try again.');
   if(data.plan)setPlan(data.plan);
   setApproved(true);setShowPlans(false);
   if(!resultReady||!prepared.current){
    setMessage('Your subscription is active. Upload an image and click Enhance & Upscale Image to prepare the download.');
    return;
   }
   setMessage('Subscription verified. Preparing your full-resolution '+resultSize+' export…');
   const id=generation.current;
   const {width,height}=upscaleDimensions(prepared.current.width,prepared.current.height,resolution);
   // 2x/4x must use the original source dimensions; 4K/8K bounds were already
   // computed when the preview was created. Read the exact stored output size.
   const requested=resultSize.match(/^(\d+) × (\d+) px$/);
   const w=requested?Number(requested[1]):width,h=requested?Number(requested[2]):height;
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext('2d',{alpha:format!=='photo'});
   if(!ctx)throw Error('Your device cannot allocate a full '+resolution.toUpperCase()+
    ' image. Try 2× or 4K on a device with more memory.');
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   if(format==='photo'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h)}
   ctx.drawImage(prepared.current,0,0,w,h);
   const file=await imageBlob(canvas,format==='photo'?'image/jpeg':'image/png',.94);
   canvas.width=0;canvas.height=0;
   if(generation.current!==id)return;
   downloadFile(file,'toolnexa-'+resolution+'-upscaled.'+lastFormat);
   setMessage('✓ Full-quality '+resultSize+' download started. Your '+data.plan+' subscription is active.');
  }catch(err){setMessage(err instanceof Error?err.message:'Download verification failed. Please retry.')}
  finally{setCheckingDownload(false)}
 }
 return <section className="studio-upscale-panel" aria-label="Image upscaling and subscription-gated download">
  <h2>Upscale Image · HD to 8K</h2>
  <p className="studio-note">Upload your image, select output size and enhance. Preview first; the full-resolution download needs a subscription. Free: 3 shared tool runs per UTC day.</p>
  <label htmlFor="studio-shared-upscale-resolution">Output resolution</label>
  <select id="studio-shared-upscale-resolution" value={resolution}
   onChange={event=>setResolution(event.target.value as UpscaleResolution)}>
   <option value="2x">2× HD · Download Starter+</option>
   <option value="4x">4× HD · Download Pro+</option>
   <option value="4k">4K · up to 3840×2160 · Download Pro+</option>
   <option value="8k">8K · up to 7680×4320 · Download Premium/Max</option>
  </select>
  {enableAI&&format==='photo'&&<>
   <label htmlFor="studio-upscale-engine">Enhancement quality</label>
   <select id="studio-upscale-engine" value={engine} onChange={event=>setEngine(event.target.value as 'classic'|'ai')}>
    <option value="classic">Classic HD · Fast, original colours</option>
    <option value="ai">AI Detail · Neural 2× pass (experimental)</option>
   </select>
   <p className="studio-note">{engine==='ai'?
    'Uses a trained on-device neural 2× model for edges/textures, then resizes to the selected 4K/8K dimensions. First use downloads model weights; processing may be slow or unsupported on some phones. Details are estimates, not recovered ground truth.':
    'Fast high-quality canvas enlargement. Colour, sharpness and denoise settings are applied before upscaling.'}</p>
  </>}
  <button type="button" onClick={()=>void upscale()} disabled={working||disabled}>
   {working?'Enhancing…':'✦ Enhance & Upscale Image'}
  </button>
  {resultUrl&&<div className="studio-upscale-preview"><img src={resultUrl} alt={'Watermarked low-resolution preview of '+resolution.toUpperCase()+' upscaled artwork'}/></div>}
  {resultReady&&<p className="studio-upscale-result">✓ Upscale complete — {resultSize}. Preview ready.</p>}
  <button type="button" className="studio-hd studio-premium-download" disabled={checkingDownload||working}
   aria-label={'Download Upscaled '+resolution.toUpperCase()+' image'}
   onClick={()=>void download()}>
   {checkingDownload?'Verifying & preparing download…':approved?'↓ Download Full '+resolution.toUpperCase():'🔒 Download '+resolution.toUpperCase()+' · Unlock'}
  </button>
  {!resultReady&&<p className="studio-note">Download is always clickable. Free users see subscription plans; subscribed users should enhance the image first.</p>}
  {resultReady&&<p className="studio-note">Full-resolution download requires an active {requiredTier} plan or higher. Click Download to check your subscription and view plans when needed.</p>}
  {planError?<p className="studio-note" role="status">Plan status could not be loaded. Download checks your subscription again.</p>:
   plan!==null?<p className="studio-note">Current plan: <strong>{plan}</strong>. {entitled?'Download will verify your active subscription.':'The '+resolution.toUpperCase()+' download requires '+requiredTier+' or higher.'}</p>:null}
  <p className="studio-message" role="status">{message||'Upload an image, then click Upscale Image. No subscription needed to view a preview.'}</p>
  <PremiumPlanModal open={showPlans} onClose={()=>setShowPlans(false)}
    feature={resolution.toUpperCase()+' high-resolution download'} requiredTier={requiredTier}
    currentPlan={plan??'Free'} busy={checkingDownload} onRetry={()=>void download()}/>

 </section>;
}
