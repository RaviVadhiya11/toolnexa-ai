'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {reserveStudioUsage,StudioQuotaNotice} from '@/components/studio-quota';
import {StudioUpscalePanel} from '@/components/studio-upscale-panel';
import {cleanSVG,exportVector} from '@/lib/studio-vector-convert';
import {downloadFile} from '@/lib/studio-suite-client';
type Mode='convert'|'edit';
type VectorFormat='svg'|'pdf'|'eps'|'dxf';
export function StudioVectorFormats({mode}:{mode:Mode}){
 const [xml,setXml]=useState('');
 const [name,setName]=useState('');
 const [preview,setPreview]=useState('');
 const [fill,setFill]=useState('#2563eb');
 const [stroke,setStroke]=useState('#ffffff');
 const [width,setWidth]=useState(2);
 const [size,setSize]=useState(100);
 const [format,setFormat]=useState<VectorFormat>('svg');
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('Choose a valid SVG with paths or shapes.');
 useEffect(()=>{
  if(!xml){setPreview('');return}
  const url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml'}));setPreview(url);
  return()=>URL.revokeObjectURL(url);
 },[xml]);
 async function upload(file?:File){
  if(!file)return;
  setBusy(true);setStatus('Reading SVG…');
  try{
   if(file.size>2500000||!file.name.toLowerCase().endsWith('.svg'))throw Error('Choose an SVG smaller than 2.5 MB.');
   setXml(cleanSVG(await file.text()));setName(file.name);setStatus('True SVG vector loaded. Select your export format.');
  }catch(e){setStatus(e instanceof Error?e.message:'Unable to read SVG')}
  finally{setBusy(false)}
 }
 function changeFill(){
  if(!xml)return;
  try{
   const doc=new DOMParser().parseFromString(xml,'image/svg+xml');
   const targets=doc.documentElement.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line');
   for(const shape of targets){shape.setAttribute('fill',fill);shape.setAttribute('stroke',stroke);shape.setAttribute('stroke-width',String(width))}
   setXml(cleanSVG(new XMLSerializer().serializeToString(doc.documentElement)));
   setStatus(targets.length+' vector shapes updated.');
  }catch(e){setStatus(e instanceof Error?e.message:'Could not update colors')}
 }
 function addShape(type:'circle'|'rect'){
  try{
   const base=xml||'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"></svg>';
   const doc=new DOMParser().parseFromString(base,'image/svg+xml');
   const root=doc.documentElement;
   const node=doc.createElementNS('http://www.w3.org/2000/svg',type);
   for(const [key,value] of Object.entries(type==='circle'?{cx:'400',cy:'400',r:'130'}:{x:'290',y:'290',width:'220',height:'220',rx:'0'}))node.setAttribute(key,value);
   node.setAttribute('fill',fill);node.setAttribute('stroke',stroke);node.setAttribute('stroke-width',String(width));root.appendChild(node);
   setXml(cleanSVG(new XMLSerializer().serializeToString(root)));setStatus('New editable '+type+' added.');
  }catch(e){setStatus(e instanceof Error?e.message:'Unable to add shape')}
 }
 async function run(){
  if(!xml)return;
  setBusy(true);setStatus('Creating genuine '+format.toUpperCase()+' vector file…');
  try{
   await reserveStudioUsage(mode==='edit'?'studio-svg-editor':'studio-convert');
   if(mode==='edit'){
    const doc=new DOMParser().parseFromString(xml,'image/svg+xml');
    doc.documentElement.setAttribute('width',String(Math.round(800*size/100)));
    doc.documentElement.setAttribute('height',String(Math.round(800*size/100)));
    await exportVector(new XMLSerializer().serializeToString(doc.documentElement),'svg');
   }else await exportVector(xml,format);
   setStatus(format==='dxf'?'DXF outlines downloaded (fills omitted for CAD use).':'Vector file downloaded. No embedded raster image.');
  }catch(e){setStatus(e instanceof Error?e.message:'Conversion failed')}
  finally{setBusy(false)}
 }
 async function previewCanvas(){
  if(!xml)throw Error('Upload an SVG file first');
  const safe=cleanSVG(xml),url=URL.createObjectURL(new Blob([safe],{type:'image/svg+xml'}));
  try{
   const image=new Image();
   await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('SVG cannot be rasterized'));image.src=url});
   const doc=new DOMParser().parseFromString(safe,'image/svg+xml');
   const view=doc.documentElement.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)||[];
   const aspect=view.length===4&&view[2]>0&&view[3]>0?view[2]/view[3]:image.naturalWidth/image.naturalHeight;
   const width=aspect>=1?800:Math.max(1,Math.round(800*aspect));
   const height=aspect>=1?Math.max(1,Math.round(800/aspect)):800;
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
   ctx.drawImage(image,0,0,width,height);return canvas;
  }finally{URL.revokeObjectURL(url)}
 }
 return <section className="suite-workspace">
  <header className="suite-head"><span className="studio-eyebrow">TOOLNEXA · VECTOR WORKSPACE</span>
   <h1>{mode==='edit'?'SVG Vector Editor':'Professional Vector Format Converter'}</h1>
   <p>{mode==='edit'?'Edit SVG colors, strokes and shapes. Export real vector paths.':'Convert clean SVG paths to vector PDF, EPS or DXF. All exports use vector geometry, not screenshots.'}</p>
  </header>
  <div className="suite-editor-grid">
   <div className="studio-panel suite-controls">
    <h2>Upload SVG</h2><label htmlFor="suite-svg-file" className="suite-upload">↑ Choose SVG file</label>
    <input id="suite-svg-file" type="file" accept=".svg,image/svg+xml" onChange={e=>void upload(e.target.files?.[0])}/>
    <p className="studio-note">{name||'Use SVG from Image-to-Vector, Illustrator, Inkscape or CorelDRAW.'}</p>
    {mode==='edit'?<><h2>Design Controls</h2>
     <label>Fill color<input type="color" value={fill} onChange={e=>setFill(e.target.value)}/></label>
     <label>Stroke color<input type="color" value={stroke} onChange={e=>setStroke(e.target.value)}/></label>
     <label>Stroke width {width}px<input type="range" min="0" max="15" value={width} onChange={e=>setWidth(+e.target.value)}/></label>
     <button type="button" disabled={!xml} onClick={changeFill}>Apply to vector shapes</button>
     <div className="suite-pair"><button type="button" onClick={()=>addShape('circle')}>+ Circle</button><button type="button" onClick={()=>addShape('rect')}>+ Rectangle</button></div>
     <label>Output size {size}%<input type="range" min="25" max="200" value={size} onChange={e=>setSize(+e.target.value)}/></label>
    </>:<><h2>Vector File Format</h2><label htmlFor="suite-format">Output format</label>
     <select id="suite-format" value={format} onChange={e=>setFormat(e.target.value as VectorFormat)}>
      <option value="svg">SVG — fully editable</option><option value="pdf">PDF — actual vector paths</option>
      <option value="eps">EPS — PostScript path geometry</option><option value="dxf">DXF — CAD polylines / outlines</option>
     </select>
     <p className="studio-note">EPS and DXF approximate curves with editable line segments. DXF is intended for outline cutting/CAD, not filled-color artwork.</p>
    </>}
    <button type="button" disabled={!xml||busy} onClick={()=>void run()}>{busy?'Processing…':mode==='edit'?'Download Edited SVG':'Export '+format.toUpperCase()}</button>
   </div>
   <div className="studio-panel suite-canvas">
    <div className="studio-work-top"><strong>Vector Preview</strong><span>{mode==='edit'?'Editable shapes':'Original paths retained'}</span></div>
    <div className="suite-artboard">{preview?<img src={preview} alt="Sanitized SVG vector preview"/>:<p>Upload a vector SVG or create a shape to begin.</p>}</div>
    <p role="status" className="studio-message">{status}</p>
   </div>
   <div className="studio-panel suite-advanced">
    <h2>Supported exports</h2><StudioQuotaNotice/><div className="suite-format-row"><strong>SVG</strong><span>Scalable editable paths</span></div>
    <div className="suite-format-row"><strong>PDF</strong><span>Vector page</span></div>
    <div className="suite-format-row"><strong>EPS</strong><span>Illustrator-compatible PostScript</span></div>
    <div className="suite-format-row"><strong>DXF</strong><span>CAD outline polylines</span></div>
    <h2>Advanced formats</h2>
    <p className="studio-note">Native Adobe Illustrator .AI, CorelDRAW .CDR, WMF and EMF require verified proprietary/format-specific converters. These file types are **not** produced here. You can import the genuine SVG or EPS into compatible desktop editors.</p>
    <Link className="studio-upgrade" href="/studio/image-to-vector">Turn PNG/JPG into SVG →</Link>
    <StudioUpscalePanel getCanvas={previewCanvas} format="vector" disabled={!xml}/>
   </div>
  </div>
 </section>
}
