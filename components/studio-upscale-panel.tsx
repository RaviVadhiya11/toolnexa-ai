'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {currentStudioQuota,reserveStudioUsage} from '@/components/studio-quota';
import {downloadFile,imageBlob} from '@/lib/studio-suite-client';
import {canUpscale,upscaleDimensions,type UpscalePlan,type UpscaleResolution} from '@/lib/studio-upscale';
import type {StudioRunSlug} from '@/lib/studio-run-slugs';

const plans=[
 {name:'Starter',quality:'2× HD',description:'For basic upscale downloads'},
 {name:'Pro',quality:'4× + 4K',description:'For sharp creator exports'},
 {name:'Premium',quality:'Up to 8K',description:'For large, high-resolution images'},
 {name:'Max',quality:'Up to 8K',description:'For high-volume image exports'}
] as const;

export function StudioUpscalePanel({getCanvas,format='photo',disabled=false,sourceKey='',usageSlug='studio-enhance'}:{
 getCanvas:()=>Promise<HTMLCanvasElement>;
 format?:'photo'|'cutout'|'vector';
 disabled?:boolean;
 /** Reset ready exports whenever a source photo or processing setting changes. */
 sourceKey?:string;
 /** Charge one shared daily run when an image preview is actually processed. */
 usageSlug?:StudioRunSlug;
}){
 const [resolution,setResolution]=useState<UpscaleResolution>('4k');
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
 const generation=useRef(0);
 const closePlans=useRef<HTMLButtonElement|null>(null);
 useEffect(()=>{
  let active=true;
  const refresh=()=>void currentStudioQuota().then(q=>{
   if(active){setPlan(q.plan);setPlanError(false)}
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
  setWorking(false);setResult(null);setResultUrl('');setResultSize('');setMessage('');setShowPlans(false);
 },[resolution,sourceKey]);
 useEffect(()=>{
  if(!showPlans)return;
  closePlans.current?.focus();
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setShowPlans(false)};
  window.addEventListener('keydown',escape);
  return()=>window.removeEventListener('keydown',escape);
 },[showPlans]);
 const requiredTier=resolution==='8k'?'Premium':resolution==='2x'?'Starter':'Pro';
 const entitled=plan!==null&&canUpscale(plan,resolution);
 const resultReady=result!==null&&!working;
 async function upscale(){
  if(working||disabled)return;
  const id=++generation.current;
  setWorking(true);setMessage('Preparing upscale preview…');
  setResult(null);setResultUrl('');setResultSize('');setShowPlans(false);
  try{
   const source=await getCanvas();
   if(generation.current!==id)return;
   const {width,height}=upscaleDimensions(source.width,source.height,resolution);
   // Everyone can process a preview. Keep the original three shared daily Free runs.
   await reserveStudioUsage(usageSlug);
   if(generation.current!==id)return;
   setMessage('Upscaling '+source.width+' × '+source.height+' to '+width+' × '+height+' pixels…');
   await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   const canvas=document.createElement('canvas');
   canvas.width=width;canvas.height=height;
   const context=canvas.getContext('2d',{alpha:format!=='photo'});
   if(!context)throw Error('This device cannot allocate '+resolution.toUpperCase()+'. Try a smaller resolution.');
   context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
   if(format==='photo'){context.fillStyle='#ffffff';context.fillRect(0,0,width,height)}
   context.drawImage(source,0,0,width,height);
   // Keep the full-resolution Blob private to component state. Only show a reduced
   // watermarked preview; never expose the full-resolution Blob through an image URL.
   const type=format==='photo'?'image/jpeg':'image/png';
   const blob=await imageBlob(canvas,type,.94);
   const maxPreview=720;
   const ratio=Math.min(1,maxPreview/Math.max(width,height));
   const pw=Math.max(1,Math.round(width*ratio)),ph=Math.max(1,Math.round(height*ratio));
   const preview=document.createElement('canvas');preview.width=pw;preview.height=ph;
   const previewCtx=preview.getContext('2d');
   if(!previewCtx)throw Error('Could not make a preview. Try a smaller image.');
   previewCtx.imageSmoothingEnabled=true;previewCtx.imageSmoothingQuality='high';
   previewCtx.drawImage(canvas,0,0,pw,ph);
   const labelSize=Math.max(12,Math.round(Math.min(pw,ph)*.044));
   previewCtx.font='bold '+labelSize+'px sans-serif';previewCtx.textAlign='center';
   previewCtx.fillStyle='rgba(12,18,36,.58)';
   previewCtx.fillRect(0,Math.max(0,ph-labelSize*2.8),pw,labelSize*2.8);
   previewCtx.fillStyle='#ffffff';
   previewCtx.fillText('TOOLNEXA · PREVIEW ONLY',pw/2,ph-labelSize*.9);
   const previewBlob=await imageBlob(preview,'image/png');
   if(generation.current!==id)return;
   const url=URL.createObjectURL(previewBlob);
   setResult(blob);setResultUrl(url);setResultSize(width+' × '+height+' px');
   setLastFormat(type==='image/png'?'png':'jpg');
   setMessage('✓ Upscale complete ('+width+' × '+height+' px). Preview is ready. Click Download to see the subscription plans, or download with an eligible active plan.');
   canvas.width=0;canvas.height=0;preview.width=0;preview.height=0;
  }catch(err){
   if(generation.current===id)setMessage(err instanceof Error?err.message:'Upscale failed. Try a smaller image.');
  }finally{
   if(generation.current===id)setWorking(false);
  }
 }
 async function download(){
  if(!resultReady||!result||checkingDownload)return;
  setCheckingDownload(true);
  setMessage('Checking your active subscription before download…');
  try{
   const response=await fetch('/api/studio/upscale-authorize',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({resolution,purpose:'download'})
   });
   const data=await response.json().catch(()=>({error:'Unable to verify your plan'})) as {authorized?:boolean;error?:string;plan?:UpscalePlan};
   if(response.status===401||response.status===403){
    setShowPlans(true);
    setMessage('The preview is ready. Subscribe to '+requiredTier+' or higher to download '+resolution.toUpperCase()+'. No file was downloaded.');
    return;
   }
   if(!response.ok||data.authorized!==true)throw Error(data.error||'Subscription verification failed.');
   if(data.plan)setPlan(data.plan);
   downloadFile(result,'toolnexa-'+resolution+'-upscaled.'+lastFormat);
   setShowPlans(false);
   setMessage('Download started: '+resultSize+'. Your '+data.plan+' subscription is active.');
  }catch(err){
   setMessage(err instanceof Error?err.message:'Download authorization failed. Please retry.');
  }finally{setCheckingDownload(false)}
 }
 return <section className="studio-upscale-panel" aria-label="Image upscaling and subscription-gated download">
  <h2>Upscale Image · HD to 8K</h2>
  <p className="studio-note">Upscale a preview first, then subscribe to download the full-resolution image. Free users can try up to 3 shared tool operations per UTC day. This is high-quality pixel interpolation, not generative AI detail recovery.</p>
  <label htmlFor="studio-shared-upscale-resolution">Output resolution</label>
  <select id="studio-shared-upscale-resolution" value={resolution}
   onChange={event=>setResolution(event.target.value as UpscaleResolution)}>
   <option value="2x">2× HD · Download Starter+</option>
   <option value="4x">4× HD · Download Pro+</option>
   <option value="4k">4K · up to 3840×2160 · Download Pro+</option>
   <option value="8k">8K · up to 7680×4320 · Download Premium/Max</option>
  </select>
  <button type="button" onClick={()=>void upscale()} disabled={working||disabled}>
   {working?'Upscaling…':'✦ Upscale Image — Preview'}
  </button>
  {resultUrl&&<div className="studio-upscale-preview"><img src={resultUrl} alt={'Watermarked low-resolution preview of '+resolution.toUpperCase()+' upscaled artwork'}/></div>}
  {resultReady&&<p className="studio-upscale-result">✓ Upscale complete — {resultSize}. Preview ready.</p>}
  <button type="button" className="studio-hd" disabled={!resultReady||checkingDownload}
   aria-label={'Download Upscaled '+resolution.toUpperCase()+' image'}
   onClick={()=>void download()}>
   {checkingDownload?'Checking subscription…':'↓ Download Upscaled '+resolution.toUpperCase()}
  </button>
  {!resultReady&&<p className="studio-note">Download becomes clickable after successful upscaling.</p>}
  {resultReady&&<p className="studio-note">Full-resolution download requires an active {requiredTier} plan or higher. Click Download to check your subscription and view plans when needed.</p>}
  {planError?<p className="studio-note" role="status">Plan status could not be loaded. Download checks your subscription again.</p>:
   plan!==null?<p className="studio-note">Current plan: <strong>{plan}</strong>. {entitled?'Download will verify your active subscription.':'The '+resolution.toUpperCase()+' download requires '+requiredTier+' or higher.'}</p>:null}
  <p className="studio-message" role="status">{message||'Upload an image, then click Upscale Image. No subscription needed to view a preview.'}</p>
  {showPlans&&<div className="studio-paywall-overlay" role="presentation" onClick={event=>{if(event.target===event.currentTarget)setShowPlans(false)}}>
   <div className="studio-paywall-dialog" role="dialog" aria-modal="true" aria-labelledby="studio-paywall-title">
    <button ref={closePlans} type="button" className="studio-paywall-close" onClick={()=>setShowPlans(false)} aria-label="Close subscription plans">×</button>
    <span className="studio-eyebrow">YOUR UPSCALE IS READY</span>
    <h2 id="studio-paywall-title">Subscribe to download {resolution.toUpperCase()}</h2>
    <p>You've already created the preview. Choose an eligible plan to unlock the full-resolution {resultSize} file. No download happens before a verified active subscription.</p>
    <div className="studio-paywall-grid">
     {plans.map(item=><div className={'studio-paywall-plan '+(item.name===requiredTier?'studio-paywall-recommended':'')} key={item.name}>
      <strong>{item.name}</strong><span>{item.quality}</span>
      <small>{item.description}</small>
      {canUpscale(item.name,resolution)?<Link href="/pricing" target="_blank" rel="noopener noreferrer"
       aria-label={'View '+item.name+' subscription pricing in a new tab'}>View {item.name} Plan</Link>:
       <small className="studio-paywall-ineligible">Not eligible for {resolution.toUpperCase()} download</small>}
     </div>)}
    </div>
    <p className="studio-note">Pricing opens in a new tab so your preview remains here. Keep this tab open. After PayPal subscription activation, return and click Download again. The server will verify your plan.</p>
    <button type="button" className="studio-paywall-retry" onClick={()=>{setShowPlans(false);void download()}}>I've subscribed — check and download</button>
   </div>
  </div>}
 </section>;
}
