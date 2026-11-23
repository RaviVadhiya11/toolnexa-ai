'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import type {Tool} from '@/lib/tools';
import {dailyLimits,isUsagePlan,quotaKey,readUsage,consumeUsage,type UsagePlan} from '@/lib/usage-limits';
import {ageReport,colorConvert,csvToJson,dateDifferenceReport,emiReport,jwtReport,parseYoutubeId,regexReport,socialSuggestions,textDiff,textSort,timestampReport} from '@/lib/advanced-operations';
import {processAdvancedPdf,type GeneratedFile} from '@/lib/advanced-file-ops';
import {processAdvancedImage} from '@/lib/advanced-image-ops';
import {generateBusinessPdf} from '@/lib/advanced-document-ops';

const PDF_TOOLS=new Set(['pdf-compressor','rotate-pdf','pdf-watermark','pdf-page-numbers','reorder-pdf','delete-pdf-pages','protect-pdf','pdf-metadata']);
const IMAGE_TOOLS=new Set(['image-compressor','image-cropper','background-remover','image-watermark','image-to-base64','color-picker','passport-photo-maker','aspect-ratio-resizer','image-flipper']);
const DOC_TOOLS=new Set(['invoice-generator','quotation-maker','resume-builder']);
const TEXTAREA_TOOLS=new Set(['html-formatter','css-minifier','javascript-minifier','regex-tester','jwt-decoder','sql-formatter','csv-to-json','text-sorter','text-compare','ai-title-hashtag-generator','invoice-generator','quotation-maker','resume-builder']);
const BINARY_TOOLS=new Set([...PDF_TOOLS,...IMAGE_TOOLS,...DOC_TOOLS,'youtube-thumbnail-downloader']);
type Q={plan:UsagePlan;used:number;limit:number|null;mode:'browser'|'account';key:string};
function download(blob:Blob,name:string){
 const url=URL.createObjectURL(blob),anchor=document.createElement('a');
 anchor.href=url;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),15000);
}
function recent(slug:string){
 try{const old=JSON.parse(localStorage.getItem('toolnexa-recent')||'[]') as string[];
 localStorage.setItem('toolnexa-recent',JSON.stringify([slug,...old.filter(x=>x!==slug)].slice(0,10)))}catch{}
}
function logUsage(slug:string){void fetch('/api/usage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug}),keepalive:true}).catch(()=>{});}
const dateToday=()=>new Date().toISOString().slice(0,10);
const SELECTS:Record<string,[string,string][]>={
 'rotate-pdf':[['90','90° clockwise'],['180','180°'],['270','270° clockwise']],
 'pdf-metadata':[['view','View existing information'],['update','Update title and author']],
 'image-compressor':[['jpeg','JPG'],['webp','WebP']],
 'image-flipper':[['horizontal','Flip horizontal'],['vertical','Flip vertical'],['rotate180','Rotate 180°']],
 'aspect-ratio-resizer':[['9:16','9:16 — Shorts / Reels'],['16:9','16:9 — YouTube landscape'],['1:1','1:1 — Square'],['4:5','4:5 — Instagram portrait']],
 'ai-title-hashtag-generator':[['YouTube','YouTube'],['Instagram','Instagram'],['TikTok','TikTok'],['LinkedIn','LinkedIn']],
 'text-sorter':[['unique','Sort + remove duplicates'],['keep','Sort and keep duplicate lines']]
};
const HELP:Record<string,string>={
 'pdf-compressor':'Optimizes PDF structure losslessly, without reducing image resolution. It may not make already optimized PDFs smaller.',
 'rotate-pdf':'Optional page numbers separated by commas; leave blank to rotate every page.',
 'reorder-pdf':'Example for a three-page PDF: 3,1,2. Enter every page exactly once.',
 'delete-pdf-pages':'Example: 2,4. At least one page must remain.',
 'protect-pdf':'AES-256 password protection is performed in your browser. Save your password separately.',
 'image-cropper':'Enter pixel coordinates X,Y,Width,Height (e.g. 0,0,500,500).',
 'background-remover':'For white, green-screen or other single-color backgrounds. Enter #RRGGBB or leave blank to sample top-left pixel. Not AI scene segmentation.',
 'color-picker':'X and Y are percentages into your image (0–100). 50 / 50 picks its center.',
 'passport-photo-maker':'Creates a 35 × 45 mm print sheet (A4). The image is center-cropped; check the country-specific photo rules.',
 'image-to-base64':'Small files only: Base64 grows approximately 33% and is designed for inline data.',
 'aspect-ratio-resizer':'Choose a portrait Reel, landscape video, square or Instagram portrait aspect ratio. Output width is 100–4000 px.',
 'invoice-generator':'Each line must be: Description | Quantity | Unit Price. The PDF uses INR currency; provide tax percentage separately.',
 'quotation-maker':'Each line must be: Description | Quantity | Unit Price. The PDF uses INR currency; provide tax percentage separately.',
 'resume-builder':'One line per section, e.g. Email: ..., Skills: ..., Experience: ... . Keep it concise for one A4 page.',
 'youtube-thumbnail-downloader':'Uses only public YouTube video thumbnail images; maximum available resolution varies by video. Download only when permitted.',
 'ai-title-hashtag-generator':'Generates useful smart offline suggestions locally. This is not a generative AI model; an AI service must be configured separately.',
 'jwt-decoder':'Decodes JWT segments without verifying cryptographic signatures. Never paste real bearer tokens from production accounts.',
 'regex-tester':'Use short patterns and small test text. Complex regexes may freeze a browser; avoid untrusted catastrophic patterns.'
};
const PRIMARY_HINT:Record<string,[string,string]>={
 'rotate-pdf':['Pages to rotate (optional)','1,3,5'],
 'pdf-watermark':['Watermark text','DRAFT'],
 'pdf-page-numbers':['Starting page number','1'],
 'reorder-pdf':['New page order','3,1,2'],
 'delete-pdf-pages':['Pages to delete','2,4'],
 'protect-pdf':['Open password (8+ characters)','Enter password'],
 'pdf-metadata':['PDF title (when updating)','My document'],
 'image-compressor':['Quality (20–95%)','75'],
 'image-cropper':['Crop region: x,y,width,height','0,0,500,500'],
 'background-remover':['Background HEX (optional)','#FFFFFF'],
 'image-watermark':['Watermark text','My Brand'],
 'color-picker':['X position (%)','50'],
 'aspect-ratio-resizer':['Output width (px)','1080'],
 'regex-tester':['Regex pattern (without slashes)','\\w+'],
 'hex-rgb-converter':['HEX or RGB color','#0D6EFD'],
 'timestamp-converter':['Unix seconds / milliseconds or ISO time','2026-11-23T08:00:00Z'],
 'emi-calculator':['Loan amount','500000'],
 'age-calculator':['Birth date','1998-06-15'],
 'date-difference':['Start date','2026-01-01'],
 'invoice-generator':['Your business name','My Business'],
 'quotation-maker':['Your business name','My Business'],
 'resume-builder':['Full name','Alex Kumar'],
 'youtube-thumbnail-downloader':['YouTube URL or video ID','https://youtu.be/jNQXAC9IVRw'],
};
const SECOND_HINT:Record<string,[string,string]>={
 'protect-pdf':['Confirm password','Repeat password'],
 'pdf-metadata':['PDF author (when updating)','Author name'],
 'background-remover':['Background tolerance (0–200)','45'],
 'color-picker':['Y position (%)','50'],
 'aspect-ratio-resizer':['Resize mode: cover or contain','cover'],
 'regex-tester':['Regex flags','gi'],
 'emi-calculator':['Annual interest rate (%)','9'],
 'age-calculator':['Calculate age as of','2026-11-23'],
 'date-difference':['End date','2026-11-23'],
 'invoice-generator':['Customer / recipient','Client name'],
 'quotation-maker':['Customer / recipient','Client name'],
 'resume-builder':['Profession / role','Software Developer']
};
function defaultText(slug:string){
 if(slug==='invoice-generator'||slug==='quotation-maker')return 'Website development | 1 | 12000\nHosting setup | 1 | 1800';
 if(slug==='resume-builder')return 'Email: alex@example.com\nPhone: +91 90000 00000\nSummary: Detail-oriented professional with experience delivering useful digital products.\nSkills: Communication, web development, project planning\nExperience: Built and maintained production websites.\nEducation: Bachelor degree';
 if(slug==='ai-title-hashtag-generator')return 'How to create engaging educational videos';
 return '';
}
export function AdvancedToolRunner({tool}:{tool:Tool}){
 const slug=tool.slug,pdf=PDF_TOOLS.has(slug),image=IMAGE_TOOLS.has(slug),doc=DOC_TOOLS.has(slug);
 const fileNeeded=pdf||image;
 const [primary,setPrimary]=useState(slug==='age-calculator'?'2000-01-01':slug==='date-difference'?'2026-01-01':'');
 const [secondary,setSecondary]=useState(slug==='age-calculator'?dateToday():slug==='date-difference'?dateToday():'');
 const [text,setText]=useState(defaultText(slug));
 const [third,setThird]=useState('12');
 const [option,setOption]=useState(SELECTS[slug]?.[0][0]||'');
 const [file,setFile]=useState<File|null>(null);
 const [quota,setQuota]=useState<Q|null>(null);
 const [quotaError,setQuotaError]=useState('');
 const [working,setWorking]=useState(false);
 const [result,setResult]=useState('');
 const [failed,setFailed]=useState(false);
 const [last,setLast]=useState<GeneratedFile|null>(null);
 const [thumbnail,setThumbnail]=useState('');
 async function verifyQuota():Promise<Q>{
  const response=await fetch('/api/usage/quota',{cache:'no-store',credentials:'same-origin'});
  const data=await response.json() as {plan?:unknown;mode?:unknown;used?:unknown;limit?:unknown;userId?:unknown;error?:string};
  if(!response.ok)throw Error(data.error||'Unable to check your usage allowance');
  if(!isUsagePlan(data.plan)||!['account','browser'].includes(String(data.mode)))throw Error('Invalid account quota response.');
  const limit=dailyLimits[data.plan],mode=data.mode as Q['mode'],key=quotaKey(typeof data.userId==='string'?data.userId:null);
  if(data.plan==='Unlimited'&&(mode!=='account'||data.limit!==null))throw Error('Unlimited must be verified server-side.');
  const next={plan:data.plan,mode,limit,key,used:mode==='account'&&typeof data.used==='number'?data.used:readUsage(key)};
  setQuota(next);setQuotaError('');return next;
 }
 useEffect(()=>{
  let mounted=true;
  const refresh=()=>{void verifyQuota().catch(()=>{if(mounted){setQuota(null);setQuotaError('Quota verification unavailable. Please refresh.')}})};
  refresh();window.addEventListener('focus',refresh);window.addEventListener('toolnexa-subscription-changed',refresh);
  return()=>{mounted=false;window.removeEventListener('focus',refresh);window.removeEventListener('toolnexa-subscription-changed',refresh)};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[slug]);
 async function reserve(q:Q):Promise<Q>{
  if(q.limit!==null&&q.used>=q.limit)throw Error('Daily usage limit reached. See subscription plans.');
  if(q.mode==='browser')return q;
  const response=await fetch('/api/usage/quota',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug}),credentials:'same-origin'});
  const data=await response.json() as {used?:unknown;error?:string};
  if(!response.ok){if(response.status===429&&q.limit!==null)setQuota({...q,used:q.limit});throw Error(data.error||'Could not reserve tool usage.')}
  if(typeof data.used!=='number')throw Error('Invalid usage reservation.');
  const next={...q,used:data.used};setQuota(next);return next;
 }
 async function run(){
  if(working)return;setWorking(true);setFailed(false);setResult('');setLast(null);setThumbnail('');
  try{
   if(fileNeeded&&!file)throw Error('Choose a file first.');
   const q=await verifyQuota();
   if(q.limit!==null&&q.used>=q.limit)throw Error('Daily usage limit reached. Upgrade for more runs.');
   const after=await reserve(q);
   let output='',generated:GeneratedFile|null=null;
   if(pdf)generated=await processAdvancedPdf(slug,file!,primary,secondary,option);
   else if(image&&slug==='image-to-base64'){
    if(!/^image\/(png|jpeg|webp|gif|bmp)$/.test(file!.type))throw Error('Choose a supported image file.');
    if(file!.size>2*1024*1024)throw Error('Maximum 2 MB image for Base64 conversion.');
    const b64=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('Image read failed.'));reader.readAsDataURL(file!)});
    output=b64;
   }else if(image)generated=await processAdvancedImage(slug,file!,primary,secondary,option);
   else if(doc)generated=await generateBusinessPdf(slug,primary,secondary,text,third);
   else switch(slug){
    case 'html-formatter':{
     if(!text.trim())throw Error('Enter HTML source.');
     const [{format},html]=await Promise.all([import('prettier/standalone'),import('prettier/plugins/html')]);
     output=await format(text,{parser:'html',plugins:[html],tabWidth:2,printWidth:100});break;
    }
    case 'css-minifier':{
     if(!text.trim())throw Error('Enter CSS source.');
     const {minify}=await import('csso');
     output=minify(text,{restructure:false}).css;break;
    }
    case 'javascript-minifier':{
     if(!text.trim())throw Error('Enter JavaScript code.');
     if(text.length>250000)throw Error('Maximum 250,000 JavaScript characters.');
     const {minify}=await import('terser');
     const res=await minify(text,{compress:true,mangle:false,format:{comments:false}});
     if(!res.code)throw Error('JavaScript parser could not process the input.');
     output=res.code;break;
    }
    case 'regex-tester':output=regexReport(text,primary,secondary);break;
    case 'jwt-decoder':output=jwtReport(text);break;
    case 'sql-formatter':{
     if(!text.trim())throw Error('Enter SQL query.');
     const {format}=await import('sql-formatter');
     output=format(text,{language:'sql',tabWidth:2});break;
    }
    case 'hex-rgb-converter':output=colorConvert(primary);break;
    case 'timestamp-converter':output=timestampReport(primary);break;
    case 'emi-calculator':output=emiReport(Number(primary),Number(secondary),Number(third));break;
    case 'age-calculator':output=ageReport(primary,secondary);break;
    case 'date-difference':output=dateDifferenceReport(primary,secondary);break;
    case 'text-compare':output=textDiff(text,secondary);break;
    case 'csv-to-json':output=csvToJson(text);break;
    case 'text-sorter':output=textSort(text,option!=='keep');break;
    case 'ai-title-hashtag-generator':output=socialSuggestions(text||primary,option,'professional');break;
    case 'youtube-thumbnail-downloader':{
     const id=parseYoutubeId(primary);
     let url='',blob:Blob|null=null;
     for(const size of ['maxresdefault','sddefault','hqdefault','mqdefault']){
      const candidate='https://i.ytimg.com/vi/'+id+'/'+size+'.jpg';
      try{
       const response=await fetch(candidate,{mode:'cors',cache:'no-store'});
       if(!response.ok)continue;
       const image=await response.blob();
       if(image.size<2000||!image.type.startsWith('image/'))continue;
       // Some unavailable maxres images return low-resolution placeholder files.
       const bitmap=await createImageBitmap(image);
       const valid=size==='maxresdefault'?bitmap.width>=900:size==='sddefault'?bitmap.width>=500:true;
       bitmap.close();
       if(!valid)continue;
       blob=image;url=candidate;break;
      }catch{continue}
     }
     if(!blob||!url)throw Error('No public thumbnail could be retrieved. Check the video link, browser restrictions or try another video.');
     setThumbnail(url);
     generated={blob,name:'youtube-'+id+'-thumbnail.jpg',message:'Downloaded available thumbnail from YouTube’s public image CDN. Respect the creator’s rights.'};
     break;
    }
    default:throw Error('Tool processing not available for this selection.');
   }
   if(generated){
    output=generated.message;
    if(generated.blob.size>0&&generated.name){
     setLast(generated);
     // Download only after the file was successfully generated.
     download(generated.blob,generated.name);
    }
   }
   if(output.length>3_000_000)throw Error('Output exceeds the safe browser display limit.');
   setResult(output||'Completed.');
   if(after.mode==='browser'){
    const used=consumeUsage(after.key,after.limit??0);
    if(used===null)throw Error('Unable to save local daily usage. Please enable browser storage.');
    setQuota({...after,used});
   }
   logUsage(slug);recent(slug);
  }catch(error){setFailed(true);setResult(error instanceof Error?error.message:'Processing failed. Check your input and retry.')}
  finally{setWorking(false)}
 }
 const empty=quota===null||!!quotaError;
 const full=!!quota&&quota.limit!==null&&quota.used>=quota.limit;
 const labelFor=PRIMARY_HINT[slug],second=SECOND_HINT[slug];
 const primaryIsDate=slug==='age-calculator'||slug==='date-difference';
 const password=slug==='protect-pdf';
 const showPrimary=!!labelFor;
 const showSecondary=!!second;
 const outputIsLong=result.length>40000;
 return <section className="tool-workspace" aria-label={tool.title+' workspace'}>
  <div className="tool-workspace-grid">
   <div className="tool-editor">
    <div className="tool-editor-header"><p className="tool-workspace-kicker">ADVANCED WORKSPACE</p><h2>{tool.title}</h2><p>{tool.description}.</p></div>
    {HELP[slug]&&<p className="small-note mb-5">{HELP[slug]}</p>}
    {fileNeeded&&<div className="tool-field"><label htmlFor="advanced-file">Choose {pdf?'a PDF':'an image'}</label>
     <input id="advanced-file" className="field tool-file-input" type="file" accept={pdf?".pdf,application/pdf":"image/png,image/jpeg,image/webp,image/gif,image/bmp"}
      onChange={e=>setFile(e.target.files?.[0]||null)}/>
     <p className="small-note">{file?file.name+' · '+Math.round(file.size/1024)+' KB':'Files stay in your browser for processing (25 MB maximum).'}</p>
    </div>}
    {showPrimary&&<div className="tool-field"><label htmlFor="advanced-primary">{labelFor[0]}</label>
     <input id="advanced-primary" type={primaryIsDate?'date':password?'password':'text'} className="field" value={primary}
      placeholder={labelFor[1]} onChange={e=>setPrimary(e.target.value)}/></div>}
    {showSecondary&&!(slug==='aspect-ratio-resizer')&&<div className="tool-field"><label htmlFor="advanced-secondary">{second[0]}</label>
     <input id="advanced-secondary" type={primaryIsDate?'date':password?'password':'text'} className="field" value={secondary}
      placeholder={second[1]} onChange={e=>setSecondary(e.target.value)}/></div>}
    {slug==='aspect-ratio-resizer'&&<div className="tool-field"><label htmlFor="advanced-resize-mode">Fit method</label>
      <select id="advanced-resize-mode" className="field" value={secondary||'cover'} onChange={e=>setSecondary(e.target.value)}>
       <option value="cover">Cover · crop edges</option><option value="contain">Contain · white padding</option>
      </select></div>}
    {SELECTS[slug]&&<div className="tool-field"><label htmlFor="advanced-option">{slug==='aspect-ratio-resizer'?'Aspect ratio':slug==='ai-title-hashtag-generator'?'Platform':'Mode'}</label>
      <select id="advanced-option" className="field" value={option} onChange={e=>setOption(e.target.value)}>{SELECTS[slug].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
    </div>}
    {TEXTAREA_TOOLS.has(slug)&&<div className="tool-field"><label htmlFor="advanced-text">{slug==='regex-tester'?'Sample text to test':slug==='text-compare'?'Original text (left)':doc?'Content / line items':slug==='ai-title-hashtag-generator'?'Topic to generate for':'Source text'}</label>
      <textarea id="advanced-text" rows={doc?8:7} className="field tool-textarea" value={text} onChange={e=>setText(e.target.value)} placeholder="Enter or paste your content…"/>
      <p className="small-note">{text.length.toLocaleString()} characters · processed locally</p>
    </div>}
    {slug==='text-compare'&&<div className="tool-field"><label htmlFor="advanced-right">Updated text (right)</label>
     <textarea id="advanced-right" className="field tool-textarea" rows={7} value={secondary} onChange={e=>setSecondary(e.target.value)}/></div>}
    {slug==='emi-calculator'&&<div className="tool-field"><label htmlFor="advanced-months">Loan term (months)</label>
     <input id="advanced-months" className="field" type="number" min="1" max="600" value={third} onChange={e=>setThird(e.target.value)}/></div>}
    {(slug==='invoice-generator'||slug==='quotation-maker')&&<div className="tool-field"><label htmlFor="advanced-tax">Tax rate (%)</label>
     <input id="advanced-tax" className="field" type="number" min="0" max="100" step="0.01" value={third} onChange={e=>setThird(e.target.value)}/></div>}
    <div className="tool-quota-panel" aria-live="polite">
     <div className="tool-quota-top"><strong>{quota?quota.plan+' plan':'Verifying plan…'}</strong><span>{quota?(quota.limit===null?quota.used+' today · no daily cap':quota.used+' / '+quota.limit+' today'):'Please wait'}</span></div>
     {quota&&quota.limit!==null&&<div className="tool-quota-track" role="progressbar" aria-label="Daily tool usage" aria-valuemin={0} aria-valuemax={quota.limit} aria-valuenow={quota.used}><span style={{width:Math.min(100,quota.used/quota.limit*100)+'%'}}/></div>}
     <p className="small-note">{quota?.limit===null?'Unlimited · fair-use 60 runs per 60-second account window':'Daily limits reset at 00:00 UTC.'} {quota?.mode==='account'?'Synced across devices.':'Guest usage stays in this browser.'}</p>
     {quotaError&&<p className="tool-quota-error" role="alert">{quotaError}</p>}
     {full&&<div className="tool-quota-upgrade"><strong>Daily limit reached</strong><p>Upgrade your subscription or come back after the daily reset.</p><Link className="button" href="/pricing">View plans</Link></div>}
    </div>
    <div className="tool-editor-actions"><button type="button" className="button tool-run-button" disabled={working||empty||full} onClick={()=>void run()}>{working?'Processing…':full?'Daily limit reached':'Run '+tool.title} →</button></div>
   </div>
   <aside className="tool-output" aria-label="Tool output">
    <div className="tool-output-top"><div><p className="tool-workspace-kicker">RESULT</p><h3>Your output</h3></div>
     <span className={'tool-result-status '+(failed?'is-error':result?'is-ready':'')}>{working?'Processing':failed?'Error':result?'Ready':'Waiting'}</span></div>
    {result?<pre className={'tool-output-content '+(failed?'tool-output-error':'')} style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:460,overflow:'auto'}} role={failed?'alert':'status'}>{outputIsLong?result.slice(0,40000)+'\n…Output preview truncated. Use download if applicable.':result}</pre>:
      <div className="tool-empty-result"><span aria-hidden="true">✦</span><p>Configure your input and run the tool to see results.</p></div>}
    {thumbnail&&<img src={thumbnail} alt="Available YouTube video thumbnail preview" width={460} height={260} style={{maxWidth:'100%',height:'auto',borderRadius:12,marginTop:16}}/>}
    {last&&<div className="tool-output-actions"><button type="button" className="button outline" onClick={()=>download(last.blob,last.name)}>Download again</button>
      <span className="small-note">{last.name} · {(last.blob.size/1024/1024).toFixed(2)} MB</span></div>}
    {result&&!failed&&!last&&<div className="tool-output-actions"><button type="button" className="button outline" onClick={()=>void navigator.clipboard.writeText(result)}>Copy result</button>
      <button type="button" className="button outline" onClick={()=>download(new Blob([result],{type:'text/plain;charset=utf-8'}),'toolnexa-result.txt')}>Download text</button></div>}
    <p className="tool-local-note">{BINARY_TOOLS.has(slug)?'Your document or image is processed in the browser.':'Privacy first · Browser-only processing'}</p>
   </aside>
  </div>
 </section>;
}
