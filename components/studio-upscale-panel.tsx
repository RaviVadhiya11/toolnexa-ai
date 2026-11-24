'use client';
import {useEffect,useRef,useState} from 'react';
import {PremiumPlanModal} from '@/components/premium-plan-modal';
import {currentStudioQuota,reserveStudioUsage} from '@/components/studio-quota';
import {downloadFile,imageBlob} from '@/lib/studio-suite-client';
import {canUpscale,upscaleDimensions,type UpscalePlan,type UpscaleResolution} from '@/lib/studio-upscale';
import type {StudioRunSlug} from '@/lib/studio-run-slugs';

export function StudioUpscalePanel({getCanvas,format='photo',disabled=false,sourceKey='',usageSlug='studio-enhance',enableAI=false,onPreviewChange}:{
 getCanvas:()=>Promise<HTMLCanvasElement>;
 format?:'photo'|'cutout'|'vector';
 disabled?:boolean;
 /** Reset ready exports whenever a source photo or processing setting changes. */
 sourceKey?:string;
 /** Charge one shared daily run when an image preview is actually processed. */
 usageSlug?:StudioRunSlug;
 /** Real neural inference is opt-in and available for photographic inputs. */
 enableAI?:boolean;
 /** Optional: mirror the actual watermarked upscale preview in its original upload stage. */
 onPreviewChange?:(url:string)=>void;
}){
 const [resolution,setResolution]=useState<UpscaleResolution>('4k');
 const [engine,setEngine]=useState<'classic'|'ai'>('classic');
 const [exportFormat,setExportFormat]=useState<'webp'|'jpeg'|'png'>(format==='photo'?'jpeg':'png');
 const [exportQuality,setExportQuality]=useState(92);
 const [phase,setPhase]=useState<'idle'|'preparing'|'processing'|'preview'|'complete'|'failed'>('idle');
 const [plan,setPlan]=useState<UpscalePlan|null>(null);
 const [planError,setPlanError]=useState(false);
 const [message,setMessage]=useState('');
 const [working,setWorking]=useState(false);
 const [checkingDownload,setCheckingDownload]=useState(false);
 const [showPlans,setShowPlans]=useState(false);
 const [result,setResult]=useState<Blob|null>(null);
 const [resultUrl,setResultUrl]=useState('');
 const [resultSize,setResultSize]=useState('');
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
 },[resolution]);
 useEffect(()=>()=>{if(resultUrl)URL.revokeObjectURL(resultUrl)},[resultUrl]);
 useEffect(()=>{
  generation.current+=1;
  prepared.current=null;
  setWorking(false);setResult(null);setResultUrl('');setResultSize('');setMessage('');setApproved(false);setShowPlans(false);setPhase('idle');
  onPreviewChange?.('');
 },[resolution,sourceKey,engine]);
 const requiredTier=resolution==='8k'?'Premium':resolution==='2x'?'Starter':'Pro';
 const entitled=plan!==null&&canUpscale(plan,resolution);
 const resultReady=result!==null&&!working;
 async function upscale(){
  if(working||disabled)return;
  const id=++generation.current;
  setWorking(true);setPhase('preparing');setMessage('Preparing upscale preview…');
  prepared.current=null;setResult(null);setResultUrl('');setResultSize('');setShowPlans(false);
  try{
   const source=await getCanvas();
   if(generation.current!==id)return;
   const {width,height}=upscaleDimensions(source.width,source.height,resolution);
   // Everyone can process a preview. Keep the original three shared daily Free runs.
   await reserveStudioUsage(usageSlug);
   if(generation.current!==id)return;
   setPhase('processing');
   setMessage('Preparing '+(engine==='ai'?'AI detail reconstruction':'high-quality enlargement')+'…');
   await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   let renderSource=source;
   if(enableAI&&engine==='ai'&&format==='photo'){
    const {neuralEnhance2x}=await import('@/lib/studio-neural-upscale');
    renderSource=await neuralEnhance2x(source,setMessage);
   }
   if(generation.current!==id)return;
   setPhase('preview');setMessage('Creating a fast '+resolution.toUpperCase()+' preview…');
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
   onPreviewChange?.(url);setPhase('complete');
   setMessage('✓ Preview ready ('+width+' × '+height+' px). Tap Download to unlock the high-resolution file. Your preview stays available when you open pricing.');
   preview.width=0;preview.height=0;
  }catch(err){
   if(generation.current===id){setPhase('failed');setMessage(err instanceof Error?err.message:'Upscale failed. Try a smaller image.');}
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
   // Match preview-selected resolution exactly; AI model size may differ from input.
   const requested=resultSize.match(/^(\d+) × (\d+) px$/);
   if(!requested)throw Error('Preview dimensions unavailable. Run Upscale again.');
   const w=Number(requested[1]),h=Number(requested[2]);
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext('2d',{alpha:exportFormat!=='jpeg'});
   if(!ctx)throw Error('Your device cannot allocate a full '+resolution.toUpperCase()+
    ' image. Try 2× or 4K on a device with more memory.');
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   if(exportFormat==='jpeg'||format==='photo'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h)}
   ctx.drawImage(prepared.current,0,0,w,h);
   const mime=exportFormat==='jpeg'?'image/jpeg':exportFormat==='webp'?'image/webp':'image/png';
   const file=await imageBlob(canvas,mime,exportQuality/100);
   if(file.type!==mime)throw Error('Your browser cannot export '+exportFormat.toUpperCase()+'. Choose PNG or JPG.');
   canvas.width=0;canvas.height=0;
   if(generation.current!==id)return;
   downloadFile(file,'toolnexa-'+resolution+'-upscaled.'+(exportFormat==='jpeg'?'jpg':exportFormat));
   setMessage('✓ Full-quality '+resultSize+' download started. Your '+data.plan+' subscription is active.');
  }catch(err){setMessage(err instanceof Error?err.message:'Download verification failed. Please retry.')}
  finally{setCheckingDownload(false)}
 }
 return <section className="studio-upscale-panel" aria-label="Image upscaling and subscription-gated download">
  <h2>Upscale Image · HD to 8K</h2>
  <p className="studio-note">Upload your image, select output size and enhance. Preview first; the full-resolution download needs a subscription. Free: 3 shared tool runs per UTC day.</p>
  <span className="studio-demo-field-label">Output resolution</span>
  <div className="studio-v4-scale-grid" role="group" aria-label="Choose output resolution">
   {([
    {key:'2x',name:'2× HD',desc:'Social & web',tier:'Starter+'},
    {key:'4x',name:'4× Ultra',desc:'Print & commerce',tier:'Pro+'},
    {key:'4k',name:'4K UHD',desc:'3840px master',tier:'Pro+'},
    {key:'8k',name:'8K Max',desc:'High-res master',tier:'Premium+'}
   ] as const).map(item=><button key={item.key} type="button"
    className={'studio-v4-scale-card '+(resolution===item.key?'selected':'')}
    aria-pressed={resolution===item.key}
    onClick={()=>setResolution(item.key)}>
     <span className="studio-v4-scale-heading"><strong>{item.name}</strong>
      <small>{item.tier}</small></span><span>{item.desc}</span>
   </button>)}
  </div>
  <label className="studio-v4-native-label" htmlFor="studio-shared-upscale-resolution">Resolution details</label>
  <select id="studio-shared-upscale-resolution" className="studio-v4-native-select" value={resolution}
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
  <div className="studio-v4-export-options" aria-label="Image output options">
   <strong>Export settings</strong>
   <div className="studio-v4-format-group" role="group" aria-label="Image file format">
    {(['webp','jpeg','png'] as const).map(item=><button key={item} type="button"
     aria-pressed={exportFormat===item} className={exportFormat===item?'selected':''}
     onClick={()=>setExportFormat(item)}>{item==='jpeg'?'JPG':item.toUpperCase()}</button>)}
   </div>
   {exportFormat!=='png'&&<label htmlFor="studio-v4-export-quality">Output quality <b>{exportQuality}%</b>
    <input type="range" id="studio-v4-export-quality" min={60} max={100} step={2}
     value={exportQuality} onChange={event=>setExportQuality(Number(event.target.value))}/>
   </label>}
   <p className="studio-note">Actual download format: <strong>{exportFormat.toUpperCase()}</strong>.
    {exportFormat==='jpeg'?' JPEG uses a white background for transparency.':' PNG and WebP preserve transparent backgrounds when the source has alpha.'}
    File size depends on image complexity.</p>
  </div>
  {working&&<div className="studio-v4-process" role="status" aria-live="polite">
   <div className="studio-v4-process-track"><span className="studio-v4-scan-bar"/></div>
   <strong>{phase==='preparing'?'Preparing your image':phase==='processing'?'Enhancing image details':'Generating preview'}</strong>
   <p>Original pixels are processed locally. A protected high-resolution download is generated after subscription verification.</p>
  </div>}
  <button type="button" className="studio-v4-enhance-cta" onClick={()=>void upscale()} disabled={working||disabled}>
   {working?'Enhancing…':'✦ Enhance & Upscale Image'}
  </button>
  {resultUrl&&<div className="studio-upscale-preview"><img src={resultUrl} alt={'Watermarked low-resolution preview of '+resolution.toUpperCase()+' upscaled artwork'}/></div>}
  {resultReady&&<p className="studio-upscale-result">✓ Upscale complete — {resultSize}. Watermarked preview ready.</p>}
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
