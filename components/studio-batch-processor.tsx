'use client';
import {useEffect,useMemo,useState,type ChangeEvent, type DragEvent} from 'react';
import Link from 'next/link';
import {StudioQuotaNotice,reserveStudioUsage,currentStudioQuota} from '@/components/studio-quota';
import {PremiumPlanModal} from '@/components/premium-plan-modal';
import {upscaleDimensions,type UpscaleResolution,type UpscalePlan} from '@/lib/studio-upscale';
import {imageBlob,downloadFile} from '@/lib/studio-suite-client';
import {packageImagesAsZip} from '@/lib/studio-batch-zip';
import {UploadCloud,Files,Image as ImageIcon,Download,ShieldCheck,Lock,Trash2} from 'lucide-react';

type Format='image/jpeg'|'image/png'|'image/webp';
const mimeExt:Record<Format,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
const accepted=['image/png','image/jpeg','image/webp'];
const MAX_FILES=8,MAX_BYTES=10*1024*1024;
export function StudioBatchProcessor(){
 const [files,setFiles]=useState<File[]>([]);
 const [urls,setUrls]=useState<string[]>([]);
 const [resolution,setResolution]=useState<UpscaleResolution>('4k');
 const [format,setFormat]=useState<Format>('image/webp');
 const [quality,setQuality]=useState(90);
 const [preset,setPreset]=useState<'natural'|'product'|'restore'>('natural');
 const [busy,setBusy]=useState(false);
 const [progress,setProgress]=useState(0);
 const [stage,setStage]=useState('Upload multiple images to prepare your queue.');
 const [plansOpen,setPlansOpen]=useState(false);
 const [plan,setPlan]=useState<UpscalePlan>('Free');
 const [drag,setDrag]=useState(false);
 useEffect(()=>{
  let active=true;
  void currentStudioQuota().then(q=>{if(active)setPlan(q.plan)}).catch(()=>{});
  return()=>{active=false};
 },[]);
 useEffect(()=>{
  const list=files.map(file=>URL.createObjectURL(file));setUrls(list);
  return()=>list.forEach(URL.revokeObjectURL);
 },[files]);
 const total=useMemo(()=>files.reduce((n,f)=>n+f.size,0),[files]);
 function add(input:FileList|File[]){
  const next=Array.from(input);
  const invalid=next.find(f=>!accepted.includes(f.type)||f.size>MAX_BYTES||f.size===0);
  if(invalid){setStage('Use valid JPG, PNG or WebP images, each 10 MB or smaller.');return}
  const existing=new Set(files.map(f=>f.name+':'+f.size+':'+f.lastModified));
  const unique=next.filter(f=>!existing.has(f.name+':'+f.size+':'+f.lastModified));
  if(files.length+unique.length>MAX_FILES){setStage('Select a maximum of 8 images per ZIP export.');return}
  setFiles(prev=>[...prev,...unique]);setStage('Queue ready. Premium or Max subscription required to start full-resolution batch export.');
 }
 function input(e:ChangeEvent<HTMLInputElement>){if(e.target.files)add(e.target.files);e.target.value=''}
 function drop(e:DragEvent<HTMLElement>){e.preventDefault();setDrag(false);if(e.dataTransfer.files.length)add(e.dataTransfer.files)}
 async function image(file:File):Promise<{source:CanvasImageSource;close:()=>void;width:number;height:number}>{
  if(typeof createImageBitmap==='function'){
   const bitmap=await createImageBitmap(file);
   return {source:bitmap,width:bitmap.width,height:bitmap.height,close:()=>bitmap.close()};
  }
  const url=URL.createObjectURL(file);
  try{
   const img=new Image();
   await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(Error('Unable to read '+file.name));img.src=url});
   return {source:img,width:img.naturalWidth,height:img.naturalHeight,close:()=>URL.revokeObjectURL(url)};
  }catch(err){URL.revokeObjectURL(url);throw err}
 }
 async function start(){
  if(busy)return;
  if(!files.length){setStage('Choose at least one image first.');return}
  setBusy(true);setProgress(0);setStage('Checking your active PayPal Premium/Max subscription…');
  try{
   // Batch exports are Premium/Max only; reuse the verified 8K entitlement,
   // even when the member chooses a smaller batch output size.
   const res=await fetch('/api/studio/upscale-authorize',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({resolution:'8k',purpose:'download'})
   });
   const data=await res.json().catch(()=>({error:'Subscription verification unavailable'})) as {error?:string;authorized?:boolean;plan?:UpscalePlan};
   if(res.status===401||res.status===403){
    setPlansOpen(true);setStage('Batch ZIP exports require an active Premium or Max plan. Choose your plan in the popup.');return;
   }
   if(!res.ok||data.authorized!==true)throw Error(data.error||'Subscription could not be verified.');
   if(data.plan)setPlan(data.plan);
   setPlansOpen(false);
   const produced:{name:string;blob:Blob}[]=[];
   for(let i=0;i<files.length;i++){
    const file=files[i];
    setStage('Processing image '+(i+1)+' of '+files.length+': '+file.name);
    // Every image charges one shared daily tool use, including paid accounts.
    await reserveStudioUsage('studio-enhance');
    const img=await image(file);
    try{
     const {width,height}=upscaleDimensions(img.width,img.height,resolution);
     const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
     const ctx=canvas.getContext('2d',{alpha:format!=='image/jpeg'});
     if(!ctx)throw Error('This device cannot render '+resolution.toUpperCase()+' images. Try a smaller size.');
     ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
     if(format==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height)}
     ctx.filter=preset==='product'?'contrast(1.12) saturate(1.12)':
      preset==='restore'?'contrast(1.09) saturate(1.07) brightness(1.04)':'none';
     ctx.drawImage(img.source,0,0,width,height);ctx.filter='none';
     const blob=await imageBlob(canvas,format,quality/100);
     canvas.width=0;canvas.height=0;
     if(blob.type!==format)throw Error('Selected format is not supported by this browser. Try PNG or JPG.');
     const base=file.name.replace(/\.[^.]+$/,'').replace(/[^\w-]+/g,'-').slice(0,60)||'image';
     produced.push({name:base+'-'+resolution+'.'+mimeExt[format],blob});
     setProgress(Math.round((i+1)/files.length*100));
    }finally{img.close()}
   }
   setStage('Building local ZIP archive…');
   const zip=await packageImagesAsZip(produced);
   if(zip.size>260*1024*1024)throw Error('Batch ZIP exceeds 260 MB. Select fewer images.');
   if(!await downloadFile(zip,'toolnexa-batch-'+resolution+'.zip'))return;
   setStage('✓ '+produced.length+' processed images exported in one ZIP. All images stayed in your browser.');
  }catch(err){setStage(err instanceof Error?err.message:'Batch export failed.')}
  finally{setBusy(false)}
 }
 return <div className="studio-batch-page">
  <header className="studio-head"><div><span className="studio-eyebrow">TOOLNEXA · FLAGSHIP PRO+ ENGINE</span>
   <h1>Batch Image Enhancer &amp; ZIP Export</h1>
   <p>Process up to eight images in sequence, choose real output format and resolution, and export one ZIP archive. Premium or Max membership is required; each image uses a daily tool run.</p>
  </div><Link href="/pricing" className="button outline"><Lock size={17}/> View Premium Plans</Link></header>
  <div className="studio-batch-grid">
   <section className="studio-panel studio-batch-queue">
    <h2><Files size={20}/> Your image queue</h2>
    <label className={'studio-batch-drop '+(drag?'dragging':'')} onDragOver={e=>{e.preventDefault();setDrag(true)}}
     onDragLeave={e=>{e.preventDefault();setDrag(false)}} onDrop={drop}>
     <UploadCloud size={34}/><strong>Drop up to 8 JPG, PNG or WebP images</strong>
     <span>Or tap to select files · Up to 10 MB each</span>
     <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={input} disabled={busy}/>
    </label>
    {files.length>0&&<div className="studio-batch-list">
     {files.map((file,i)=><div className="studio-batch-item" key={file.name+file.lastModified}>
      {urls[i]?<img src={urls[i]} alt={'Original '+file.name}/>:<ImageIcon size={28}/>}
      <div><strong>{file.name}</strong><small>{(file.size/1024/1024).toFixed(2)} MB</small></div>
      <button type="button" disabled={busy} aria-label={'Remove '+file.name} onClick={()=>setFiles(prev=>prev.filter((_,n)=>n!==i))}><Trash2 size={16}/></button>
     </div>)}
    </div>}
    <p className="studio-note">{files.length}/{MAX_FILES} images · {(total/1024/1024).toFixed(1)} MB of sources selected</p>
   </section>
   <aside className="studio-panel studio-batch-options">
    <h2>Batch Inspector &amp; Export</h2>
    <StudioQuotaNotice/>
    <span className="studio-demo-field-label">Output Resolution</span>
    <div className="studio-v4-scale-grid">
     {(['2x','4x','4k','8k'] as const).map(value=><button key={value} type="button"
      className={'studio-v4-scale-card '+(resolution===value?'selected':'')}
      aria-pressed={resolution===value} onClick={()=>setResolution(value)}
      disabled={busy}><strong>{value.toUpperCase()}</strong><small>{value==='8k'?'Large output':'Premium batch'}</small></button>)}
    </div>
    <label htmlFor="batch-preset">Enhancement preset</label><select id="batch-preset" value={preset}
     onChange={e=>setPreset(e.target.value as typeof preset)} disabled={busy}>
     <option value="natural">Natural / no filter</option><option value="product">Product Crisp · local filters</option>
     <option value="restore">Photo Refresh · local filters</option>
    </select>
    <label htmlFor="batch-format">Output format</label><select id="batch-format" value={format}
     onChange={e=>setFormat(e.target.value as Format)} disabled={busy}>
     <option value="image/webp">WebP</option><option value="image/png">PNG</option><option value="image/jpeg">JPG</option>
    </select>
    {format!=='image/png'&&<label htmlFor="batch-quality">Export quality · {quality}%
     <input id="batch-quality" type="range" min={60} max={100} step={5} value={quality}
      onChange={e=>setQuality(Number(e.target.value))} disabled={busy}/>
    </label>}
    <div className="studio-batch-progress" aria-live="polite"><span style={{width:progress+'%'}}/></div>
    <p className="studio-message" role="status">{stage}</p>
    <button className="studio-v4-enhance-cta" disabled={busy||!files.length} type="button" onClick={()=>void start()}>
     <Download size={18}/> {busy?'Processing batch…':'Verify Premium & Download ZIP'}
    </button>
    <p className="studio-note"><ShieldCheck size={15}/> Verified PayPal membership; files never leave the browser. This batch engine uses local canvas filters and enlargement, not a cloud GPU. Large exports may fail on low-memory phones.</p>
   </aside>
  </div>
  <PremiumPlanModal open={plansOpen} onClose={()=>setPlansOpen(false)} currentPlan={plan}
   feature="Batch image ZIP export" requiredTier="Premium" onRetry={()=>void start()} busy={busy}/>
 </div>;
}
