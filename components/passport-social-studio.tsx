'use client';
import {useEffect,useMemo,useRef,useState,type ChangeEvent,type DragEvent,type PointerEvent} from 'react';
import Link from 'next/link';
import {UploadCloud,Image as ImageIcon,WandSparkles,Printer,RotateCcw,Download,
 Scissors,Crown,ShieldCheck,Move,Settings2,Info,FileText,ZoomIn,ChevronRight} from 'lucide-react';
import {StudioQuotaNotice,reserveStudioUsage,currentStudioQuota} from '@/components/studio-quota';
import {PremiumPlanModal} from '@/components/premium-plan-modal';
import {StudioUpscalePanel} from '@/components/studio-upscale-panel';
import {downloadFile,imageBlob} from '@/lib/studio-suite-client';
import {solidBackgroundCutout} from '@/lib/studio-image-effects';
import {passportPresets,socialPresets,defaultAdjust,outputPixels,printSheetGrid,renderPhoto,
 renderPhotoCanvas,renderSheet,demoPassportCanvas,type PhotoMode,type PhotoAdjust,type PhotoPreset
} from '@/lib/passport-social-engine';
import type {UpscalePlan} from '@/lib/studio-upscale';

const accepted=['image/jpeg','image/png','image/webp'];
type Source={image:CanvasImageSource;width:number;height:number};
type ExportFormat='png'|'jpeg'|'webp';
type PremiumAction='file'|'pdf';
const colors=[
 {name:'White',value:'#ffffff'}, {name:'Light gray',value:'#edf2f7'},
 {name:'Sky blue',value:'#bcd9f1'}, {name:'Warm cream',value:'#f5e8d4'},
 {name:'Deep navy',value:'#182845'}
];
const sourceName='toolnexa-passport-social';
function formatName(format:ExportFormat){return format==='jpeg'?'jpg':format}
function filenameSafe(s:string){return s.replace(/[^a-z0-9-]/gi,'-').slice(0,45).replace(/-+$/,'')||'photo'}
function controlNumber(n:number,min:number,max:number){return Number.isFinite(n)?Math.max(min,Math.min(max,n)):min}
export function PassportSocialStudio(){
 const [mode,setMode]=useState<PhotoMode>('passport');
 const [presetId,setPresetId]=useState('35x45');
 const [customMm,setCustomMm]=useState({w:35,h:45});
 const [customPx,setCustomPx]=useState({w:1080,h:1080});
 const [settings,setSettings]=useState<PhotoAdjust>(defaultAdjust);
 const [format,setFormat]=useState<ExportFormat>('png');
 const [quality,setQuality]=useState(92);
 const [sheet,setSheet]=useState(false);
 const [guide,setGuide]=useState(true);
 const [label,setLabel]=useState('Illustrative sample (not a real person)');
 const [sample,setSample]=useState(true);
 const [sequence,setSequence]=useState(0);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('Try the sample illustration or upload your own JPG, PNG or WebP.');
 const [drag,setDrag]=useState(false);
 const [cutout,setCutout]=useState(false);
 const [plan,setPlan]=useState<UpscalePlan>('Free');
 const [plansOpen,setPlansOpen]=useState(false);
 const [upscaledPreview,setUpscaledPreview]=useState('');
 const srcRef=useRef<Source|null>(null);
 const cutoutRef=useRef<Source|null>(null);
 const uploadUrl=useRef('');
 const canvasRef=useRef<HTMLCanvasElement|null>(null);
 const picker=useRef<HTMLInputElement|null>(null);
 const pointer=useRef<{x:number;y:number;panX:number;panY:number}|null>(null);
 const exportRequested=useRef<PremiumAction>('file');
 const presets=mode==='passport'?passportPresets:socialPresets;
 const chosen=presets.find(item=>item.id===presetId)??presets[0];
 const preset:PhotoPreset=chosen.id==='custom'?{...chosen,w:customMm.w,h:customMm.h}:
  chosen.id==='custom-social'?{...chosen,w:customPx.w,h:customPx.h}:chosen;
 const pixels=useMemo(()=>{
  try{return outputPixels(preset,300)}catch{return {width:0,height:0}}
 },[preset.unit,preset.w,preset.h,preset.id]);
 const sheetGrid=useMemo(()=>printSheetGrid(pixels.width,pixels.height),[pixels.width,pixels.height]);
 const sourceKey=[sequence,mode,presetId,preset.w,preset.h,sheet,settings.zoom,settings.panX,
  settings.panY,settings.brightness,settings.contrast,settings.saturation,settings.rotation,
  settings.color,settings.gradient,cutout].join(':');

 useEffect(()=>{
  srcRef.current={image:demoPassportCanvas(),width:750,height:1000};
  setSequence(n=>n+1);
  let active=true;
  const refresh=()=>{void currentStudioQuota().then(q=>{if(active)setPlan(q.plan)}).catch(()=>{})};
  refresh();
  window.addEventListener('focus',refresh);
  window.addEventListener('toolnexa-subscription-changed',refresh);
  return()=>{active=false;window.removeEventListener('focus',refresh);
   window.removeEventListener('toolnexa-subscription-changed',refresh);
   if(uploadUrl.current)URL.revokeObjectURL(uploadUrl.current)};
 },[]);

 function change<K extends keyof PhotoAdjust>(key:K,value:PhotoAdjust[K]){
  setSettings(prev=>({...prev,[key]:value}));
  setUpscaledPreview('');
 }
 function setStudioMode(next:PhotoMode){
  setMode(next);setPresetId(next==='passport'?'35x45':'igpost');
  setSheet(false);setSettings(prev=>({...prev,panX:0,panY:0,zoom:100,rotation:0,gradient:false}));
  setUpscaledPreview('');
 }
 function selectPreset(id:string){setPresetId(id);setSheet(false);setUpscaledPreview('')}
 async function chooseFile(file?:File){
  if(!file)return;
  if(!accepted.includes(file.type)){setStatus('Choose a JPG, PNG or WebP image.');return}
  if(file.size>10*1024*1024){setStatus('Use a file 10 MB or smaller.');return}
  if(file.size===0){setStatus('The selected file is empty.');return}
  const url=URL.createObjectURL(file),image=new Image();
  image.onload=()=>{
   if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>24000000){
    URL.revokeObjectURL(url);setStatus('Image dimensions must be under 24 megapixels.');return;
   }
   if(uploadUrl.current)URL.revokeObjectURL(uploadUrl.current);
   uploadUrl.current=url;srcRef.current={image,width:image.naturalWidth,height:image.naturalHeight};
   cutoutRef.current=null;setCutout(false);setLabel(file.name);setSample(false);
   setSettings(defaultAdjust);setSequence(n=>n+1);setUpscaledPreview('');
   setStatus('✓ '+file.name+' loaded locally. Pick a size, adjust crop and export.');
  };
  image.onerror=()=>{URL.revokeObjectURL(url);setStatus('Unable to read this image. Try a different JPG, PNG or WebP.');};
  image.src=url;
 }
 function onDrop(event:DragEvent<HTMLElement>){
  event.preventDefault();setDrag(false);void chooseFile(event.dataTransfer.files[0]);
 }
 function input(event:ChangeEvent<HTMLInputElement>){
  void chooseFile(event.currentTarget.files?.[0]);event.currentTarget.value='';
 }
 function selectedSource(){return cutout&&cutoutRef.current?cutoutRef.current:srcRef.current}
 function currentCanvas(ppi=300){
  const source=selectedSource();if(!source)throw Error('Upload an image first.');
  const dims=outputPixels(preset,ppi);
  if(mode==='passport'&&sheet){
   const {canvas}=renderSheet(source.image,source.width,source.height,
    dims.width,dims.height,settings,ppi);
   return canvas;
  }
  return renderPhotoCanvas(source.image,source.width,source.height,dims.width,dims.height,
   settings,mode,!!cutoutRef.current);
 }
 // Always render previews at a small size; never allocate a full 4K canvas
 // while the user drags/zooms on a mobile device.
 useEffect(()=>{
  const element=canvasRef.current,source=selectedSource();
  if(!element||!source||!pixels.width||!pixels.height)return;
  const target=mode==='passport'&&sheet?{width:288,height:432}:(()=>{
   const r=Math.min(1,640/Math.max(pixels.width,pixels.height));
   return {width:Math.max(1,Math.round(pixels.width*r)),height:Math.max(1,Math.round(pixels.height*r))};
  })();
  element.width=target.width;element.height=target.height;
  const ctx=element.getContext('2d');
  if(!ctx)return;
  if(mode==='passport'&&sheet){
   try{
    const low=outputPixels(preset,72);
    const rendered=renderSheet(source.image,source.width,source.height,low.width,low.height,
     settings,72);
    ctx.drawImage(rendered.canvas,0,0,target.width,target.height);
    rendered.canvas.width=0;rendered.canvas.height=0;
   }catch{ctx.fillStyle='#263049';ctx.fillRect(0,0,target.width,target.height)}
  }else{
   renderPhoto(ctx,source.image,source.width,source.height,target.width,target.height,settings,mode,cutout);
   if(guide&&mode==='passport'){
    ctx.save();ctx.strokeStyle='#28d9edbc';ctx.lineWidth=1.5;
    ctx.setLineDash([7,6]);ctx.beginPath();ctx.ellipse(target.width*.5,target.height*.41,
     target.width*.26,target.height*.32,0,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(target.width*.1,target.height*.44);
    ctx.lineTo(target.width*.9,target.height*.44);ctx.stroke();ctx.restore();
   }
  }
 },[sequence,mode,preset.id,preset.w,preset.h,sheet,pixels.width,pixels.height,
  settings,cutout,guide]);

 function pointerDown(e:PointerEvent<HTMLCanvasElement>){
  pointer.current={x:e.clientX,y:e.clientY,panX:settings.panX,panY:settings.panY};
  e.currentTarget.setPointerCapture(e.pointerId);
 }
 function pointerMove(e:PointerEvent<HTMLCanvasElement>){
  if(!pointer.current)return;
  const box=e.currentTarget.getBoundingClientRect();
  if(!box.width||!box.height)return;
  const {x,y,panX,panY}=pointer.current;
  setSettings(prev=>({...prev,
   panX:controlNumber(Math.round(panX+(e.clientX-x)/box.width*150),-100,100),
   panY:controlNumber(Math.round(panY+(e.clientY-y)/box.height*150),-100,100)}));
  setUpscaledPreview('');
 }
 async function removeBackground(kind:'ai'|'solid'){
  if(busy||!srcRef.current)return;
  setBusy(true);setStatus(kind==='ai'?'Loading on-device AI background removal…':'Removing a flat/solid backdrop…');
  try{
   const original=srcRef.current;
   const scale=Math.min(1,1150/Math.max(original.width,original.height));
   const w=Math.round(original.width*scale),h=Math.round(original.height*scale);
   const small=document.createElement('canvas');small.width=w;small.height=h;
   const context=small.getContext('2d');if(!context)throw Error('Cannot read image pixels.');
   context.drawImage(original.image,0,0,w,h);
   await reserveStudioUsage('studio-passport-social');
   let output:HTMLCanvasElement;
   if(kind==='ai'){
    const {aiCutout}=await import('@/lib/studio-bg-ai');
    output=await aiCutout(small,setStatus);
   }else output=solidBackgroundCutout(small,65,2);
   small.width=0;small.height=0;
   cutoutRef.current={image:output,width:output.width,height:output.height};
   setCutout(true);setSequence(n=>n+1);setUpscaledPreview('');
   setStatus('✓ Background separated locally. White, gray, blue and cream colors now appear behind the subject. Inspect hair edges before export.');
  }catch(err){setStatus(err instanceof Error?err.message:'Could not separate background. Try the offline solid-color option.')}
  finally{setBusy(false)}
 }
 function reset(){
  setSettings(defaultAdjust);setGuide(true);setSheet(false);setUpscaledPreview('');
  setStatus('Crop, colors and adjustments reset. Your photo is still selected.');
 }
 function restoreOriginal(){
  cutoutRef.current=null;setCutout(false);setSequence(n=>n+1);setUpscaledPreview('');
  setStatus('Original image background restored.');
 }
 async function prepareExport(ppi:number){
  const source=selectedSource();if(!source)throw Error('Choose an image first');
  const canvas=currentCanvas(ppi);
  const mime='image/'+format;
  const blob=await imageBlob(canvas,mime,quality/100);
  if(blob.type!==mime)throw Error('This browser cannot export '+format.toUpperCase()+'. Select JPG or PNG instead.');
  const width=canvas.width,height=canvas.height;
  canvas.width=0;canvas.height=0;
  return {blob,width,height};
 }
 async function standardDownload(){
  if(busy)return;
  setBusy(true);setStatus('Preparing standard quality file…');
  try{
   await reserveStudioUsage('studio-passport-social');
   const result=await prepareExport(300);
   downloadFile(result.blob,sourceName+'-'+mode+'-'+filenameSafe(preset.id)+(sheet?'-4x6-sheet':'')+
    '.'+formatName(format));
   setStatus('✓ '+result.width+' × '+result.height+' px '+format.toUpperCase()+' downloaded. Free/paid standard export uses one daily tool run.');
  }catch(err){setStatus(err instanceof Error?err.message:'Standard export failed.')}
  finally{setBusy(false)}
 }
 async function proExport(action:PremiumAction){
  if(busy)return;
  exportRequested.current=action;setBusy(true);setStatus('Checking your verified Pro or higher PayPal membership…');
  try{
   const response=await fetch('/api/studio/upscale-authorize',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({resolution:'4k',purpose:'download'})
   });
   const json=await response.json().catch(()=>({error:'Unable to verify subscription'})) as {
    error?:string;authorized?:boolean;plan?:UpscalePlan
   };
   if(response.status===401||response.status===403){
    setPlansOpen(true);setStatus('Full-resolution 600-PPI print / 2× social export needs Pro, Premium or Max. Preview stays here.');
    return;
   }
   if(!response.ok||json.authorized!==true)throw Error(json.error||'Could not verify the active PayPal plan.');
   if(json.plan)setPlan(json.plan);
   setPlansOpen(false);
   await reserveStudioUsage('studio-passport-social');
   if(action==='pdf'){
    if(mode!=='passport'||!sheet)throw Error('Select Passport mode and enable 4 × 6 print sheet to export a print PDF.');
    const canvas=currentCanvas(600);
    setStatus('Preparing true 4 × 6 inch PDF at 600 PPI…');
    const {jsPDF}=await import('jspdf');
    const pdf=new jsPDF({unit:'in',format:[4,6],orientation:'portrait'});
    pdf.addImage(canvas.toDataURL('image/jpeg',.94),'JPEG',0,0,4,6);
    pdf.save(sourceName+'-4x6-print-sheet-600ppi.pdf');
    canvas.width=0;canvas.height=0;
    setStatus('✓ Premium 4 × 6 inch PDF generated at 600 PPI. Use 100% / actual-size printing.');
   }else{
    const res=await prepareExport(mode==='passport'?600:300);
    // Social sizes double their intended size for the Pro export; passport
    // documents use an actual 600-PPI pixel grid rather than an arbitrary 2×.
    if(mode==='social'){
     const source=selectedSource()!;
     const image=renderPhotoCanvas(source.image,source.width,source.height,
       pixels.width*2,pixels.height*2,settings,mode,cutout);
     const mime='image/'+format;
     const blob=await imageBlob(image,mime,quality/100);
     if(blob.type!==mime)throw Error('This browser does not support '+format.toUpperCase()+' export.');
     image.width=0;image.height=0;
     downloadFile(blob,sourceName+'-social-'+preset.id+'-pro-2x.'+formatName(format));
     setStatus('✓ Pro 2× social image exported. Some platforms will rescale uploaded artwork.');
    }else{
     downloadFile(res.blob,sourceName+'-passport-'+preset.id+'-600ppi.'+formatName(format));
     setStatus('✓ Pro passport print export generated at 600 PPI pixel dimensions.');
    }
   }
  }catch(err){setStatus(err instanceof Error?err.message:'Premium export failed.')}
  finally{setBusy(false)}
 }

 const isSheet=mode==='passport'&&sheet;
 const fullSize=isSheet?'1200 × 1800':pixels.width+' × '+pixels.height;
 const sheetFits=sheetGrid.count>0;
 return <main className="ps-page">
  <header className="ps-hero">
   <div><span className="studio-eyebrow">✦ TOOLNEXA AI · PRO+ CREATOR STUDIO</span>
    <h1>AI Passport <span>&amp;</span> Social Size Studio</h1>
    <p>One photo, every important size. Crop by touch, refine your image, prepare real print layouts and export platform-ready images.</p>
    <div className="ps-hero-chips"><span>12 Social presets</span><span>300 / 600 PPI print</span>
     <span>Real local background removal</span><span>Secure Pro HD</span></div>
   </div>
   <Link href="/pricing" className="ps-plan-link"><Crown size={17}/> Unlock Pro exports <ChevronRight size={16}/></Link>
  </header>
  <StudioQuotaNotice/>
  <div className="ps-grid">
   <section className="studio-panel ps-controls" aria-label="Passport and Social editing controls">
    <div className="ps-panel-title"><strong>01</strong><h2>Choose photo format</h2></div>
    <div className="ps-mode-tabs" role="tablist" aria-label="Choose Studio mode">
     <button role="tab" type="button" aria-selected={mode==='passport'} className={mode==='passport'?'active':''}
      onClick={()=>setStudioMode('passport')}><FileText size={17}/> Passport / ID</button>
     <button role="tab" type="button" aria-selected={mode==='social'} className={mode==='social'?'active':''}
      onClick={()=>setStudioMode('social')}><ImageIcon size={17}/> Social Media</button>
    </div>
    <div className="ps-preset-title"><strong>Target dimensions</strong><span>{presets.length} presets</span></div>
    <div className="ps-presets" role="group" aria-label="Select a size preset">
     {presets.map(item=><button key={item.id} type="button" aria-pressed={presetId===item.id}
      className={presetId===item.id?'active':''} onClick={()=>selectPreset(item.id)}>
      <strong>{item.name}</strong><small>{item.detail}</small>
     </button>)}
    </div>
    {presetId==='custom'&&mode==='passport'&&<div className="ps-custom-dims">
     {(['w','h'] as const).map(axis=><label key={axis}>Custom {axis==='w'?'width':'height'} (mm)
      <input type="number" min={15} max={150} step="0.5" value={customMm[axis]}
       onChange={e=>{setCustomMm(p=>({...p,[axis]:controlNumber(Number(e.target.value),15,150)}));setUpscaledPreview('')}}/>
     </label>)}
    </div>}
    {presetId==='custom-social'&&mode==='social'&&<div className="ps-custom-dims">
     {(['w','h'] as const).map(axis=><label key={axis}>Custom {axis==='w'?'width':'height'} (px)
      <input type="number" min={128} max={4096} step={1} value={customPx[axis]}
       onChange={e=>{setCustomPx(p=>({...p,[axis]:Math.round(controlNumber(Number(e.target.value),128,4096))}));setUpscaledPreview('')}}/>
     </label>)}
    </div>}
    <div className="ps-panel-title ps-section-divider"><strong>02</strong><h2>Upload &amp; position</h2></div>
    <div className={'ps-drop '+(drag?'dragging':'')} onDragOver={e=>{e.preventDefault();setDrag(true)}}
      onDragLeave={()=>setDrag(false)} onDrop={onDrop}>
     <UploadCloud size={30}/>
     <strong>{sample?'Try with the sample portrait':label}</strong><span>JPG · PNG · WebP · max 10 MB</span>
     <button type="button" onClick={()=>picker.current?.click()} disabled={busy}>+ Choose image</button>
     <input ref={picker} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={input}/>
    </div>
    <div className="ps-controls-head"><strong>Photo adjustments</strong>
     <button type="button" className="ps-small-reset" onClick={reset} disabled={busy}><RotateCcw size={15}/> Reset</button>
    </div>
    {([
     ['zoom','Zoom',100,260,'%'],['brightness','Brightness',60,150,'%'],
     ['contrast','Contrast',60,160,'%'],['saturation','Saturation',0,200,'%'],
     ['rotation','Rotation',-20,20,'°'],['panX','Move horizontally',-100,100,'%'],
     ['panY','Move vertically',-100,100,'%']
    ] as const).map(([key,title,min,max,unit])=><label className="ps-slider" key={key}>
     <span><strong>{title}</strong><small>{settings[key]}{unit}</small></span>
     <input type="range" min={min} max={max} step={key==='rotation'?1:2} value={settings[key]}
      onChange={e=>change(key,Number(e.target.value))}/>
    </label>)}
    <div className="ps-panel-title ps-section-divider"><strong>03</strong><h2>Background &amp; cleanup</h2></div>
    <p className="ps-note">Background swatches replace the original backdrop only after real AI/offline cutout succeeds.</p>
    <div className="ps-background-swatches">
     {colors.map(item=><button type="button" key={item.value} title={item.name}
      aria-label={item.name+' background'} aria-pressed={settings.color===item.value}
      className={settings.color===item.value?'active':''}
      style={{backgroundColor:item.value}} onClick={()=>change('color',item.value)}/>)}
    </div>
    {mode==='social'&&<label className="ps-check">
     <input type="checkbox" checked={settings.gradient}
      onChange={e=>change('gradient',e.target.checked)}/> Gradient social background
    </label>}
    <div className="ps-action-pair">
     <button type="button" onClick={()=>void removeBackground('ai')} disabled={busy}>
      <WandSparkles size={15}/> AI Remove BG
     </button>
     <button type="button" onClick={()=>void removeBackground('solid')} disabled={busy}>
      <Scissors size={15}/> Offline Flat BG
     </button>
    </div>
    {cutout&&<button type="button" className="ps-restore-original" onClick={restoreOriginal}>↶ Restore original background</button>}
    {mode==='passport'&&<div className="ps-passport-extras">
     <label className="ps-check"><input type="checkbox" checked={guide} onChange={e=>setGuide(e.target.checked)}/>
      Show face positioning guide (preview only)</label>
     <label className="ps-check"><input type="checkbox" checked={sheet}
      onChange={e=>{setSheet(e.target.checked);setUpscaledPreview('')}}/>
      <Printer size={16}/> 4 × 6 inch photo print sheet</label>
     {sheet&&<p className="ps-note">{sheetFits?sheetGrid.count+' full-size copies fit on a 4 × 6 sheet at 300 PPI.':
      'This passport size does not fit on a 4 × 6 inch sheet at true physical scale. Choose a smaller size.'}</p>}
    </div>}
   </section>
   <section className="studio-panel ps-preview-panel" aria-label="Real-time photo preview and export">
    <div className="ps-preview-top"><div><span className="ps-preview-eyebrow">◉ LIVE PREVIEW</span>
     <h2>Crop &amp; export preview</h2></div><span className="ps-preview-label">BROWSER LOCAL</span></div>
    <div className="ps-preview-toolbar">
     <span><Move size={14}/> Drag photo to reposition</span><span><ZoomIn size={14}/> Up to 260% zoom</span>
    </div>
    <div className="ps-preview-stage">
     {upscaledPreview?<img className="ps-result-image" src={upscaledPreview} alt="Watermarked upscaled export preview"/>:
      <canvas ref={canvasRef} className="ps-preview-canvas" aria-label="Editable photo crop preview"
       style={{touchAction:'none',cursor:'grab'}}
       onPointerDown={pointerDown} onPointerMove={pointerMove}
       onPointerUp={()=>{pointer.current=null}} onPointerCancel={()=>{pointer.current=null}}/>}
     {sample&&<span className="ps-demo-watermark">DEMO PORTRAIT</span>}
     {upscaledPreview&&<button type="button" className="ps-back-edit"
      onClick={()=>setUpscaledPreview('')}>↶ Back to editor</button>}
    </div>
    <div className="ps-output-summary">
     <span><strong>{isSheet?'4 × 6 print sheet':preset.name}</strong><small>{mode==='passport'?'Example size · check official requirements':'Platform sizes are editable presets'}</small></span>
     <span className="ps-output-pixels">{fullSize} px</span>
    </div>
    <div className="ps-status-metrics"><div><small>Mode</small><strong>{mode==='passport'?'ID Photo':'Social'}</strong></div>
     <div><small>Print density</small><strong>{mode==='passport'?'300 PPI':'Digital'}</strong></div>
     <div><small>Export</small><strong>{format==='jpeg'?'JPG':format.toUpperCase()}</strong></div></div>
    <div className="ps-export">
     <div className="ps-panel-title"><strong>04</strong><h2>Download &amp; print</h2></div>
     <div className="ps-format-toggle" role="group" aria-label="Select export format">
      {(['png','jpeg','webp'] as const).map(value=><button type="button" key={value}
       className={format===value?'active':''} aria-pressed={format===value}
       onClick={()=>setFormat(value)}>{value==='jpeg'?'JPG':value.toUpperCase()}</button>)}
     </div>
     {format!=='png'&&<label className="ps-slider"><span><strong>Compression quality</strong><small>{quality}%</small></span>
      <input type="range" min={60} max={100} step={2} value={quality} onChange={e=>setQuality(+e.target.value)}/></label>}
     <button className="ps-download-standard" disabled={busy||!pixels.width||!pixels.height||(isSheet&&!sheetFits)}
      type="button" onClick={()=>void standardDownload()}><Download size={18}/>
      {busy?'Processing…':'Download '+(isSheet?'4×6 Print Sheet':'Standard Image')}</button>
     <div className="ps-pro-divider"><Crown size={16}/><strong>Premium Print &amp; Creator Export</strong></div>
     <div className="ps-pro-actions">
      <button type="button" disabled={busy||!pixels.width||!pixels.height||(isSheet&&!sheetFits)}
       onClick={()=>void proExport('file')}>{mode==='passport'?'600 PPI Pro '+(sheet?'Sheet':'Photo'):'2× Social Pro'}</button>
      {mode==='passport'&&<button type="button" disabled={busy||!sheet||!sheetFits}
       onClick={()=>void proExport('pdf')}><FileText size={16}/> 600 PPI Print PDF</button>}
     </div>
     <p className="ps-note">Standard downloads use your shared daily tool allowance. Premium files require a verified Pro, Premium or Max subscription; no automatic compliance or photo acceptance is guaranteed.</p>
     <p className="ps-export-status" role="status" aria-live="polite">{status}</p>
    </div>
    <details className="ps-upscale-details">
     <summary><Settings2 size={18}/> Advanced HD / 4K / 8K Upscaler <ChevronRight size={15}/></summary>
     <StudioUpscalePanel getCanvas={async()=>currentCanvas(300)} disabled={!pixels.width||!pixels.height}
       format="photo" usageSlug="studio-passport-social" sourceKey={sourceKey} enableAI
       onPreviewChange={setUpscaledPreview}/>
    </details>
    <p className="ps-guidance"><Info size={15}/> Passport/visa specifications vary by country and document. This editor does not verify head size, pose, eyes, lighting, printed DPI metadata or government acceptance.</p>
    <p className="ps-guidance"><ShieldCheck size={15}/> Photo pixels stay in your browser. AI cutout downloads a browser model on its first use; PayPal membership checks do not upload your photo.</p>
   </section>
  </div>
  <PremiumPlanModal open={plansOpen} onClose={()=>setPlansOpen(false)}
   feature={mode==='passport'?'600-PPI passport print export':'2× social media export'}
   requiredTier="Pro" currentPlan={plan} busy={busy}
   onRetry={()=>void proExport(exportRequested.current)}/>
 </main>;
}
