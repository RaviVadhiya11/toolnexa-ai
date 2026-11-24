'use client';
import {useState,type ChangeEvent,type DragEvent,type ReactNode} from 'react';

type Props={
 id:string;
 accept:string;
 name?:string;
 sourceUrl?:string;
 outputUrl?:string;
 onFile:(file:File)=>void|Promise<void>;
 hint?:string;
 beforeLabel?:string;
 afterLabel?:string;
 transparent?:boolean;
 editor?:ReactNode;
 busy?:boolean;
 onReset?:()=>void;
};
export function StudioUploadPreview({
 id,accept,name='',sourceUrl='',outputUrl='',onFile,hint='JPG · PNG · WebP',beforeLabel='Original',
 afterLabel='Edited',transparent=false,editor,busy=false,onReset
}:Props){
 const [compare,setCompare]=useState(false);
 const [dragging,setDragging]=useState(false);
 const [zoom,setZoom]=useState(false);
 const hasSource=!!sourceUrl,hasOutput=!!outputUrl;
 function select(file?:File){
  if(!file)return;
  setCompare(false);setZoom(false);
  void onFile(file);
 }
 function drop(event:DragEvent<HTMLDivElement>){
  event.preventDefault();setDragging(false);
  if(event.dataTransfer.files.length)select(event.dataTransfer.files[0]);
 }
 function chosen(event:ChangeEvent<HTMLInputElement>){
  select(event.currentTarget.files?.[0]);
  event.currentTarget.value='';
 }
 return <div className={'studio-inline-upload'+(dragging?' dragging':'')} onDragOver={e=>{e.preventDefault();setDragging(true)}}
  onDragLeave={e=>{e.preventDefault();setDragging(false)}} onDrop={drop}>
  <input type="file" id={id} className="studio-inline-file" accept={accept} onChange={chosen}/>
  {hasSource?<div className="studio-inline-editor">
   <div className="studio-inline-toolbar">
    <span className="studio-inline-filename" title={name}>{name||'Uploaded image'}</span>
    <div className="studio-inline-actions">
     <label htmlFor={id} className="studio-inline-action" title="Choose another image">↻ Replace</label>
     {hasOutput&&<button type="button" className="studio-inline-action" aria-pressed={compare}
       onClick={()=>setCompare(value=>!value)}>{compare?'After':'Before / After'}</button>}
     <button type="button" className="studio-inline-action" aria-pressed={zoom} onClick={()=>setZoom(value=>!value)}>
      {zoom?'Fit':'Zoom'}</button>
     {onReset&&<button type="button" className="studio-inline-action" onClick={()=>{setCompare(false);onReset()}}>Reset</button>}
    </div>
   </div>
   <div className={'studio-inline-stage'+(transparent?' suite-checker':'')+(zoom?' studio-inline-zoom':'')}>
    {busy&&<div className="studio-inline-busy" role="status">Processing image…</div>}
    {compare||!hasOutput?<img src={sourceUrl} alt={beforeLabel} className="studio-inline-art"/>:
     editor?<div className="studio-inline-custom">{editor}</div>:
     <img src={outputUrl} alt={afterLabel} className="studio-inline-art"/>}
    {hasOutput&&<span className="studio-inline-state">{compare?beforeLabel:afterLabel}</span>}
   </div>
   <p className="studio-inline-hint">{hasOutput?'Result is shown here, exactly where you uploaded it.':'Your photo is ready. Process it to update this same preview.'}</p>
  </div>:<label htmlFor={id} className="studio-inline-empty">
   <span className="studio-inline-icon" aria-hidden="true">↑</span>
   <strong>Drop your image here</strong><span>or tap to upload</span>
   <small>{hint}</small>
  </label>}
 </div>;
}
