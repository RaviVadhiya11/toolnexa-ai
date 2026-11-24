'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {reserveStudioUsage,StudioQuotaNotice} from '@/components/studio-quota';
import {StudioUpscalePanel} from '@/components/studio-upscale-panel';
import {useStudioPremiumDownload} from '@/components/studio-premium-download';
import {StudioUploadPreview} from '@/components/studio-upload-preview';
import ImageTracer from 'imagetracerjs';

type TraceColors=2|4|8|16|24|32|48;
type TraceDetail='simple'|'balanced'|'detailed';
const accepted=new Set(['image/png','image/jpeg','image/webp']);
const MAX_FILE=10*1024*1024;
const MAX_TRACE_SIDE=640;
function save(blob:Blob,name:string){
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download=name;
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),15000);
}
function canvasBlob(canvas:HTMLCanvasElement):Promise<Blob>{
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG export failed')),'image/png'));
}
function encodeBytes(bytes:Uint8ClampedArray){
 let raw='';
 for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(raw);
}
async function loadImage(file:File):Promise<HTMLImageElement>{
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();
  await new Promise<void>((resolve,reject)=>{
   image.onload=()=>resolve();image.onerror=()=>reject(Error('Unable to open this image'));
   image.src=url;
  });
  return image;
 }finally{URL.revokeObjectURL(url)}
}
function traceSvg(image:HTMLImageElement,colors:TraceColors,detail:TraceDetail,removeWhite:boolean,quality:number,smoothness:number){
 const scale=Math.min(1,Math.min(900,Math.max(320,quality))/Math.max(image.naturalWidth,image.naturalHeight));
 const w=Math.max(1,Math.round(image.naturalWidth*scale));
 const h=Math.max(1,Math.round(image.naturalHeight*scale));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const context=canvas.getContext('2d',{willReadFrequently:true});
 if(!context)throw Error('Browser cannot trace this image');
 // Blend transparent pixels against white when the output should have a clean white background.
 if(!removeWhite){context.fillStyle='#fff';context.fillRect(0,0,w,h)}
 context.drawImage(image,0,0,w,h);
 const pixels=context.getImageData(0,0,w,h);
 if(removeWhite){
  // Small near-white regions become transparent. This is color removal, not AI segmentation.
  for(let i=0;i<pixels.data.length;i+=4){
   const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
   if(r>245&&g>245&&b>245)pixels.data[i+3]=0;
  }
 }
 const settings=detail==='simple'?{pathomit:12,ltres:2,qtres:2,blurradius:1}:
  detail==='detailed'?{pathomit:2,ltres:.55,qtres:.55,blurradius:0}:
  {pathomit:6,ltres:1,qtres:1,blurradius:0};
 const traced=ImageTracer.imagedataToSVG(pixels,{
  ...settings,ltres:settings.ltres+(smoothness/100)*1.2,qtres:settings.qtres+(smoothness/100)*1.1,
  numberofcolors:colors,colorsampling:2,colorquantcycles:3,
  strokewidth:0,viewbox:true,scale:1,roundcoords:2,desc:false
 });
 const xml=traced.replace(/^<svg\s/, '<svg width="'+w+'" height="'+h+'" ');
 if(!xml.startsWith('<svg')||xml.includes('<image')||xml.includes('<foreignObject')||!xml.includes('<path'))
  throw Error('Tracing did not produce editable vector paths. Try a clearer image.');
 if(xml.length>5500000)throw Error('Too many vector paths. Try fewer colors or Simple detail.');
 const pathCount=(xml.match(/<path\b/g)||[]).length;
 return {xml,pathCount,w,h};
}
async function renderSvg(xml:string,size=640){
 const url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml'}));
 try{
  const image=new Image();
  await new Promise<void>((resolve,reject)=>{
   image.onload=()=>resolve();image.onerror=()=>reject(Error('Cannot render traced SVG'));
   image.src=url;
  });
  const ratio=Math.min(1,size/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));
  canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
  const context=canvas.getContext('2d',{willReadFrequently:true});
  if(!context)throw Error('PNG rendering is not supported here');
  context.drawImage(image,0,0,canvas.width,canvas.height);
  return canvas;
 }finally{URL.revokeObjectURL(url)}
}
export function ImageToVector(){
 const fileRef=useRef<File|null>(null);
 const [originalUrl,setOriginalUrl]=useState('');
 const [svgUrl,setSvgUrl]=useState('');
 const [svg,setSvg]=useState('');
 const [fileName,setFileName]=useState('');
 const [colors,setColors]=useState<TraceColors>(8);
 const [quality,setQuality]=useState(640);
 const [smoothness,setSmoothness]=useState(35);
 const [tracePreset,setTracePreset]=useState<'logo'|'illustration'|'poster'|'photo'>('illustration');
 const [detail,setDetail]=useState<TraceDetail>('balanced');
 const [removeWhite,setRemoveWhite]=useState(false);
 const [paths,setPaths]=useState(0);
 const [sourceSize,setSourceSize]=useState('');
 const [working,setWorking]=useState(false);
 const [status,setStatus]=useState('Upload an image, then select Trace to Vector.');
 const [plan,setPlan]=useState('Checking');
 const [scale,setScale]=useState<2|4>(2);
 const premium=useStudioPremiumDownload('Pro HD vector PNG export');
 function chooseTracePreset(value:'logo'|'illustration'|'poster'|'photo'){
  setTracePreset(value);
  const presets={
   logo:{colors:4,detail:'simple',smoothness:78,removeWhite:true,quality:640},
   illustration:{colors:8,detail:'balanced',smoothness:35,removeWhite:false,quality:640},
   poster:{colors:16,detail:'detailed',smoothness:55,removeWhite:false,quality:900},
   photo:{colors:48,detail:'detailed',smoothness:20,removeWhite:false,quality:900}
  } as const;
  const p=presets[value];setColors(p.colors);setDetail(p.detail);setSmoothness(p.smoothness);
  setRemoveWhite(p.removeWhite);setQuality(p.quality);
  setStatus(value+' trace preset selected. Click Trace Image to generate editable SVG paths.');
 }
 useEffect(()=>{
  let active=true;
  const refresh=()=>void fetch('/api/usage/quota',{cache:'no-store'}).then(r=>r.json())
   .then(json=>{if(active)setPlan(typeof json.plan==='string'?json.plan:'Unavailable')})
   .catch(()=>{if(active)setPlan('Unavailable')});
  refresh();window.addEventListener('focus',refresh);
  window.addEventListener('toolnexa-subscription-changed',refresh);
  return()=>{active=false;window.removeEventListener('focus',refresh);window.removeEventListener('toolnexa-subscription-changed',refresh)};
 },[]);
 useEffect(()=>()=>{if(originalUrl)URL.revokeObjectURL(originalUrl)},[originalUrl]);
 useEffect(()=>()=>{if(svgUrl)URL.revokeObjectURL(svgUrl)},[svgUrl]);
 const resetTrace=()=>{setSvg('');setSvgUrl('');setPaths(0);setSourceSize('')};
 function selectFile(file:File|undefined){
  if(!file)return;
  if(!accepted.has(file.type)){setStatus('Please choose a JPG, PNG or WebP image.');return}
  if(file.size>MAX_FILE){setStatus('Maximum image size is 10 MB.');return}
  fileRef.current=file;setFileName(file.name);
  setOriginalUrl(URL.createObjectURL(file));resetTrace();
  setStatus('Image uploaded. Choose colors and click Trace Image to Vector.');
 }
 async function trace(){
  if(!fileRef.current){setStatus('Upload your image first.');return}
  setWorking(true);resetTrace();setStatus('Tracing actual editable vector paths…');
  try{
   // Paint status before potentially CPU-heavy tracing begins.
   await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   const image=await loadImage(fileRef.current);
   if(image.naturalWidth*image.naturalHeight>45000000)throw Error('This photo is too large (45 MP limit). Please resize it first.');
   await reserveStudioUsage('studio-image-to-vector');
   const result=traceSvg(image,colors,detail,removeWhite,quality,smoothness);
   const url=URL.createObjectURL(new Blob([result.xml],{type:'image/svg+xml;charset=utf-8'}));
   setSvg(result.xml);setSvgUrl(url);setPaths(result.pathCount);
   setSourceSize(result.w+' × '+result.h);
   setStatus('Converted successfully: '+result.pathCount+' editable SVG paths.');
  }catch(e){setStatus(e instanceof Error?e.message:'Image tracing failed')}
  finally{setWorking(false)}
 }
 async function downloadPng(){
  if(!svg)return;
  setWorking(true);
  try{
   const canvas=await renderSvg(svg);
   save(await canvasBlob(canvas),'toolnexa-vector-standard.png');
   setStatus('Standard PNG downloaded. The SVG remains your real vector file.');
  }catch(e){setStatus(e instanceof Error?e.message:'Could not render PNG')}
  finally{setWorking(false)}
 }
 async function downloadHd(){
  await premium.run(async()=>{
  if(!svg){setStatus('Trace an image before downloading the HD file.');return}
  setWorking(true);setStatus('Preparing protected HD download…');
  try{
   const canvas=await renderSvg(svg,640);
   const context=canvas.getContext('2d',{willReadFrequently:true});
   if(!context)throw Error('Unable to read canvas pixels');
   const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
   const response=await fetch('/api/studio/hd-export',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({width:canvas.width,height:canvas.height,
     pixels:encodeBytes(pixels),scale,kind:'vector'})
   });
   if(!response.ok){
    const body=await response.json().catch(()=>({error:'HD export failed'})) as {error?:string};
    throw Error(body.error||'HD export failed');
   }
   save(await response.blob(),'toolnexa-traced-vector-hd.png');
   setStatus('Pro HD PNG downloaded at '+(canvas.width*scale)+' × '+(canvas.height*scale)+' px.');
  }catch(e){setStatus(e instanceof Error?e.message:'HD export failed')}
  finally{setWorking(false)}
  });
 }
 return <section className="vectorize-workspace" aria-label="Upload image and convert to vector">
  <div className="vectorize-header">
   <span className="studio-eyebrow">IMAGE → EDITABLE VECTOR</span>
   <h1>Upload Any Image. Create a Real Vector.</h1>
   <p>Turn your PNG, JPG or WebP into editable SVG shapes and paths. No raster image is embedded in the result.</p>
  </div>
  <div className="vectorize-grid">
   <div className="studio-panel vectorize-settings">
    <h2>1. Upload Image</h2>
    <StudioUploadPreview id="vectorize-upload" accept="image/png,image/jpeg,image/webp"
      name={fileName} sourceUrl={originalUrl} outputUrl={svgUrl}
      onFile={selectFile} beforeLabel="Original raster" afterLabel="Real traced SVG"
      hint="PNG / JPG / WebP · max 10 MB" busy={working} onReset={resetTrace}/>
    {fileName&&<p className="vectorize-file">Selected: {fileName}</p>}
    <h2>2. Trace Settings</h2>
    <p className="studio-note">Choose your artwork type. Studio presets configure path density, palette and smoothing.</p>
    <div className="studio-premium-presets">
     {(['logo','illustration','poster','photo'] as const).map(value=><button key={value}
       type="button" className={tracePreset===value?'active':''} aria-pressed={tracePreset===value}
       onClick={()=>chooseTracePreset(value)}>{value==='photo'?'Photo Art':value[0].toUpperCase()+value.slice(1)}</button>)}
    </div>
    <label htmlFor="vector-colors">Vector color palette</label>
    <select id="vector-colors" value={colors} onChange={e=>setColors(Number(e.target.value) as TraceColors)}>
     <option value="2">2 colors (black &amp; white style)</option>
     <option value="4">4 colors</option><option value="8">8 colors</option>
     <option value="16">16 colors</option><option value="24">24 colors</option><option value="32">32 colors</option><option value="48">48 colors</option>
    </select>
    <label htmlFor="vector-detail">Path detail</label>
    <select id="vector-detail" value={detail} onChange={e=>setDetail(e.target.value as TraceDetail)}>
     <option value="simple">Simple · cleaner icons</option>
     <option value="balanced">Balanced · recommended</option>
     <option value="detailed">Detailed · more paths</option>
    </select>
    <label htmlFor="vector-quality">Tracing detail resolution</label>
    <select id="vector-quality" value={quality} onChange={event=>setQuality(+event.target.value)}>
     <option value={400}>Fast · 400 px</option><option value={640}>Balanced · 640 px</option>
     <option value={900}>High-detail · 900 px</option>
    </select>
    <label htmlFor="vector-smoothness">Path smoothness {smoothness}%</label>
    <input id="vector-smoothness" type="range" min="0" max="100" value={smoothness}
     onChange={event=>setSmoothness(+event.target.value)}/>
    <label className="vectorize-check"><input type="checkbox" checked={removeWhite}
     onChange={e=>setRemoveWhite(e.target.checked)}/> Remove near-white background</label>
    <button type="button" className="vectorize-action" disabled={!fileName||working}
      onClick={()=>void trace()}>{working?'Processing…':'✦ Trace Image to Vector'}</button>
    <p className="studio-note">Tracing uses color quantization and curve fitting in your browser. Results are best for logos, illustrations, icons and flat-color art; detailed photos become stylized vector artwork.</p>
   </div>
   <div className="studio-panel vectorize-results">
    <div className="studio-work-top"><strong>3. Before / After</strong><span>{paths?paths+' vector paths':'Ready for tracing'}</span></div>
    <div className="vectorize-before-after">
     <div className="vectorize-preview"><strong>Original Image</strong>
      <div className="vectorize-art">{originalUrl?<img src={originalUrl} alt="Original uploaded raster image"/>:<p>Upload JPG / PNG / WebP</p>}</div>
     </div>
     <div className="vectorize-preview"><strong>Traced Vector</strong>
      <div className="vectorize-art">{svgUrl?<img src={svgUrl} alt="Traced SVG containing real editable paths"/>:<p>Vector SVG preview appears here</p>}</div>
     </div>
    </div>
    <p role="status" className="studio-message">{status}</p>
    {paths>0&&<p className="studio-note">Traced geometry: {sourceSize} · {paths} paths. Open the SVG in Illustrator, Inkscape or other compatible editors to edit paths and colors.</p>}
   </div>
   <div className="studio-panel vectorize-downloads">
    <h2>4. Download Vector</h2><StudioQuotaNotice/>
    <div className="studio-plan"><span>FREE</span><strong>Real SVG Vector</strong>
     <p>Scale without pixelation; contains editable geometric SVG paths.</p></div>
    <button type="button" disabled={!svg||working} onClick={()=>save(
      new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),
      'toolnexa-'+(fileName.replace(/\.[^.]+$/,'').replace(/[^a-z0-9_-]/gi,'-').slice(0,45)||'image')+'-vector.svg')}>
      Download SVG Vector
    </button>
    <button type="button" className="studio-secondary" disabled={!svg||working} onClick={()=>void downloadPng()}>Download Standard PNG</button>
    <div className="studio-plan studio-pro"><span>PRO / PREMIUM / MAX</span>
     <strong>HD PNG Export</strong><p>2× / 4× PNG generated by a protected server, using your verified subscription.</p></div>
    <label htmlFor="vector-hd-scale">HD resolution</label>
    <select id="vector-hd-scale" value={scale} onChange={e=>setScale(Number(e.target.value) as 2|4)}>
     <option value="2">2× high resolution</option><option value="4">4× high resolution</option>
    </select>
    <button type="button" className="studio-hd studio-premium-download" disabled={working||premium.checking}
      onClick={()=>void downloadHd()}>{premium.checking?'Checking subscription…':'🔒 Download Pro HD PNG · Unlock'}</button>
    {premium.error&&<p className="studio-note" role="status">{premium.error}</p>}
    {premium.modal}
    <StudioUpscalePanel getCanvas={()=>renderSvg(svg)} format="vector" disabled={!svg} sourceKey={svg} usageSlug="studio-image-to-vector"/>
    <p className="studio-note">SVG is genuine vector at any zoom. Native AI / CDR / EPS / DXF / WMF / EMF export is not yet implemented; compatible editors can import SVG.</p>
   </div>
  </div>
 </section>;
}
