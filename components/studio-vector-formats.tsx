'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {reserveStudioUsage,StudioQuotaNotice} from '@/components/studio-quota';
import {StudioUpscalePanel} from '@/components/studio-upscale-panel';
import {StudioUploadPreview} from '@/components/studio-upload-preview';
import {withPaidDownload} from '@/lib/download-access';
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
 const [opacity,setOpacity]=useState(100);
 const [history,setHistory]=useState({past:[] as string[],future:[] as string[]});
 const [size,setSize]=useState(100);
 const [format,setFormat]=useState<VectorFormat>('svg');
 const [busy,setBusy]=useState(false);
 const [upscaledPreview,setUpscaledPreview]=useState('');
 const [status,setStatus]=useState('Choose a valid SVG with paths or shapes.');
 const shapeCount=(xml.match(/<(?:path|rect|circle|ellipse|polygon|polyline|line)\b/g)||[]).length;
 function commitSvg(next:string){
  const cleaned=cleanSVG(next);
  if(cleaned===xml)return;
  setHistory(state=>({past:[...state.past,xml].slice(-30),future:[]}));
  setXml(cleaned);
 }
 function travelSvg(direction:'undo'|'redo'){
  const stack=direction==='undo'?history.past:history.future;
  const target=stack[stack.length-1];if(target===undefined)return;
  if(direction==='undo')setHistory(state=>({past:state.past.slice(0,-1),future:[...state.future,xml]}));
  else setHistory(state=>({past:[...state.past,xml],future:state.future.slice(0,-1)}));
  setXml(target);setStatus(direction==='undo'?'Undo complete.':'Redo complete.');
 }
 function transformShapes(flip:'horizontal'|'vertical'){
  if(!xml)return;
  try{
   const doc=new DOMParser().parseFromString(xml,'image/svg+xml');
   const root=doc.documentElement,vb=root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
   const w=vb&&vb.length===4?vb[2]:Number.parseFloat(root.getAttribute('width')||'800');
   const h=vb&&vb.length===4?vb[3]:Number.parseFloat(root.getAttribute('height')||'800');
   if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)throw Error('Unsupported vector dimensions');
   const x=vb&&vb.length===4?vb[0]:0,y=vb&&vb.length===4?vb[1]:0;
   const group=doc.createElementNS('http://www.w3.org/2000/svg','g');
   group.setAttribute('transform',flip==='horizontal'?'translate('+(2*x+w)+' 0) scale(-1 1)':'translate(0 '+(2*y+h)+') scale(1 -1)');
   while(root.firstChild)group.appendChild(root.firstChild);
   root.appendChild(group);
   commitSvg(new XMLSerializer().serializeToString(root));
   setStatus('Artwork flipped '+flip+'. Use Undo to reverse it.');
  }catch(e){setStatus(e instanceof Error?e.message:'Could not transform vector')}
 }
 const colorPalettes=[
  {name:'Ocean',fill:'#2563eb',stroke:'#06b6d4'},
  {name:'Sunset',fill:'#ef4444',stroke:'#fbbf24'},
  {name:'Forest',fill:'#059669',stroke:'#a3e635'},
  {name:'Luxury',fill:'#c99b42',stroke:'#172033'}
 ];
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
   setXml(cleanSVG(await file.text()));setHistory({past:[],future:[]});setName(file.name);setStatus('True SVG vector loaded. Select your export format.');
  }catch(e){setStatus(e instanceof Error?e.message:'Unable to read SVG')}
  finally{setBusy(false)}
 }
 function changeFill(){
  if(!xml)return;
  try{
   const doc=new DOMParser().parseFromString(xml,'image/svg+xml');
   const targets=doc.documentElement.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line');
   for(const shape of targets){shape.setAttribute('fill',fill);shape.setAttribute('stroke',stroke);shape.setAttribute('stroke-width',String(width));shape.setAttribute('opacity',String(opacity/100))}
   commitSvg(new XMLSerializer().serializeToString(doc.documentElement));
   setStatus(targets.length+' vector shapes updated.');
  }catch(e){setStatus(e instanceof Error?e.message:'Could not update colors')}
 }
 function addShape(type:'circle'|'rect'|'star'){
  try{
   const base=xml||'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"></svg>';
   const doc=new DOMParser().parseFromString(base,'image/svg+xml');
   const root=doc.documentElement;
   const node=doc.createElementNS('http://www.w3.org/2000/svg',type==='star'?'path':type);
   if(type==='star'){
    const d=Array.from({length:10},(_,index)=>{
     const angle=(-Math.PI/2)+index*Math.PI/5,r=index%2===0?175:78;
     return (index===0?'M':'L')+' '+(400+Math.cos(angle)*r).toFixed(2)+' '+(400+Math.sin(angle)*r).toFixed(2);
    }).join(' ')+' Z';
    node.setAttribute('d',d);
   }
   for(const [key,value] of Object.entries(type==='circle'?{cx:'400',cy:'400',r:'130'}:type==='rect'?{x:'290',y:'290',width:'220',height:'220',rx:'0'}:{}))node.setAttribute(key,value);
   node.setAttribute('fill',fill);node.setAttribute('stroke',stroke);node.setAttribute('stroke-width',String(width));node.setAttribute('opacity',String(opacity/100));root.appendChild(node);
   commitSvg(new XMLSerializer().serializeToString(root));setStatus('New editable '+type+' added.');
  }catch(e){setStatus(e instanceof Error?e.message:'Unable to add shape')}
 }
 async function run(){
  if(!xml)return;
  await withPaidDownload({slug:mode==='edit'?'studio-svg-editor':'studio-convert',feature:'Vector '+format.toUpperCase()+' export'},generate);
 }
 async function generate(){
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
    <h2>Upload SVG &amp; Live Preview</h2>
    <StudioUploadPreview id="suite-svg-file" accept=".svg,image/svg+xml" name={name}
      sourceUrl={preview} outputUrl={upscaledPreview} afterLabel="Upscaled preview" onFile={upload} hint="Editable SVG · max 2.5 MB"
      beforeLabel="SVG Vector" busy={busy} onReset={()=>{setXml('');setHistory({past:[],future:[]});setStatus('Preview reset. Upload another SVG or create shapes.')}}/>
    <p className="studio-note">{name||'Use SVG from Image-to-Vector, Illustrator, Inkscape or CorelDRAW.'}</p>
    {mode==='edit'?<><h2>Design Controls</h2>
     <label>Fill color<input type="color" value={fill} onChange={e=>setFill(e.target.value)}/></label>
     <label>Stroke color<input type="color" value={stroke} onChange={e=>setStroke(e.target.value)}/></label>
     <label>Stroke width {width}px<input type="range" min="0" max="15" value={width} onChange={e=>setWidth(+e.target.value)}/></label>
     <label>Shape opacity {opacity}%<input type="range" min="10" max="100" value={opacity} onChange={e=>setOpacity(+e.target.value)}/></label>
     <div className="studio-premium-palette">{colorPalettes.map(item=><button key={item.name} type="button"
      title={item.name} aria-label={'Choose '+item.name+' color palette'}
      style={{background:'linear-gradient(120deg,'+item.fill+' 50%,'+item.stroke+' 50%)'}}
      onClick={()=>{setFill(item.fill);setStroke(item.stroke);setStatus(item.name+' palette selected. Click Apply to vector shapes.')}}/>)}</div>
     <button type="button" disabled={!xml} onClick={changeFill}>Apply to vector shapes</button>
     <div className="suite-pair">
      <button type="button" className="studio-secondary" disabled={!history.past.length} onClick={()=>travelSvg('undo')}>↶ Undo</button>
      <button type="button" className="studio-secondary" disabled={!history.future.length} onClick={()=>travelSvg('redo')}>↷ Redo</button>
     </div>
     <div className="studio-premium-presets">
      <button type="button" onClick={()=>addShape('circle')}>+ Circle</button>
      <button type="button" onClick={()=>addShape('rect')}>+ Rectangle</button>
      <button type="button" onClick={()=>addShape('star')}>+ Star</button>
     </div>
     <div className="suite-pair">
      <button type="button" className="studio-secondary" disabled={!xml} onClick={()=>transformShapes('horizontal')}>⇆ Flip H</button>
      <button type="button" className="studio-secondary" disabled={!xml} onClick={()=>transformShapes('vertical')}>⇅ Flip V</button>
     </div>
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
    <div className="studio-work-top"><strong>Vector Preview</strong><span>{shapeCount} shape{shapeCount===1?'':'s'} · {mode==='edit'?'Live editing':'Geometry preserved'}</span></div>
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
    <StudioUpscalePanel getCanvas={previewCanvas} format="vector" disabled={!xml} sourceKey={xml} usageSlug={mode==='edit'?'studio-svg-editor':'studio-convert'} onPreviewChange={setUpscaledPreview}/>
   </div>
  </div>
 </section>
}
