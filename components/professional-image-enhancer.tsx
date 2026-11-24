'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {StudioUpscalePanel} from '@/components/studio-upscale-panel';
import {StudioQuotaNotice} from '@/components/studio-quota';
import {StudioUploadPreview} from '@/components/studio-upload-preview';
import {enhancePhotoCanvas,photoPresets,type PhotoSettings,type PhotoPreset} from '@/lib/studio-photo-enhance';

const MAX_IMAGE=10*1024*1024;
const presets:{key:PhotoPreset;label:string;subtitle:string}[]=[
 {key:'natural',label:'Photo',subtitle:'Natural details'},
 {key:'portrait',label:'Portrait',subtitle:'Smooth skin tones'},
 {key:'product',label:'Product',subtitle:'Clean product edges'},
 {key:'logo',label:'Graphic',subtitle:'Crisper artwork'},
 {key:'old',label:'Old photo',subtitle:'Reduce grain'}
];
export function ProfessionalImageEnhancer(){
 const sourceRef=useRef<HTMLImageElement|null>(null);
 const [imageUrl,setImageUrl]=useState('');
 const [previewUrl,setPreviewUrl]=useState('');
 const [fileName,setFileName]=useState('');
 const [dimensions,setDimensions]=useState({width:0,height:0});
 const [preset,setPreset]=useState<PhotoPreset>('natural');
 const [settings,setSettings]=useState<PhotoSettings>(photoPresets.natural);
 const [compare,setCompare]=useState(55);
 const [status,setStatus]=useState('Upload a photo to start enhancing.');
 const [previewLoading,setPreviewLoading]=useState(false);
 const previewSeq=useRef(0);
 useEffect(()=>()=>{if(imageUrl)URL.revokeObjectURL(imageUrl)},[imageUrl]);
 useEffect(()=>()=>{if(previewUrl)URL.revokeObjectURL(previewUrl)},[previewUrl]);
 useEffect(()=>{
  if(!imageUrl){sourceRef.current=null;return}
  const image=new Image();
  image.onload=()=>{
   if(image.naturalWidth>4000||image.naturalHeight>4000){
    sourceRef.current=null;setStatus('Maximum supported image dimensions: 4000 × 4000 px.');
    setDimensions({width:0,height:0});return;
   }
   sourceRef.current=image;
   setDimensions({width:image.naturalWidth,height:image.naturalHeight});
   setStatus('Image ready. Compare the enhancement and choose 2× / 4× / 4K / 8K.');
  };
  image.onerror=()=>{sourceRef.current=null;setDimensions({width:0,height:0});setStatus('Image cannot be decoded. Try another file.')};
  image.src=imageUrl;
  return()=>{image.onload=null;image.onerror=null;sourceRef.current=null};
 },[imageUrl]);
 useEffect(()=>{
  const image=sourceRef.current;
  const seq=++previewSeq.current;
  if(!image||dimensions.width===0){setPreviewUrl('');return}
  setPreviewLoading(true);
  const timer=window.setTimeout(()=>{
   void (async()=>{
    try{
     const canvas=enhancePhotoCanvas(image,settings,700);
     const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Preview rendering failed')),'image/jpeg',.88));
     canvas.width=0;canvas.height=0;
     if(previewSeq.current!==seq)return;
     setPreviewUrl(URL.createObjectURL(blob));
     setPreviewLoading(false);
    }catch(e){if(previewSeq.current===seq){setPreviewLoading(false);setStatus(e instanceof Error?e.message:'Unable to preview the enhancement')}}
   })();
  },130);
  return()=>{window.clearTimeout(timer);previewSeq.current+=1};
 },[imageUrl,dimensions.width,dimensions.height,settings]);
 function chooseFile(file?:File){
  if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){setStatus('Choose a JPG, PNG or WebP image.');return}
  if(file.size>MAX_IMAGE){setStatus('Maximum upload size is 10 MB.');return}
  sourceRef.current=null;setDimensions({width:0,height:0});setPreviewUrl('');
  setFileName(file.name);setImageUrl(URL.createObjectURL(file));setCompare(55);
  setStatus('Opening '+file.name+'…');
 }
 function smartAutoEnhance(){
  const img=sourceRef.current;
  if(!img){setStatus('Upload an image first to run smart auto enhance.');return}
  const sample=document.createElement('canvas');sample.width=96;sample.height=96;
  const ctx=sample.getContext('2d',{willReadFrequently:true});
  if(!ctx){choosePreset('natural');return}
  ctx.drawImage(img,0,0,96,96);
  const pix=ctx.getImageData(0,0,96,96).data;
  let sum=0,sq=0,n=0;
  for(let i=0;i<pix.length;i+=4){
   const v=.2126*pix[i]+.7152*pix[i+1]+.0722*pix[i+2];
   sum+=v;sq+=v*v;n++;
  }
  const avg=sum/Math.max(1,n);
  const deviation=Math.sqrt(Math.max(0,sq/Math.max(1,n)-avg*avg));
  const brightness=Math.max(82,Math.min(132,Math.round(100*130/Math.max(45,avg))));
  const contrast=Math.max(95,Math.min(125,Math.round(120-deviation*.19)));
  setPreset('natural');
  setSettings({...photoPresets.natural,brightness,contrast,
   denoise:deviation<35?24:12,sharpness:deviation<35?39:28});
  setStatus('Auto Enhance analysed the image exposure and contrast. Compare results above and fine-tune.');
 }
 function choosePreset(value:PhotoPreset){
  setPreset(value);setSettings(photoPresets[value]);setStatus('Applied '+presets.find(p=>p.key===value)?.label+' enhancement preset.');
 }
 function updateSetting(key:keyof PhotoSettings,value:number){
  setSettings(previous=>({...previous,[key]:value}));
 }
 async function processedCanvas(){
  const image=sourceRef.current;
  if(!image||!dimensions.width)throw Error('Upload a valid photo first.');
  return enhancePhotoCanvas(image,settings,900);
 }
 const loaded=dimensions.width>0;
 const sourceKey=[imageUrl,settings.brightness,settings.contrast,settings.saturation,settings.denoise,settings.sharpness,settings.warmth].join(':');
 return <div className="photo-enhance-page">
  <header className="photo-enhance-hero">
   <span className="studio-eyebrow">TOOLNEXA AI · CREATOR STUDIO</span>
   <h1>AI Detail Enhancer &amp; Image Upscaler</h1>
   <p>Upload a photo, improve sharpness and colours, compare before and after, and upscale to 2×, 4×, 4K or 8K. Preview using your Free daily runs; subscribe to download full resolution.</p>
   <div className="photo-enhance-features"><span>✓ JPG · PNG · WebP</span><span>✓ AI detail option</span><span>✓ Up to 8K</span><span>✓ Before / After</span></div>
  </header>
  <div className="photo-enhance-layout">
   <section className="studio-panel photo-enhance-input">
    <div className="photo-enhance-step"><span>01</span><div><h2>Upload Image</h2><p>Start with a photo from your device</p></div></div>
    <StudioUploadPreview id="photo-enhance-input" accept="image/jpeg,image/png,image/webp"
      name={fileName} sourceUrl={loaded?imageUrl:''} outputUrl={previewUrl}
      onFile={chooseFile} hint="JPG · PNG · WebP · up to 10 MB" busy={previewLoading}
      beforeLabel="Original" afterLabel="Enhanced" onReset={()=>choosePreset('natural')}/>
    {fileName&&<p className="photo-upload-meta">{fileName} {loaded?'· '+dimensions.width+' × '+dimensions.height+' px':''}</p>}
    <div className="photo-enhance-step photo-enhance-second"><span>02</span><div><h2>Enhance Photo</h2><p>Fine-tune for better clarity</p></div></div>
    <div className="photo-preset-grid">
     {presets.map(item=><button key={item.key} type="button" className={preset===item.key?'photo-preset selected':'photo-preset'}
       onClick={()=>choosePreset(item.key)} aria-pressed={preset===item.key} title={item.subtitle}>{item.label}</button>)}
    </div>
    <button type="button" className="photo-auto-enhance" onClick={smartAutoEnhance}>
     ✨ Auto Enhance — Recommended
    </button>
    <div className="photo-enhance-adjustments">
     {([
       ['brightness','Brightness',70,145],
       ['contrast','Contrast',75,165],
       ['saturation','Colour',70,160],
       ['denoise','Reduce Noise',0,75],
       ['sharpness','Sharpen Details',0,85],
       ['warmth','Warmth / Temperature',-40,40]
      ] as const).map(([key,label,min,max])=><label key={key} htmlFor={'photo-adjust-'+key}>
       <span>{label}<b>{settings[key]}{key==='denoise'||key==='sharpness'?'':key==='warmth'?'°':'%'}</b></span>
       <input id={'photo-adjust-'+key} type="range" min={min} max={max} value={settings[key]}
        onChange={e=>updateSetting(key,+e.currentTarget.value)} />
      </label>)}
    </div>
    <div className="studio-premium-actions">
     <button type="button" className="studio-secondary" onClick={()=>choosePreset('natural')}>↶ Reset adjustments</button>
     <button type="button" className="studio-secondary" onClick={smartAutoEnhance} disabled={!loaded}>✦ Analyze exposure</button>
    </div>
   </section>
   <div className="photo-enhance-preview-group">
    <section className="studio-panel photo-enhance-preview-panel">
     <div className="studio-work-top"><strong>Before / After Image Preview</strong><span>{previewLoading?'Enhancing preview…':loaded?'Ready to compare':'No image selected'}</span></div>
     <div className="photo-compare">
      {imageUrl&&loaded?<><img className="photo-compare-original" src={imageUrl} alt="Original uploaded photo"/>
       {previewUrl&&<img className="photo-compare-after" src={previewUrl} alt="Enhanced colour and sharpness preview"
        style={{clipPath:'inset(0 '+(100-compare)+'% 0 0)'}}/>}
       <div className="photo-compare-line" style={{left:compare+'%'}} aria-hidden="true"><span>◀ ▶</span></div>
       <span className="photo-before-label">Original</span><span className="photo-after-label">Enhanced</span>
       <input className="photo-compare-range" type="range" min="0" max="100" value={compare}
        onChange={e=>setCompare(+e.currentTarget.value)} aria-label="Drag to compare original and enhanced photos"/>
      </>:<div className="photo-compare-empty"><span aria-hidden="true">✦</span><strong>Your image preview</strong>
       <p>Upload a photo to see the original and enhanced version side by side.</p></div>}
     </div>
     <p role="status" className="studio-message">{status}</p>
     <p className="studio-note">Preview uses local photo filters. Select <strong>AI Detail</strong> below for an additional trained neural super-resolution pass when your device supports it.</p>
    </section>
    <section className="studio-panel photo-enhance-upscale">
     <div className="photo-enhance-step"><span>03</span><div><h2>Upscale &amp; Download</h2>
      <p>Generate the result first; payment is checked only for the full-size download</p></div></div>
     <StudioQuotaNotice/>
     <StudioUpscalePanel getCanvas={processedCanvas} format="photo" disabled={!loaded}
       sourceKey={sourceKey} usageSlug="studio-enhance" enableAI/>
    </section>
   </div>
  </div>
  <p className="photo-enhance-footnote">
   Neural AI Detail runs in your browser on a limited-size image, with a trained 2× model; further enlargement to 4K/8K uses interpolation.
   A fast Classic mode is available when model downloading or GPU processing is not practical. No setting can guarantee restoration of unknown original details.
   <Link href="/pricing"> View download plans</Link>
  </p>
 </div>;
}
