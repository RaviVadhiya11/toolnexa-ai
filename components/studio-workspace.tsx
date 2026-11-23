'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {reserveStudioUsage,StudioQuotaNotice} from '@/components/studio-quota';
import {StudioUpscalePanel} from '@/components/studio-upscale-panel';

type Mode='vector'|'image';
type Design='diamond'|'flower'|'orbit';
const validColor=(color:string)=>/^#[a-f0-9]{6}$/i.test(color)?color:'#2563eb';

function art(design:Design,primary:string,accent:string){
 const blue=validColor(primary),cyan=validColor(accent);
 const back='<rect width="800" height="800" fill="#fff"/>';
 let shape='';
 if(design==='diamond'){
  shape='<circle r="238" fill="#eaf2ff"/><path d="M0 -220 L205 100 L0 218 L-205 100 Z" fill="'+blue+'"/>'+
   '<path d="M0 -150 L135 85 L0 163 L-135 85 Z" fill="#fff"/>'+
   '<path d="M0 -86 L77 48 L0 93 L-77 48 Z" fill="'+cyan+'"/><circle cy="-188" r="27" fill="'+cyan+'"/>';
 }else if(design==='flower'){
  shape='<circle r="236" fill="#eaf2ff"/>';
  for(let n=0;n<8;n++)shape+='<ellipse cx="0" cy="-114" rx="57" ry="130" transform="rotate('+(n*45)+')" fill="'+(n%2===0?blue:cyan)+'" opacity=".94"/>';
  shape+='<circle r="60" fill="#fff"/><circle r="35" fill="'+blue+'"/>';
 }else{
  shape='<circle r="218" stroke="'+blue+'" stroke-width="28" fill="#f1f8ff"/>'+
   '<circle r="158" stroke="'+cyan+'" stroke-width="45" fill="none"/>'+
   '<path d="M-45 -140 L115 0 L-45 140 L-120 77 L-45 0 L-120 -77 Z" fill="'+blue+'"/>'+
   '<circle cx="183" cy="-176" r="39" fill="'+cyan+'"/>';
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">'+
  back+'<g transform="translate(400 400)">'+shape+'</g></svg>';
}
function saveBlob(blob:Blob,name:string){
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),20000);
}
async function rasterSvg(xml:string,limit:number){
 const url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml;charset=utf-8'}));
 try{
  const image=new Image();
  await new Promise<void>((resolve,reject)=>{
   image.onload=()=>resolve();image.onerror=()=>reject(Error('Unable to render the vector'));
   image.src=url;
  });
  const canvas=document.createElement('canvas');canvas.width=limit;canvas.height=limit;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  if(!context)throw Error('This browser cannot export canvas images');
  context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
  context.drawImage(image,0,0,limit,limit);
  return canvas;
 }finally{URL.revokeObjectURL(url)}
}
function canvasBlob(canvas:HTMLCanvasElement){
 return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>
  blob?resolve(blob):reject(Error('Unable to encode this image')),'image/png'));
}
function base64(bytes:Uint8ClampedArray){
 let text='';
 for(let i=0;i<bytes.length;i+=8192)
  text+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(text);
}
export function StudioWorkspace({mode}:{mode:Mode}){
 const imageRef=useRef<HTMLImageElement|null>(null);
 const [fileUrl,setFileUrl]=useState('');
 const [fileName,setFileName]=useState('');
 const [design,setDesign]=useState<Design>('diamond');
 const [primary,setPrimary]=useState('#2563eb');
 const [accent,setAccent]=useState('#06b6d4');
 const [brightness,setBrightness]=useState(100);
 const [contrast,setContrast]=useState(110);
 const [saturation,setSaturation]=useState(110);
 const [scale,setScale]=useState<2|4>(2);
 const [plan,setPlan]=useState('Checking');
 const [working,setWorking]=useState(false);
 const [message,setMessage]=useState('');
 const svg=art(design,primary,accent);
 useEffect(()=>{
  let active=true;
  const refresh=()=>void fetch('/api/usage/quota',{cache:'no-store'})
   .then(response=>response.json())
   .then(result=>{if(active)setPlan(typeof result.plan==='string'?result.plan:'Unavailable')})
   .catch(()=>{if(active)setPlan('Unavailable')});
  refresh();window.addEventListener('toolnexa-subscription-changed',refresh);
  window.addEventListener('focus',refresh);
  return()=>{active=false;window.removeEventListener('toolnexa-subscription-changed',refresh);window.removeEventListener('focus',refresh)};
 },[]);
 useEffect(()=>{
  if(!fileUrl){imageRef.current=null;return}
  const image=new Image();
  image.onload=()=>{imageRef.current=image;setMessage('Image loaded. Adjust enhancement settings to preview changes.')};
  image.onerror=()=>setMessage('Unable to decode image. Choose another file.');
  image.src=fileUrl;
  return()=>{imageRef.current=null;URL.revokeObjectURL(fileUrl)};
 },[fileUrl]);
 const isPro=['Pro','Premium','Max'].includes(plan);
 const filter='brightness('+brightness+'%) contrast('+contrast+'%) saturate('+saturation+'%)';
 async function makeCanvas(){
  if(mode==='vector')return rasterSvg(svg,800);
  const image=imageRef.current;
  if(!image||!image.naturalWidth||!image.naturalHeight)throw Error('Upload an image first');
  const ratio=Math.min(1,800/Math.max(image.naturalWidth,image.naturalHeight));
  const width=Math.max(1,Math.round(image.naturalWidth*ratio));
  const height=Math.max(1,Math.round(image.naturalHeight*ratio));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  if(!context)throw Error('Canvas export is unavailable');
  context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
  context.filter=filter;context.drawImage(image,0,0,width,height);
  return canvas;
 }
 async function downloadSvg(){
  try{await reserveStudioUsage('studio-vector');saveBlob(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),'toolnexa-real-vector.svg');setMessage('SVG vector downloaded.')}
  catch(err){setMessage(err instanceof Error?err.message:'Daily limit reached')}
 }
 async function standard(){
  setWorking(true);setMessage('');
  try{const canvas=await makeCanvas();
   await reserveStudioUsage(mode==='vector'?'studio-vector':'studio-enhance');
   saveBlob(await canvasBlob(canvas),mode==='vector'?'toolnexa-vector-standard.png':'toolnexa-image-standard.png');
   setMessage('Standard-resolution PNG downloaded.');
  }catch(err){setMessage(err instanceof Error?err.message:'Unable to export image')}
  finally{setWorking(false)}
 }
 async function hd(){
  if(!isPro){setMessage('Upgrade to Pro, Premium or Max to unlock HD exports.');return}
  setWorking(true);setMessage('');
  try{
   const canvas=await makeCanvas(),ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)throw Error('Cannot access image pixels');
   const bytes=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   const response=await fetch('/api/studio/hd-export',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({width:canvas.width,height:canvas.height,scale,kind:mode==='image'?'image':'vector',pixels:base64(bytes)})
   });
   if(!response.ok){
    const result=await response.json().catch(()=>({error:'HD download is unavailable'}));
    throw Error(typeof result.error==='string'?result.error:'HD download failed');
   }
   saveBlob(await response.blob(),mode==='vector'?'toolnexa-vector-hd.png':'toolnexa-enhanced-hd.jpg');
   setMessage('Server-verified Pro HD file downloaded at '+(canvas.width*scale)+' × '+(canvas.height*scale)+' px.');
  }catch(err){setMessage(err instanceof Error?err.message:'Unable to download HD file')}
  finally{setWorking(false)}
 }
 return <div className="studio-shell">
  <header className="studio-head">
   <div><span className="studio-eyebrow">TOOLNEXA AI · DESIGN WORKSPACE</span>
    <h1>{mode==='vector'?'Real Vector Studio':'Image Enhancer & HD Upscaler'}</h1>
    <p>{mode==='vector'?'Edit genuine SVG paths and export scalable artwork.':'Enhance color and contrast locally; export standard or server-gated HD PNG.'}</p></div>
   <div className="studio-top-links"><Link href="/studio/vector">Vector editor</Link><Link href="/studio/enhance">Image enhancer</Link><Link href="/pricing">Plans</Link></div>
  </header>
  <div className="studio-grid">
   <section className="studio-panel studio-controls" aria-label="Editor controls">
    <h2>{mode==='vector'?'Vector design':'Input & adjustments'}</h2>
    {mode==='vector'?<>
     <label htmlFor="studio-shape">Design preset</label>
     <select id="studio-shape" value={design} onChange={event=>setDesign(event.target.value as Design)}>
      <option value="diamond">Geometric logo</option><option value="flower">Flower icon</option><option value="orbit">Orbit badge</option>
     </select>
     <label htmlFor="studio-primary">Primary color</label>
     <input id="studio-primary" type="color" value={primary} onChange={event=>setPrimary(event.target.value)}/>
     <label htmlFor="studio-accent">Accent color</label>
     <input id="studio-accent" type="color" value={accent} onChange={event=>setAccent(event.target.value)}/>
     <button type="button" className="studio-secondary" onClick={()=>void downloadSvg()}>Download SVG — Free</button>
    </>:<>
     <label htmlFor="studio-upload">Choose JPG, PNG or WebP image</label>
     <input id="studio-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>{
      const file=event.target.files?.[0];if(!file)return;
      if(file.size>10*1024*1024){setMessage('Maximum upload size: 10 MB');return}
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)){setMessage('Choose PNG, JPG or WebP');return}
      setFileName(file.name);setFileUrl(URL.createObjectURL(file));
     }}/>
     <small>{fileName||'Processing happens in your browser until you request Pro HD export.'}</small>
     <label htmlFor="studio-brightness">Brightness {brightness}%</label>
     <input id="studio-brightness" type="range" min="60" max="150" value={brightness} onChange={event=>setBrightness(+event.target.value)}/>
     <label htmlFor="studio-contrast">Contrast {contrast}%</label>
     <input id="studio-contrast" type="range" min="60" max="170" value={contrast} onChange={event=>setContrast(+event.target.value)}/>
     <label htmlFor="studio-saturation">Saturation {saturation}%</label>
     <input id="studio-saturation" type="range" min="0" max="200" value={saturation} onChange={event=>setSaturation(+event.target.value)}/>
    </>}
    <p className="studio-info">Current membership: <strong>{plan}</strong>. HD requires a verified Pro, Premium or Max subscription.</p>
   </section>
   <section className="studio-panel studio-work">
    <div className="studio-work-top"><strong>Live preview</strong><span>{mode==='vector'?'800×800 SVG artboard':'Client-side image preview'}</span></div>
    <div className="studio-stage">
     {mode==='vector'?<div className="studio-vector" dangerouslySetInnerHTML={{__html:svg}}/>:
      fileUrl?<img className="studio-image" alt="Local enhancement preview" src={fileUrl} style={{filter}}/>:
      <div className="studio-placeholder"><strong>Upload an image</strong><p>Change brightness, contrast and saturation to see the preview.</p></div>}
    </div>
    <p className="studio-note">{mode==='vector'?'SVG contains real editable paths, not a PNG hidden inside SVG.':'This is traditional image processing, not generative AI detail reconstruction. Upscaling cannot recover detail absent from the source.'}</p>
   </section>
   <section className="studio-panel studio-export">
    <h2>Export</h2><StudioQuotaNotice/>
    <div className="studio-plan"><span>STANDARD</span><strong>Free / Starter</strong><p>Download PNG at normal resolution; SVG export is free for vector designs.</p></div>
    <button type="button" onClick={()=>void standard()} disabled={working||(mode==='image'&&!fileUrl)}>Download Standard PNG</button>
    <div className="studio-plan studio-pro"><span>PRO FEATURE</span><strong>HD / Higher-resolution</strong><p>2× or 4× PNG (vector) or JPEG (images), available to verified Pro, Premium and Max members.</p></div>
    <label htmlFor="studio-scale">HD export size</label>
    <select id="studio-scale" value={scale} onChange={event=>setScale(+event.target.value as 2|4)}>
     <option value="2">2× resolution</option><option value="4">4× resolution</option>
    </select>
    {isPro?<button type="button" className="studio-hd" disabled={working||(mode==='image'&&!fileUrl)} onClick={()=>void hd()}>
      {working?'Processing…':'Download HD File'}</button>:
     <Link className="studio-upgrade" href="/pricing">Unlock HD with Pro →</Link>}
    <p className="studio-note">HD exports are generated by a protected server endpoint. Formats such as AI, EPS, CDR, DXF and WMF/EMF are not enabled here until real converters are integrated and verified.</p>
    <StudioUpscalePanel getCanvas={makeCanvas} format={mode==='vector'?'vector':'photo'} disabled={mode==='image'&&!fileUrl} sourceKey={mode==='vector'?svg:[fileUrl,brightness,contrast,saturation].join(':')}/>
    {message&&<p className="studio-message" role="status">{message}</p>}
   </section>
  </div>
 </div>;
}
