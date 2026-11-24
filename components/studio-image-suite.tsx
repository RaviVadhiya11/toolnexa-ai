'use client';
import {useEffect,useRef,useState} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
import Link from 'next/link';
import {reserveStudioUsage,StudioQuotaNotice} from '@/components/studio-quota';
import {StudioUpscalePanel} from '@/components/studio-upscale-panel';
import {StudioUploadPreview} from '@/components/studio-upload-preview';
import {composeBackground,refineBackground,type BgFill,type BgBrush} from '@/lib/studio-bg-editor';
import {readImage,cropCanvas,imageBlob,downloadFile,proDownload,createCanvas} from '@/lib/studio-suite-client';
import {solidBackgroundCutout,healMaskedImage,restorePhoto} from '@/lib/studio-image-effects';
type Mode='background'|'retouch'|'restore';
type Tint='original'|'sepia'|'warm'|'cool';
const NAMES:Record<Mode,{name:string,subtitle:string,button:string}>={
 background:{name:'AI Background Remover HD',subtitle:'Separate foreground with an on-device AI model or remove a solid-color background.',button:'Remove Background'},
 retouch:{name:'Object Remover & Retouch',subtitle:'Paint small unwanted areas, then heal them from nearby pixels in your browser.',button:'Heal Selected Area'},
 restore:{name:'Photo Restore & Colorizer',subtitle:'Reduce noise, sharpen details and apply realistic-looking colour tones to old photos.',button:'Restore Photo'}
};
export function StudioImageSuite({mode}:{mode:Mode}){
 const sourceRef=useRef<HTMLCanvasElement|null>(null);
 const resultRef=useRef<HTMLCanvasElement|null>(null);
 const paintRef=useRef<HTMLCanvasElement|null>(null);
 const maskRef=useRef<Uint8Array>(new Uint8Array(0));
 const drawing=useRef(false);
 const bgCanvas=useRef<HTMLCanvasElement|null>(null);
 const bgDrawing=useRef(false);
 const bgImageRef=useRef<HTMLImageElement|null>(null);
 const undoBG=useRef<ImageData[]>([]),redoBG=useRef<ImageData[]>([]);
 const undoMask=useRef<Uint8Array[]>([]),redoMask=useRef<Uint8Array[]>([]);
 const [history,setHistory]=useState({undo:0,redo:0});
 const [maskHistory,setMaskHistory]=useState({undo:0,redo:0});
 const [fileName,setFileName]=useState('');
 const [originalUrl,setOriginalUrl]=useState('');
 const [resultUrl,setResultUrl]=useState('');
 const [dims,setDims]=useState({w:800,h:600});
 const [status,setStatus]=useState('Upload JPG, PNG or WebP to begin.');
 const [working,setWorking]=useState(false);
 const [plan,setPlan]=useState('Checking');
 const [scale,setScale]=useState<2|4>(2);
 const [algorithm,setAlgorithm]=useState<'ai'|'solid'>('ai');
 const [bgFill,setBgFill]=useState<BgFill>('transparent');
 const [bgColor,setBgColor]=useState('#f3f4f6');
 const [bgSize,setBgSize]=useState(100);
 const [bgOffsetX,setBgOffsetX]=useState(0);
 const [bgOffsetY,setBgOffsetY]=useState(0);
 const [bgShadow,setBgShadow]=useState(false);
 const [bgShadowStrength,setBgShadowStrength]=useState(65);
 const [bgPhotoUrl,setBgPhotoUrl]=useState('');
 const [restorePreset,setRestorePreset]=useState<'balanced'|'portrait'|'scan'|'vintage'>('balanced');
 const [autoLevels,setAutoLevels]=useState(false);
 const [bgTool,setBgTool]=useState<BgBrush>('erase');
 const [bgBrushSize,setBgBrushSize]=useState(22);
 const [tolerance,setTolerance]=useState(65);
 const [feather,setFeather]=useState(2);
 const [brush,setBrush]=useState(22);
 const [denoise,setDenoise]=useState(45);
 const [sharpness,setSharpness]=useState(45);
 const [tint,setTint]=useState<Tint>('original');
 const pro=['Pro','Premium','Max'].includes(plan);
 useEffect(()=>{
  let mounted=true;
  const refresh=()=>void fetch('/api/usage/quota',{cache:'no-store'}).then(r=>r.json())
    .then(j=>{if(mounted)setPlan(typeof j.plan==='string'?j.plan:'Unavailable')})
    .catch(()=>{if(mounted)setPlan('Unavailable')});
  refresh();window.addEventListener('focus',refresh);window.addEventListener('toolnexa-subscription-changed',refresh);
  return()=>{mounted=false;window.removeEventListener('focus',refresh);window.removeEventListener('toolnexa-subscription-changed',refresh)};
 },[]);
 useEffect(()=>()=>{if(originalUrl.startsWith('blob:'))URL.revokeObjectURL(originalUrl)},[originalUrl]);
 useEffect(()=>()=>{if(bgPhotoUrl.startsWith('blob:'))URL.revokeObjectURL(bgPhotoUrl)},[bgPhotoUrl]);
 const bgOptions={fill:bgFill,color:bgColor,size:bgSize,offsetX:bgOffsetX,offsetY:bgOffsetY,shadow:bgShadow,
  shadowStrength:bgShadowStrength,image:bgImageRef.current};
 function resetHistory(){
  undoBG.current=[];redoBG.current=[];undoMask.current=[];redoMask.current=[];
  setHistory({undo:0,redo:0});setMaskHistory({undo:0,redo:0});
 }
 function recordBG(){
  const canvas=resultRef.current;const ctx=canvas?.getContext('2d',{willReadFrequently:true});
  if(!canvas||!ctx)return;
  undoBG.current.push(ctx.getImageData(0,0,canvas.width,canvas.height));
  if(undoBG.current.length>12)undoBG.current.shift();
  redoBG.current=[];setHistory({undo:undoBG.current.length,redo:0});
 }
 function travelBG(direction:'undo'|'redo'){
  const canvas=resultRef.current,ctx=canvas?.getContext('2d',{willReadFrequently:true});
  if(!ctx||!canvas)return;
  const take=direction==='undo'?undoBG.current:redoBG.current;
  const give=direction==='undo'?redoBG.current:undoBG.current;
  const snapshot=take.pop();if(!snapshot)return;
  give.push(ctx.getImageData(0,0,canvas.width,canvas.height));
  ctx.putImageData(snapshot,0,0);
  setResultUrl(canvas.toDataURL('image/png'));
  setHistory({undo:undoBG.current.length,redo:redoBG.current.length});
  setStatus(direction==='undo'?'Last cutout brush stroke undone.':'Cutout brush stroke restored.');
 }
 async function chooseBackgroundPhoto(file?:File){
  if(!file)return;
  try{
   const image=await readImage(file);
   bgImageRef.current=image;setBgPhotoUrl(URL.createObjectURL(file));setBgFill('image');
   setStatus('Your own background image is applied. Adjust the subject size and position.');
  }catch(error){setStatus(error instanceof Error?error.message:'Could not load background image')}
 }
 function refreshMaskCanvas(){
  const source=sourceRef.current,paint=paintRef.current;
  if(!source||!paint)return;
  paint.width=source.width;paint.height=source.height;
  const src=source.getContext('2d',{willReadFrequently:true})?.getImageData(0,0,source.width,source.height);
  if(!src)return;
  const m=maskRef.current;
  for(let i=0;i<m.length;i++)if(m[i]){
   const k=i*4;src.data[k]=Math.round(src.data[k]*.57+139*.43);
   src.data[k+1]=Math.round(src.data[k+1]*.57+92*.43);
   src.data[k+2]=Math.round(src.data[k+2]*.57+246*.43);
  }
  paint.getContext('2d')?.putImageData(src,0,0);
 }
 function recordMask(){
  undoMask.current.push(new Uint8Array(maskRef.current));
  if(undoMask.current.length>20)undoMask.current.shift();
  redoMask.current=[];setMaskHistory({undo:undoMask.current.length,redo:0});
 }
 function travelMask(direction:'undo'|'redo'){
  if(!sourceRef.current)return;
  const take=direction==='undo'?undoMask.current:redoMask.current;
  const give=direction==='undo'?redoMask.current:undoMask.current;
  const snapshot=take.pop();if(!snapshot)return;
  give.push(new Uint8Array(maskRef.current));maskRef.current=new Uint8Array(snapshot);
  refreshMaskCanvas();setResultUrl('');resultRef.current=null;
  setMaskHistory({undo:undoMask.current.length,redo:redoMask.current.length});
  setStatus(direction==='undo'?'Selection stroke undone.':'Selection stroke restored.');
 }
 function setRestoration(value:'balanced'|'portrait'|'scan'|'vintage'){
  setRestorePreset(value);
  const presets={balanced:[45,45,'original',true],portrait:[65,28,'warm',false],
   scan:[70,65,'original',true],vintage:[35,25,'sepia',false]} as const;
  const [d,s,t,auto]=presets[value];setDenoise(d);setSharpness(s);setTint(t);setAutoLevels(auto);
  setStatus('Applied '+value+' restoration settings. Choose Restore Photo to preview the result.');
 }
 function exportCanvas(){
  if(!resultRef.current)throw Error('Process the image before exporting.');
  return mode==='background'?composeBackground(resultRef.current,bgOptions):resultRef.current;
 }
 useEffect(()=>{
  if(mode!=='background'||!resultRef.current||!resultUrl||!bgCanvas.current)return;
  const preview=bgCanvas.current,composed=composeBackground(resultRef.current,bgOptions);
  preview.width=composed.width;preview.height=composed.height;
  preview.getContext('2d')?.drawImage(composed,0,0);
  composed.width=0;composed.height=0;
 },[mode,resultUrl,bgFill,bgColor,bgSize,bgOffsetX,bgOffsetY,bgShadow,bgShadowStrength,bgPhotoUrl]);
 function paintBG(event:ReactPointerEvent<HTMLCanvasElement>){
  if(!resultRef.current||!sourceRef.current)return;
  if(bgSize!==100||bgOffsetX!==0||bgOffsetY!==0){
   setStatus('Return subject size to 100% and position to 0 before refining the mask.');return;
  }
  const canvas=event.currentTarget,rect=canvas.getBoundingClientRect();
  const x=(event.clientX-rect.left)*canvas.width/rect.width;
  const y=(event.clientY-rect.top)*canvas.height/rect.height;
  refineBackground(resultRef.current,sourceRef.current,x,y,bgBrushSize,bgTool);
  const output=composeBackground(resultRef.current,bgOptions);
  canvas.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height);
  canvas.getContext('2d')?.drawImage(output,0,0);output.width=0;output.height=0;
 }
 function finishBgBrush(){
  if(!bgDrawing.current)return;
  bgDrawing.current=false;
  if(resultRef.current){
   setResultUrl(resultRef.current.toDataURL('image/png'));
   setStatus('Cutout refined. Review the edges in the upload preview before downloading.');
  }
 }
 function resetPreview(){
  resultRef.current=null;setResultUrl('');maskRef.current.fill(0);resetHistory();
  if(mode==='background'){setBgFill('transparent');setBgSize(100);setBgOffsetX(0);setBgOffsetY(0);setBgShadow(false)}
  if(mode==='retouch')refreshMaskCanvas();
  setStatus('Original image restored. Process it again to create a new result.');
 }
 useEffect(()=>{
  if(mode!=='retouch'||!sourceRef.current||!paintRef.current)return;
  const canvas=paintRef.current,source=sourceRef.current;
  canvas.width=source.width;canvas.height=source.height;
  canvas.getContext('2d')?.drawImage(source,0,0);
 },[fileName,mode,dims,resultUrl]);
 async function upload(file?:File){
  if(!file)return;
  setWorking(true);setStatus('Opening image…');
  try{
   const img=await readImage(file);
   const canvas=cropCanvas(img,800);
   sourceRef.current=canvas;resultRef.current=null;resetHistory();
   maskRef.current=new Uint8Array(canvas.width*canvas.height);
   setDims({w:canvas.width,h:canvas.height});
   setOriginalUrl(URL.createObjectURL(file));setResultUrl('');
   if(mode==='background'){setBgFill('transparent');setBgSize(100);setBgOffsetX(0);setBgOffsetY(0);setBgShadow(false);setBgPhotoUrl('');bgImageRef.current=null}
   setFileName(file.name);
   setStatus('Image ready. Adjust settings and process it.');
  }catch(e){setStatus(e instanceof Error?e.message:'Cannot open the image')}
  finally{setWorking(false)}
 }
 function point(event:ReactPointerEvent<HTMLCanvasElement>){
  const canvas=paintRef.current;if(!canvas)return;
  const rect=canvas.getBoundingClientRect();
  const x=Math.round((event.clientX-rect.left)*canvas.width/rect.width);
  const y=Math.round((event.clientY-rect.top)*canvas.height/rect.height);
  if(x<0||y<0||x>=canvas.width||y>=canvas.height)return;
  const r=brush,ctx=canvas.getContext('2d');
  if(!ctx)return;
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='rgba(139,92,246,.45)';ctx.fill();
  const mask=maskRef.current;
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   if(dx*dx+dy*dy>r*r)continue;
   const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=canvas.width||yy>=canvas.height)continue;
   mask[yy*canvas.width+xx]=1;
  }
  if(resultUrl){setResultUrl('');resultRef.current=null}
 }
 function clearBrush(){
  const original=sourceRef.current,canvas=paintRef.current;
  if(!original||!canvas)return;
  recordMask();maskRef.current.fill(0);
  const ctx=canvas.getContext('2d');ctx?.clearRect(0,0,canvas.width,canvas.height);ctx?.drawImage(original,0,0);
  setStatus('Selection cleared. Paint a new small area.');
 }
 async function process(){
  if(!sourceRef.current){setStatus('Choose an image first.');return}
  setWorking(true);setStatus('Processing local image…');
  try{
   const source=sourceRef.current;
   await reserveStudioUsage('studio-'+mode as 'studio-background'|'studio-retouch'|'studio-restore');
   let output:HTMLCanvasElement;
   if(mode==='background'){
    if(algorithm==='solid')output=solidBackgroundCutout(source,tolerance,feather);
    else{
     try{
      const {aiCutout}=await import('@/lib/studio-bg-ai');
      output=await aiCutout(source,setStatus);
     }catch(e){
      throw Error('AI model could not load on this device or network. Select Solid Background mode for an offline alternative. '+(e instanceof Error?e.message:''));
     }
    }
   }else if(mode==='retouch'){
    output=healMaskedImage(source,maskRef.current);
   }else output=restorePhoto(source,denoise,sharpness,tint,autoLevels);
   resultRef.current=output;
   setResultUrl(output.toDataURL('image/png'));
   setStatus(mode==='background'?'Transparent PNG ready. Check fine hair edges before export.':
      mode==='retouch'?'Selected marks healed. Large subjects may need specialist AI inpainting.':
      'Photo adjustments applied. Colour options are tonal filters, not AI reconstruction.');
  }catch(e){setStatus(e instanceof Error?e.message:'Processing failed')}
  finally{setWorking(false)}
 }
 async function standard(type:'png'|'jpeg'){
  if(!resultRef.current)return;
  setWorking(true);
  try{
   const canvas=exportCanvas();
   let input=canvas;
   if(type==='jpeg'){
    input=createCanvas(canvas,canvas.width,canvas.height);
    const ctx=input.getContext('2d')!;
    ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#fff';ctx.fillRect(0,0,input.width,input.height);
   }
   const blob=await imageBlob(input,type==='png'?'image/png':'image/jpeg',.93);
   downloadFile(blob,'toolnexa-'+mode+'-standard.'+(type==='png'?'png':'jpg'));
   setStatus('Standard export downloaded.');
  }catch(e){setStatus(e instanceof Error?e.message:'Export failed')}
  finally{setWorking(false)}
 }
 async function hd(){
  if(!resultRef.current){setStatus('Process an image first.');return}
  if(!pro){setStatus('Pro/Premium/Max subscription required for HD exports.');return}
  setWorking(true);setStatus('Checking Pro plan and processing HD image…');
  try{
   await proDownload(exportCanvas(),mode==='background'&&bgFill==='transparent'?'cutout':'image',scale);
   setStatus('Pro HD export downloaded. Source details are not recreated by enlargement.');
  }catch(e){setStatus(e instanceof Error?e.message:'HD export unavailable')}
  finally{setWorking(false)}
 }
 return <section className="suite-workspace">
  <header className="suite-head"><span className="studio-eyebrow">IMAGE & VECTOR SUITE · PHOTO EDITING</span>
   <h1>{NAMES[mode].name}</h1><p>{NAMES[mode].subtitle}</p></header>
  <div className="suite-editor-grid">
   <div className="studio-panel suite-controls">
    <h2>1. Upload &amp; Preview</h2>
    <StudioUploadPreview id={'suite-upload-'+mode} accept="image/png,image/jpeg,image/webp"
      name={fileName} sourceUrl={originalUrl} outputUrl={mode==='retouch'?resultUrl||originalUrl:resultUrl}
      onFile={upload} busy={working} transparent={mode==='background'&&bgFill==='transparent'}
      beforeLabel="Original" afterLabel={mode==='background'?'Background removed':mode==='retouch'?'Retouched':'Restored'}
      onReset={resetPreview}
      editor={mode==='background'&&resultUrl?<canvas ref={bgCanvas} className="studio-bg-edit-canvas"
        style={{touchAction:'none'}} onPointerDown={e=>{bgDrawing.current=true;e.currentTarget.setPointerCapture(e.pointerId);paintBG(e)}}
        onPointerMove={e=>{if(bgDrawing.current)paintBG(e)}}
        onPointerUp={finishBgBrush} onPointerCancel={finishBgBrush}/>:
       mode==='retouch'&&!resultUrl&&fileName?<canvas ref={paintRef} className="suite-brush-canvas" style={{touchAction:'none'}}
        onPointerDown={e=>{recordMask();drawing.current=true;e.currentTarget.setPointerCapture(e.pointerId);point(e)}}
        onPointerMove={e=>{if(drawing.current)point(e)}}
        onPointerUp={()=>{drawing.current=false}} onPointerCancel={()=>{drawing.current=false}}/>:undefined}/>
    <p className="studio-note">{fileName||'JPG, PNG or WebP · up to 12 MB · on-device processing.'}</p>
    <h2>2. Settings</h2>
    {mode==='background'?<>
     <label htmlFor="bg-mode">Removal method</label>
     <select id="bg-mode" value={algorithm} onChange={e=>setAlgorithm(e.target.value as 'ai'|'solid')}>
      <option value="ai">AI U²-Net — automatic subject</option><option value="solid">Solid/white background — offline</option>
     </select>
     {algorithm==='solid'&&<>
      <label>Color tolerance {tolerance}<input type="range" min="20" max="140" value={tolerance} onChange={e=>setTolerance(+e.target.value)}/></label>
      <label>Edge feather {feather}px<input type="range" min="0" max="5" value={feather} onChange={e=>setFeather(+e.target.value)}/></label>
     </>}
     <p className="studio-note">AI mode downloads an open-source U²-Netp model on first use; solid-background removal works offline. Your pixels stay in the browser.</p>
     {resultUrl&&<>
      <h2>3. Refine &amp; Change Background</h2>
      <p className="studio-note">Brush directly on the image in the upload box. Erase removes leftover background; Restore recovers subject details.</p>
      <div className="suite-pair">
       <button type="button" className={bgTool==='erase'?'suite-selected':'studio-secondary'} onClick={()=>setBgTool('erase')}>Erase</button>
       <button type="button" className={bgTool==='restore'?'suite-selected':'studio-secondary'} onClick={()=>setBgTool('restore')}>Restore</button>
      </div>
      <label>Refine brush {bgBrushSize}px<input type="range" min="4" max="65" value={bgBrushSize} onChange={e=>setBgBrushSize(+e.target.value)}/></label>
      <label htmlFor="bg-fill">New background</label>
      <select id="bg-fill" value={bgFill} onChange={e=>setBgFill(e.target.value as BgFill)}>
       <option value="transparent">Transparent PNG</option>
       <option value="white">Clean White</option>
       <option value="color">Solid Color</option>
       <option value="gradient">Soft Gradient</option>
      </select>
      {(bgFill==='color'||bgFill==='gradient')&&<label>Background color<input type="color" value={bgColor} onChange={e=>setBgColor(e.target.value)}/></label>}
      <label>Subject size {bgSize}%<input type="range" min="60" max="145" value={bgSize} onChange={e=>setBgSize(+e.target.value)}/></label>
      <label>Horizontal position {bgOffsetX}%<input type="range" min="-40" max="40" value={bgOffsetX} onChange={e=>setBgOffsetX(+e.target.value)}/></label>
      <label>Vertical position {bgOffsetY}%<input type="range" min="-40" max="40" value={bgOffsetY} onChange={e=>setBgOffsetY(+e.target.value)}/></label>
      <label className="studio-bg-checkbox"><input type="checkbox" checked={bgShadow} onChange={e=>setBgShadow(e.target.checked)}/> Soft subject shadow</label>
      <p className="studio-note">To brush-refine, return size to 100% and both positions to 0. Colors, background and shadow appear immediately in the upload preview.</p>
     </>}
    </>:mode==='retouch'?<>
      <label>Healing brush size {brush}px<input type="range" min="5" max="65" value={brush} onChange={e=>setBrush(+e.target.value)}/></label>
      <p className="studio-note">Paint purple over small marks in the After panel, then heal. This is local neighborhood inpainting, not generative person removal.</p>
      <button type="button" className="studio-secondary" disabled={!fileName||working} onClick={clearBrush}>Clear brush selection</button>
    </>:<>
      <label>Noise reduction {denoise}%<input type="range" min="0" max="100" value={denoise} onChange={e=>setDenoise(+e.target.value)}/></label>
      <label>Sharpening {sharpness}%<input type="range" min="0" max="100" value={sharpness} onChange={e=>setSharpness(+e.target.value)}/></label>
      <label htmlFor="photo-tone">Colour treatment</label><select id="photo-tone" value={tint} onChange={e=>setTint(e.target.value as Tint)}>
       <option value="original">Keep original colours</option><option value="sepia">Warm sepia vintage</option>
       <option value="warm">Warm colour grading</option><option value="cool">Cool colour grading</option>
      </select>
      <p className="studio-note">This tool applies photo-processing filters. It does not automatically infer historically accurate clothing or skin colours.</p>
    </>}
    <button type="button" disabled={working||!fileName} onClick={()=>void process()}>{working?'Processing…':NAMES[mode].button}</button>
   </div>
   <div className="studio-panel suite-canvas">
    <div className="studio-work-top"><strong>Additional comparison</strong><span>{dims.w}×{dims.h} px working image</span></div>
    <div className="suite-before-after">
     <div className="suite-preview"><strong>Before · Original</strong>
      <div className="suite-artboard">{originalUrl?<img src={originalUrl} alt="Original photo"/>:<p>Upload an image</p>}</div>
     </div>
     <div className="suite-preview"><strong>{mode==='retouch'&&!resultUrl?'Paint Mask / After':'After · Processed'}</strong>
      <div className={'suite-artboard '+(mode==='background'?'suite-checker':'')}>
       {mode==='retouch'&&fileName&&!resultUrl?<img src={originalUrl} alt="Original image — paint on the upload preview above"/>:
        resultUrl?<img src={resultUrl} alt="Processed image"/>:<p>{fileName?'Select Process to see results':'Your output appears here'}</p>}
      </div>
     </div>
    </div>
    <p className="studio-message" role="status">{status}</p>
   </div>
   <div className="studio-panel suite-advanced">
    <h2>4. Download</h2><StudioQuotaNotice/>
    <div className="studio-plan"><span>STANDARD</span><strong>Free PNG / JPG</strong><p>Download the processed image at working resolution.</p></div>
    <button type="button" disabled={!resultUrl||working} onClick={()=>void standard('png')}>Download PNG</button>
    <button className="studio-secondary" type="button" disabled={!resultUrl||working} onClick={()=>void standard('jpeg')}>Download JPG</button>
    <div className="studio-plan studio-pro"><span>PRO / PREMIUM / MAX</span><strong>HD 2× or 4× Export</strong>
     <p>{mode==='background'?'Transparent PNG (with alpha)':'High-quality JPEG'} on a verified paid plan.</p></div>
    <label htmlFor="suite-hd-scale">Resolution</label>
    <select id="suite-hd-scale" value={scale} onChange={e=>setScale(Number(e.target.value) as 2|4)}><option value={2}>2× HD</option><option value={4}>4× HD</option></select>
    {pro?<button type="button" disabled={!resultUrl||working} onClick={()=>void hd()}>Download Pro HD</button>:
      <Link href="/pricing" className="studio-upgrade">Unlock Pro HD Export →</Link>}
    <StudioUpscalePanel getCanvas={async()=>exportCanvas()} format={mode==='background'?'cutout':'photo'} disabled={!resultUrl} sourceKey={[resultUrl,bgFill,bgColor,bgSize,bgOffsetX,bgOffsetY,bgShadow].join(':')} usageSlug={mode==='background'?'studio-background':mode==='retouch'?'studio-retouch':'studio-restore'}/>
    <p className="studio-note">AI cutout may have imperfect edges. Retouching works best on small marks, and resizing does not reconstruct missing photograph detail.</p>
   </div>
  </div>
 </section>
}
