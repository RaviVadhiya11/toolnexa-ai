'use client';
import {useEffect,useState,type ChangeEvent,type DragEvent,type KeyboardEvent,type ReactNode} from 'react';
type Mat='checker'|'white'|'dark';
type Props={
 id:string;accept:string;name?:string;sourceUrl?:string;outputUrl?:string;
 onFile:(file:File)=>void|Promise<void>;hint?:string;
 beforeLabel?:string;afterLabel?:string;transparent?:boolean;
 editor?:ReactNode;busy?:boolean;onReset?:()=>void;
};
export function StudioUploadPreview({
 id,accept,name='',sourceUrl='',outputUrl='',onFile,
 hint='JPG · PNG · WebP',beforeLabel='Original',afterLabel='Edited',
 transparent=false,editor,busy=false,onReset
}:Props){
 const [compare,setCompare]=useState(false);
 const [split,setSplit]=useState(false);
 const [splitAt,setSplitAt]=useState(50);
 const [zoom,setZoom]=useState(100);
 const [mat,setMat]=useState<Mat>('checker');
 const [dragging,setDragging]=useState(false);
 const hasSource=!!sourceUrl,hasOutput=!!outputUrl;
 useEffect(()=>{setCompare(false);setSplit(false);setSplitAt(50);setZoom(100)},[sourceUrl]);
 function select(file?:File){
  if(!file)return;
  setCompare(false);setSplit(false);setZoom(100);
  void onFile(file);
 }
 function drop(event:DragEvent<HTMLDivElement>){
  event.preventDefault();setDragging(false);
  if(event.dataTransfer.files.length)select(event.dataTransfer.files[0]);
 }
 function chosen(event:ChangeEvent<HTMLInputElement>){
  select(event.currentTarget.files?.[0]);event.currentTarget.value='';
 }
 function key(event:KeyboardEvent<HTMLDivElement>){
  if(event.target!==event.currentTarget)return;
  if(event.key===' '&&hasOutput){event.preventDefault();setCompare(v=>!v);setSplit(false)}
  if(event.key==='+'||event.key==='='){event.preventDefault();setZoom(z=>Math.min(250,z+25))}
  if(event.key==='-'){event.preventDefault();setZoom(z=>Math.max(100,z-25))}
  if(event.key==='Escape'){setCompare(false);setSplit(false);setZoom(100)}
 }
 return <div className={'studio-inline-upload studio-premium-preview'+(dragging?' dragging':'')}
   onDragOver={event=>{event.preventDefault();setDragging(true)}}
   onDragLeave={event=>{event.preventDefault();setDragging(false)}} onDrop={drop}>
  <input type="file" id={id} className="studio-inline-file" accept={accept} onChange={chosen}/>
  {hasSource?<div className="studio-inline-editor">
   <div className="studio-inline-toolbar">
    <span className="studio-inline-filename" title={name}>{name||'Uploaded image'}</span>
    <div className="studio-inline-actions">
     <label htmlFor={id} className="studio-inline-action" title="Choose another image">↻ Replace</label>
     {hasOutput&&<button type="button" className="studio-inline-action" aria-pressed={compare}
       onClick={()=>{setCompare(value=>!value);setSplit(false)}}>{compare?'After':'Before / After'}</button>}
     {hasOutput&&<button type="button" className="studio-inline-action" aria-pressed={split}
       onClick={()=>{setSplit(value=>!value);setCompare(false)}}>◧ Split</button>}
     <button type="button" className="studio-inline-action" aria-label="Zoom in" onClick={()=>setZoom(z=>Math.min(250,z+25))}>＋</button>
     <button type="button" className="studio-inline-action" aria-label="Fit image" onClick={()=>setZoom(100)}>{zoom}%</button>
     <button type="button" className="studio-inline-action" aria-label="Zoom out" onClick={()=>setZoom(z=>Math.max(100,z-25))}>－</button>
     {onReset&&<button type="button" className="studio-inline-action" onClick={()=>{setCompare(false);setSplit(false);setZoom(100);onReset()}}>Reset</button>}
    </div>
   </div>
   <div className="studio-preview-options">
    <label htmlFor={id+'-mat'}>Canvas</label>
    <select id={id+'-mat'} value={mat} onChange={event=>setMat(event.target.value as Mat)}>
     <option value="checker">Transparency grid</option><option value="white">White</option><option value="dark">Dark</option>
    </select>
    <span>{hasOutput?'✓ Processed result':'Ready to edit'}</span>
   </div>
   <div tabIndex={0} onKeyDown={key}
    aria-label="Image preview. Space compares, plus and minus zoom, Escape resets."
    className={'studio-inline-stage studio-premium-stage studio-mat-'+mat+
     (transparent?' suite-checker':'')+(zoom>100?' studio-inline-zoom':'')}
    style={{['--studio-zoom' as string]:String(zoom/100)}}>
    {busy&&<div className="studio-inline-busy" role="status">Processing image…</div>}
    {split&&hasOutput?<div className="studio-inline-split">
     <img src={sourceUrl} alt={beforeLabel} className="studio-inline-art"/>
     <img src={outputUrl} alt={afterLabel} className="studio-inline-art studio-inline-split-top"
      style={{clipPath:'inset(0 '+(100-splitAt)+'% 0 0)'}}/>
     <div className="studio-inline-split-line" style={{left:splitAt+'%'}} aria-hidden="true"><span>◀ ▶</span></div>
     <input type="range" className="studio-inline-split-slider" min={0} max={100}
      value={splitAt} onChange={event=>setSplitAt(+event.target.value)} aria-label="Drag to compare before and after"/>
    </div>:
    compare||!hasOutput?<img src={sourceUrl} alt={beforeLabel} className="studio-inline-art"/>:
     editor?<div className="studio-inline-custom">{editor}</div>:
     <img src={outputUrl} alt={afterLabel} className="studio-inline-art"/>}
    {hasOutput&&<span className="studio-inline-state">{split?'Drag comparison line':compare?beforeLabel:afterLabel}</span>}
   </div>
   <p className="studio-inline-hint">Zoom {zoom}% · {hasOutput?'Use Split for a live before/after comparison.':'Your photo is ready. Process it to update this preview.'} <span className="studio-shortcut-hint">Keyboard: Space compare · + / − zoom</span></p>
  </div>:<label htmlFor={id} className="studio-inline-empty studio-premium-drop">
   <span className="studio-inline-icon" aria-hidden="true">✦</span>
   <strong>Drop your image here</strong><span>or tap to upload and start creating</span>
   <small>{hint}</small>
  </label>}
 </div>;
}
