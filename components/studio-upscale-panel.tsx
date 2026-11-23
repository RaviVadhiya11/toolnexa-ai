'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {currentStudioQuota} from '@/components/studio-quota';
import {downloadFile,imageBlob} from '@/lib/studio-suite-client';
import {canUpscale,upscaleDimensions,type UpscalePlan,type UpscaleResolution} from '@/lib/studio-upscale';

export function StudioUpscalePanel({getCanvas,format='photo',disabled=false,sourceKey=''}:{
 getCanvas:()=>Promise<HTMLCanvasElement>;
 format?:'photo'|'cutout'|'vector';
 disabled?:boolean;
 /** Change this whenever the uploaded or processed source image changes. */
 sourceKey?:string;
}){
 const [resolution,setResolution]=useState<UpscaleResolution>('4k');
 const [plan,setPlan]=useState<UpscalePlan|null>(null);
 const [planError,setPlanError]=useState(false);
 const [message,setMessage]=useState('');
 const [working,setWorking]=useState(false);
 const [result,setResult]=useState<Blob|null>(null);
 const [resultUrl,setResultUrl]=useState('');
 const [resultSize,setResultSize]=useState('');
 const [lastFormat,setLastFormat]=useState<'jpg'|'png'>('jpg');
 useEffect(()=>{
  let active=true;
  const refresh=()=>void currentStudioQuota().then(q=>{
    if(active){setPlan(q.plan);setPlanError(false)}
   }).catch(()=>{if(active){setPlan(null);setPlanError(true)}});
  refresh();
  window.addEventListener('focus',refresh);window.addEventListener('toolnexa-subscription-changed',refresh);
  return()=>{active=false;window.removeEventListener('focus',refresh);window.removeEventListener('toolnexa-subscription-changed',refresh)};
 },[]);
 useEffect(()=>()=>{if(resultUrl)URL.revokeObjectURL(resultUrl)},[resultUrl]);
 useEffect(()=>{
  setResult(null);setResultUrl('');setResultSize('');setMessage('');
 },[resolution,sourceKey]);
 const entitled=plan!==null&&canUpscale(plan,resolution);
 const requiredTier=resolution==='8k'?'Premium':resolution==='2x'?'Starter':'Pro';
 const upgradeText='Upgrade to '+requiredTier+' for '+resolution.toUpperCase();
 const resultReady=result!==null&&!working;
 async function upscale(){
  if(working)return;
  setWorking(true);setMessage('Preparing upscale…');setResult(null);setResultUrl('');setResultSize('');
  try{
   if(disabled)throw Error('Upload or process an image first.');
   const quota=await currentStudioQuota();
   setPlan(quota.plan);setPlanError(false);
   if(!canUpscale(quota.plan,resolution))
    throw Error(resolution==='8k'?'8K requires Premium or Max.':
     resolution==='2x'?'2× upscale requires Starter or higher.':'4× and 4K require Pro or higher.');
   const source=await getCanvas();
   const {width,height}=upscaleDimensions(source.width,source.height,resolution);
   setMessage('Verifying paid plan and reserving one daily run…');
   const response=await fetch('/api/studio/upscale-authorize',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resolution})
   });
   const data=await response.json();
   if(!response.ok||data.authorized!==true)throw Error(data.error||'Plan could not be verified.');
   window.dispatchEvent(new Event('toolnexa-usage-changed'));
   setMessage('Upscaling '+source.width+'×'+source.height+' to '+width+'×'+height+' pixels…');
   // Give React time to show progress before the large GPU/canvas operation.
   await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d',{alpha:format!=='photo'});
   if(!ctx)throw Error('This device cannot allocate the requested image resolution. Try 4K.');
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   if(format==='photo'){ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height)}
   ctx.drawImage(source,0,0,width,height);
   const isPng=format!=='photo';
   const blob=await imageBlob(canvas,isPng?'image/png':'image/jpeg',.94);
   const objectUrl=URL.createObjectURL(blob);
   setResult(blob);setResultUrl(objectUrl);setResultSize(width+' × '+height+' px');
   setLastFormat(isPng?'png':'jpg');
   setMessage('Upscale complete. Actual image dimensions: '+width+' × '+height+' px. Download the result below.');
   // Release canvas GPU buffers before keeping the compressed file blob.
   canvas.width=0;canvas.height=0;
  }catch(err){setMessage(err instanceof Error?err.message:'Upscale failed. Try a smaller resolution.')}
  finally{setWorking(false)}
 }
 return <div className="studio-upscale-panel">
  <h2>Upscale Image · HD to 8K</h2>
  <p className="studio-note">Creates a larger image with high-quality interpolation. This is a real pixel-resolution increase, not generative AI detail reconstruction. 8K output needs substantial browser memory.</p>
  <label htmlFor="studio-shared-upscale-resolution">Output resolution</label>
  <select id="studio-shared-upscale-resolution" value={resolution}
   onChange={event=>setResolution(event.target.value as UpscaleResolution)}>
   <option value="2x">2× HD — Starter+</option>
   <option value="4x">4× HD — Pro+</option>
   <option value="4k">4K · up to 3840×2160 — Pro+</option>
   <option value="8k">8K · up to 7680×4320 — Premium/Max</option>
  </select>
  <button type="button" onClick={()=>void upscale()} disabled={working||disabled||!entitled}>
   {working?'Upscaling…':'✦ Upscale Image'}
  </button>
  {resultUrl&&<div className="studio-upscale-preview"><img src={resultUrl} alt={'Upscaled '+resolution.toUpperCase()+' result preview'}/></div>}
  {resultReady&&<p className="studio-upscale-result">✓ Upscale complete — {resultSize}. Your file is ready.</p>}
  <button type="button" className="studio-hd" disabled={!resultReady}
   aria-label={'Download Upscaled '+resolution.toUpperCase()+' image'}
   onClick={()=>{if(result)downloadFile(result,'toolnexa-'+resolution+'-upscaled.'+lastFormat)}}>
   ↓ Download Upscaled {resolution.toUpperCase()}
  </button>
  {!resultReady&&<p className="studio-note">The download button unlocks automatically after the selected upscale finishes successfully.</p>}
  {planError?<p className="studio-upgrade-notice" role="alert">Unable to verify your plan. Refresh or sign in to continue.</p>:
   plan===null?<p className="studio-note">Checking your subscription…</p>:
   !entitled?<div className="studio-upgrade-notice">
    <strong>{resolution.toUpperCase()} is locked on your {plan} plan.</strong>
    <p>{plan==='Free'?'Free accounts get 3 shared daily standard tool runs. ':''}
     {resolution==='4k'?'4K upscaling and downloads require Pro, Premium or Max.':
      resolution==='8k'?'8K requires Premium or Max.':
      resolution==='4x'?'4× upscaling requires Pro or higher.':'2× upscaling requires Starter or higher.'}</p>
    <Link className="studio-upgrade" href="/pricing">{upgradeText} →</Link>
   </div>:<p className="studio-note">Your {plan} plan allows {resolution.toUpperCase()} upscaling.</p>}
  <p className="studio-message" role="status">{message||'Select an image and click Upscale Image to generate a downloadable result.'}</p>}
 </div>;
}
