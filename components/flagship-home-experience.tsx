'use client';
import {useEffect,useRef,useState,type ChangeEvent,type DragEvent} from 'react';
import {useRouter} from 'next/navigation';
import {UploadCloud,Image as ImageIcon,MoveHorizontal,ArrowUpRight} from 'lucide-react';
import {studioSampleFile} from '@/lib/studio-sample-scenes';
import {prepareStudioUpload} from '@/lib/studio-hero-transfer';

const accepted=['image/jpeg','image/png','image/webp'];
export function FlagshipHomeExperience(){
 const router=useRouter();
 const fileRef=useRef<HTMLInputElement|null>(null);
 const [preview,setPreview]=useState('');
 const [split,setSplit]=useState(52);
 const [drag,setDrag]=useState(false);
 const [error,setError]=useState('');
 useEffect(()=>{
  let active=true,localUrl='';
  void studioSampleFile('mountain').then(file=>{
   if(!active)return;
   localUrl=URL.createObjectURL(file);
   setPreview(localUrl);
  }).catch(()=>{if(active)setError('Illustrative comparison unavailable in this browser.')});
  return()=>{active=false;if(localUrl)URL.revokeObjectURL(localUrl)};
 },[]);
 function open(file?:File){
  if(!file)return;
  if(!accepted.includes(file.type)){setError('Choose JPG, PNG or WebP.');return}
  if(file.size>10*1024*1024){setError('Maximum 10 MB per image.');return}
  prepareStudioUpload(file);
  setError('');
  router.push('/studio/enhance');
 }
 function drop(e:DragEvent<HTMLDivElement>){
  e.preventDefault();setDrag(false);open(e.dataTransfer.files[0]);
 }
 function choose(e:ChangeEvent<HTMLInputElement>){open(e.currentTarget.files?.[0]);e.currentTarget.value=''}
 return <div className="flagship-hero-experience">
  <div className={'flagship-hero-upload '+(drag?'is-dragging':'')}
   onDrop={drop} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={e=>{e.preventDefault();setDrag(false)}}>
   <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={choose} aria-label="Upload an image to Studio"/>
   <span className="flagship-upload-icon"><UploadCloud size={26}/></span>
   <span className="flagship-upload-copy"><strong>Drop a JPG, PNG or WebP to launch Studio</strong>
    <small>Your file stays in this browser · Upload once, edit in Studio</small></span>
   <button type="button" onClick={()=>fileRef.current?.click()}>Select image <ArrowUpRight size={15}/></button>
  </div>
  {error&&<p className="flagship-upload-error" role="status">{error}</p>}
  <div className="flagship-compare-frame">
   <div className="flagship-compare-head"><span className="flagship-pill"><ImageIcon size={14}/> LIVE FILTER COMPARISON</span>
    <span className="flagship-compare-hint"><MoveHorizontal size={14}/> Drag to compare</span></div>
   <div className="flagship-compare-stage">
    {preview?<><img src={preview} className="flagship-compare-image" alt="Illustrative processed sample landscape"/>
     <div className="flagship-compare-before" style={{clipPath:'inset(0 '+(100-split)+'% 0 0)'}}>
      <img src={preview} className="flagship-compare-image flagship-compare-soft" alt=""/>
     </div>
     <div className="flagship-compare-handle" style={{left:split+'%'}}><span>⇠ ⇢</span></div>
     <span className="flagship-compare-label before">BEFORE</span>
     <span className="flagship-compare-label after">FILTERED</span>
     <input type="range" min="0" max="100" value={split} onChange={e=>setSplit(Number(e.target.value))}
       aria-label="Drag to compare filtered and softened illustrative sample"/>
    </>:<div className="flagship-compare-placeholder">Preparing interactive comparison…</div>}
   </div>
   <div className="flagship-compare-foot"><span>Illustrative local filter demo · not a processed 8K output</span>
    <a href="/studio/enhance">Open full editor →</a></div>
  </div>
 </div>;
}
