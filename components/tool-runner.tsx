'use client';
import {useEffect,useState} from 'react';
import {withPaidDownload,showDownloadGate} from '@/lib/download-access';import Link from 'next/link';import {dailyLimits,isUsagePlan,quotaKey,readUsage,consumeUsage,type UsagePlan} from '@/lib/usage-limits';
import {ToolUploadPreview} from '@/components/tool-upload-preview';
import {CopyableResultRows} from '@/components/copyable-result-rows';import QRCode from 'qrcode';import {PDFDocument} from 'pdf-lib';import type {Tool} from '@/lib/tools';import {wordReport,convertCase,reverseText,formatJson,encodeBase64,decodeBase64,transformUrl,securePassword,gstReport,percentageReport,profitReport,parsePageRanges} from '@/lib/tool-operations';
function download(data:Blob,name:string){const url=URL.createObjectURL(data);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)}
function recordUse(slug:string){void fetch('/api/usage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug}),keepalive:true}).catch(()=>{});}
function remember(slug:string){try{const old=JSON.parse(localStorage.getItem('toolnexa-recent')||'[]') as string[];localStorage.setItem('toolnexa-recent',JSON.stringify([slug,...old.filter(x=>x!==slug)].slice(0,10)))}catch{}}
async function imageSource(file:File){
 if(typeof createImageBitmap==='function'){
  try{const bitmap=await createImageBitmap(file);return {source:bitmap,width:bitmap.width,height:bitmap.height,close:()=>bitmap.close()}}
  catch{ /* Fall back to HTMLImageElement on browsers without reliable bitmap support. */ }
 }
 const url=URL.createObjectURL(file);
 try{
  const image=await new Promise<HTMLImageElement>((resolve,reject)=>{
   const element=new Image();
   element.onload=()=>resolve(element);
   element.onerror=()=>reject(Error('Unable to read this image. Use a valid PNG, JPG or WebP file.'));
   element.src=url;
  });
  return {source:image,width:image.naturalWidth,height:image.naturalHeight,close:()=>URL.revokeObjectURL(url)};
 }catch(error){URL.revokeObjectURL(url);throw error}
}
async function canvasImage(file:File,width?:number,maxDimension?:number){
 const image=await imageSource(file);
 try{
  if(!image.width||!image.height)throw Error('Image dimensions are unavailable');
  const factor=maxDimension?Math.min(1,maxDimension/Math.max(image.width,image.height)):1;
  const w=Math.max(1,Math.round(width??image.width*factor));
  const h=Math.max(1,Math.round(image.height*w/image.width));
  if(w*h>35000000)throw Error('Image is too large (maximum 35 megapixels). Try a smaller width.');
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const context=canvas.getContext('2d');
  if(!context)throw Error('Image editing is not supported by this browser');
  context.imageSmoothingQuality='high';context.drawImage(image.source,0,0,w,h);
  return canvas;
 }finally{image.close()}
}

async function toBlob(canvas:HTMLCanvasElement,mime:string,quality=.9){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(Error('Unable to export this image in your browser')),mime,quality))}
function validFile(file:File|undefined,types:string[]){if(!file)throw Error('Choose a file first');if(file.size>25*1024*1024)throw Error('Maximum file size is 25 MB');if(!types.some(t=>file.type===t||file.name.toLowerCase().endsWith(t==='application/pdf'?'.pdf':'.'+t.split('/').pop())))throw Error('Invalid file type');return file}
export function ToolRunner({tool}:{tool:Tool}){const [text,setText]=useState(''),[mode,setMode]=useState('encode'),[num,setNum]=useState(tool.slug==='password-generator'?'16':tool.slug==='image-resizer'?'800':'1000'),[num2,setNum2]=useState('18'),[files,setFiles]=useState<File[]>([]),[output,setOutput]=useState(''),[qr,setQr]=useState(''),[working,setWorking]=useState(false),[symbols,setSymbols]=useState(true),[fileKey,setFileKey]=useState(0),[copyMessage,setCopyMessage]=useState(''),[imageQuality,setImageQuality]=useState(90),[downloaded,setDownloaded]=useState(false),[lastDownload,setLastDownload]=useState<{blob:Blob;name:string}|null>(null);const slug=tool.slug;
const [quota,setQuota]=useState<{plan:UsagePlan;used:number;limit:number|null;key:string;mode:'browser'|'account'}|null>(null);
const [quotaError,setQuotaError]=useState('');
async function getLiveQuota(){
 const response=await fetch('/api/usage/quota',{cache:'no-store'});
 const result=await response.json() as {plan?:unknown;userId?:unknown;mode?:unknown;limit?:unknown;used?:unknown;error?:string};
 if(!response.ok)throw Error(result.error||'Unable to verify your daily account allowance.');
 if(!isUsagePlan(result.plan)||!['browser','account'].includes(String(result.mode)))throw Error('Unable to verify daily usage limits.');
 const owner=typeof result.userId==='string'?result.userId:null;
 const key=quotaKey(owner);
 const mode=result.mode as 'browser'|'account';
 const limit=dailyLimits[result.plan];
 if(result.plan==='Max' && (mode!=='account'||result.limit!==3000))throw Error('Max 3,000/day account access must be server verified.');
 const used=mode==='account'&&typeof result.used==='number'?result.used:readUsage(key);
 const next={plan:result.plan,used,limit,key,mode};
 setQuota(next);setQuotaError('');
 return next;
}
useEffect(()=>{
 let mounted=true;
 const refresh=()=>{void getLiveQuota().catch(()=>{if(mounted){setQuota(null);setQuotaError('Unable to check your daily allowance. Refresh or retry.')}})};
 refresh();
 window.addEventListener('focus',refresh);
 window.addEventListener('toolnexa-subscription-changed',refresh);
 return()=>{mounted=false;window.removeEventListener('focus',refresh);window.removeEventListener('toolnexa-subscription-changed',refresh)};
 // eslint-disable-next-line react-hooks/exhaustive-deps
},[slug]);

const textSlugs=['word-counter','case-converter','text-reverser','json-formatter','base64-encoder','url-encoder','qr-code-generator','text-to-pdf'];const fileSlugs=['image-resizer','image-to-png','image-to-jpg','image-to-webp','image-to-pdf','merge-pdf','split-pdf'];
function saveGenerated(blob:Blob,name:string){setLastDownload({blob,name});download(blob,name)}
async function run(){
 if([...fileSlugs,'text-to-pdf'].includes(slug)){
  await withPaidDownload({slug,feature:tool.title+' file download'},execute);
 }else await execute();
}
async function execute(){if(working)return;setWorking(true);setOutput('');setQr('');setDownloaded(false);setLastDownload(null);try{let allowance=await getLiveQuota();if(allowance.limit!==null&&allowance.used>=allowance.limit){
  showDownloadGate({kind:'limit',feature:tool.title,requiredTier:'Starter',message:'Your shared daily usage limit is complete. Upgrade for a higher limit or return after the UTC daily reset.'});
  throw Error('Daily limit reached. Subscribe or upgrade for more usage.');
 }
 if(allowance.mode==='account'){
  // Atomic reservation before any local operation: concurrent devices cannot exceed the quota.
  // A reservation is charged even if local processing subsequently fails.
  const res=await fetch('/api/usage/quota',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug})});
  const data=await res.json() as {error?:string;used?:number};
  if(!res.ok){if(res.status===429){
   if(allowance.limit!==null)setQuota({...allowance,used:allowance.limit});
   showDownloadGate({kind:'limit',feature:tool.title,requiredTier:'Starter',message:data.error||'Daily limit reached. Upgrade for more daily runs.'});
  }throw Error(data.error||'Unable to reserve a daily tool run.')}
  if(typeof data.used!=='number')throw Error('Unexpected account quota response');
  allowance={...allowance,used:data.used};setQuota(allowance);
 }
 let output='';const a=Number(num),b=Number(num2);if(['gst-calculator','percentage-calculator','profit-margin'].includes(slug)&&(!Number.isFinite(a)||!Number.isFinite(b)||num.trim()===''||num2.trim()===''))throw Error('Enter valid numbers');switch(slug){
case 'word-counter':output=wordReport(text);break;
case 'case-converter':output=convertCase(text,mode==='upper'?'upper':mode==='lower'?'lower':mode==='sentence'?'sentence':'title');break;
case 'text-reverser':output=reverseText(text);break;
case 'uuid-generator':if(!crypto.randomUUID)throw Error('Secure UUID generation unavailable in this browser');output=crypto.randomUUID();break;
case 'password-generator':output=securePassword(a,symbols);break;
case 'json-formatter':output=formatJson(text,mode==='compact');break;
case 'base64-encoder':output=mode==='encode'?encodeBase64(text):decodeBase64(text);break;
case 'url-encoder':output=transformUrl(text,mode==='decode');break;
case 'qr-code-generator':if(!text.trim())throw Error('Enter text or URL');if(text.length>2000)throw Error('QR input must be at most 2000 characters');{const url=await QRCode.toDataURL(text,{width:320,margin:2,errorCorrectionLevel:'M'});setQr(url);output='QR code generated locally. Use Download PNG.'}break;
case 'gst-calculator':output=gstReport(a,b,mode==='inclusive'?'inclusive':'exclusive');break;
case 'percentage-calculator':output=percentageReport(a,b);break;
case 'profit-margin':output=profitReport(a,b);break;
case 'image-resizer':case 'image-to-png':case 'image-to-jpg':case 'image-to-webp':{const file=validFile(files[0],['image/png','image/jpeg','image/webp','image/gif','image/bmp']);const width=slug==='image-resizer'?a:undefined;if(width!==undefined&&(!Number.isInteger(width)||width<1||width>5000))throw Error('Width must be from 1 to 5000');const c=await canvasImage(file,width);const mime=slug==='image-to-jpg'?'image/jpeg':slug==='image-to-webp'?'image/webp':'image/png';if(mime==='image/jpeg'){const context=c.getContext('2d')!;context.globalCompositeOperation='destination-over';context.fillStyle='#ffffff';context.fillRect(0,0,c.width,c.height);context.globalCompositeOperation='source-over'}const blob=await toBlob(c,mime,imageQuality/100);if(blob.type!==mime)throw Error('Your browser does not support this image format. Try PNG or JPG.');const ext=mime.split('/')[1]==='jpeg'?'jpg':mime.split('/')[1];saveGenerated(blob,`toolnexa-image.${ext}`);setDownloaded(true);output=`Downloaded ${c.width} × ${c.height} ${ext.toUpperCase()} image`;break}
case 'image-to-pdf':{if(!files.length)throw Error('Select at least one image');if(files.length>20)throw Error('Maximum 20 images per PDF');if(files.reduce((sum,f)=>sum+f.size,0)>125*1024*1024)throw Error('Combined input too large (125 MB limit)');const pdf=await PDFDocument.create();for(const f of files){validFile(f,['image/png','image/jpeg','image/webp','image/gif','image/bmp']);const c=await canvasImage(f,undefined,1600);const cx=c.getContext('2d')!;cx.globalCompositeOperation='destination-over';cx.fillStyle='#ffffff';cx.fillRect(0,0,c.width,c.height);cx.globalCompositeOperation='source-over';const compressed=await toBlob(c,'image/jpeg',imageQuality/100);const img=await pdf.embedJpg(await compressed.arrayBuffer());const pageWidth=595,pageHeight=842,margin=28;const scale=Math.min((pageWidth-2*margin)/img.width,(pageHeight-2*margin)/img.height);const width=img.width*scale,height=img.height*scale;const p=pdf.addPage([pageWidth,pageHeight]);p.drawImage(img,{x:(pageWidth-width)/2,y:(pageHeight-height)/2,width,height})}saveGenerated(new Blob([new Uint8Array(await pdf.save())],{type:'application/pdf'}),'toolnexa-images.pdf');setDownloaded(true);output=`Downloaded PDF with ${files.length} images`;break}
case 'text-to-pdf':{
 if(!text.trim())throw Error('Enter text first');
 if(text.length>40000)throw Error('Text PDF supports up to 40,000 characters per document');
 const pdf=await PDFDocument.create();
 // Standard PDF fonts cannot encode Devanagari or other Unicode scripts.
 // Rasterize with the browser's own fonts so Hindi text is not replaced with '?'.
 const scale=2,w=595,h=842,left=36,right=36,top=54,bottom=42;
 const cv=document.createElement('canvas');cv.width=w*scale;cv.height=h*scale;
 const ctx=cv.getContext('2d');if(!ctx)throw Error('Canvas is unavailable in this browser');
 ctx.scale(scale,scale);ctx.font='12px system-ui, sans-serif';
 const maxWidth=w-left-right,lineHeight=19,lines:string[]=[];
 for(const paragraph of text.replace(/\r\n?/g,'\n').split('\n')){
  if(paragraph===''){lines.push('');continue}
  let line='';
  for(const token of paragraph.replace(/\t/g,'    ').split(/(\s+)/).filter(Boolean)){
   if(ctx.measureText(line+token).width<=maxWidth){line+=token;continue}
   if(line.trim()){lines.push(line.trimEnd());line=''}
   if(ctx.measureText(token).width<=maxWidth){line=token.trimStart();continue}
   for(const char of Array.from(token)){
    if(ctx.measureText(line+char).width>maxWidth&&line){lines.push(line);line=''}
    line+=char;
   }
  }
  lines.push(line.trimEnd());
 }
 const linesPerPage=Math.floor((h-top-bottom)/lineHeight),pages=Math.max(1,Math.ceil(lines.length/linesPerPage));
 if(pages>45)throw Error('Document is too long (maximum 45 pages)');
 for(let i=0;i<pages;i++){
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#1b2640';ctx.font='12px system-ui, sans-serif';
  for(let j=0;j<linesPerPage;j++){
   const line=lines[i*linesPerPage+j];if(line===undefined)break;
   ctx.fillText(line,left,top+j*lineHeight,maxWidth);
  }
  const blob=await toBlob(cv,'image/jpeg');
  if(blob.type!=='image/jpeg')throw Error('JPEG export unavailable in this browser');
  const image=await pdf.embedJpg(await blob.arrayBuffer());
  pdf.addPage([w,h]).drawImage(image,{x:0,y:0,width:w,height:h});
 }
 saveGenerated(new Blob([new Uint8Array(await pdf.save())],{type:'application/pdf'}),'toolnexa-text.pdf');
 setDownloaded(true);output=`Downloaded ${pages}-page PDF. Unicode text is rendered as images using browser fonts; text selection in the PDF is not available.`;
 break}

case 'merge-pdf':{if(files.length<2)throw Error('Select at least 2 PDF files');if(files.length>15)throw Error('Select at most 15 PDF files');if(files.reduce((sum,f)=>sum+f.size,0)>125*1024*1024)throw Error('Combined PDFs exceed 125 MB. Merge smaller batches.');const pdf=await PDFDocument.create();for(const f of files){validFile(f,['application/pdf']);const src=await PDFDocument.load(await f.arrayBuffer());const pages=await pdf.copyPages(src,src.getPageIndices());pages.forEach(p=>pdf.addPage(p))}saveGenerated(new Blob([new Uint8Array(await pdf.save())],{type:'application/pdf'}),'toolnexa-merged.pdf');setDownloaded(true);output=`Downloaded merged PDF (${files.length} files)`;break}
case 'split-pdf':{const file=validFile(files[0],['application/pdf']);const src=await PDFDocument.load(await file.arrayBuffer());const indexes=parsePageRanges(text,src.getPageCount());const pdf=await PDFDocument.create();const pages=await pdf.copyPages(src,indexes);pages.forEach(p=>pdf.addPage(p));saveGenerated(new Blob([new Uint8Array(await pdf.save())],{type:'application/pdf'}),'toolnexa-extracted.pdf');setDownloaded(true);output=`Downloaded PDF with ${indexes.length} selected pages`;break}
}if(allowance.mode==='browser'){
 if(allowance.limit===null)throw Error('No valid daily tool run allowance was returned.');
 const used=consumeUsage(allowance.key,allowance.limit);
 if(used===null){
  const reached=readUsage(allowance.key)>=allowance.limit;
  showDownloadGate({kind:reached?'limit':'error',feature:tool.title,requiredTier:'Starter',
   currentPlan:allowance.plan,
   message:reached?'Your daily allowance is complete. Upgrade for more runs or return after UTC reset.':'Browser storage could not be accessed. Enable storage and retry.'});
  throw Error('Daily limit reached or browser storage is disabled. Subscribe or try again later.');
 }
 setQuota({...allowance,used});
 }setOutput(output);remember(slug);recordUse(slug)}catch(error){const message=error instanceof Error?error.message:'Processing failed';setLastDownload(null);setDownloaded(false);setOutput(`Error: ${/encrypted|password/i.test(message)?'Password-protected PDFs are not supported. Unlock the PDF before uploading.':message}`)}finally{setWorking(false)}}
const isText=textSlugs.includes(slug);
const isFile=fileSlugs.includes(slug);
const hasError=output.startsWith('Error:');
const inputSize=Array.from(text).length;
const runLabel=working?'Processing…':slug==='qr-code-generator'?'Generate QR code':slug==='password-generator'?'Generate password':slug==='uuid-generator'?'Generate UUID':slug==='merge-pdf'?'Merge PDF files':slug==='split-pdf'?'Extract PDF pages':slug.startsWith('image-')?'Process image':'Run tool';
function reset(){
 if(working)return;
 setText('');setMode('encode');setNum(slug==='password-generator'?'16':slug==='image-resizer'?'800':'1000');setNum2('18');
 setFiles([]);setOutput('');setQr('');setSymbols(true);setImageQuality(90);setDownloaded(false);setLastDownload(null);setFileKey(v=>v+1);setCopyMessage('');
}
async function copyResult(){
 if(!output||hasError)return;
 try{await navigator.clipboard.writeText(output);setCopyMessage('Copied to clipboard')}
 catch{setCopyMessage('Copy unavailable in this browser. Select the result text instead.')}
}
function downloadTextResult(){
 if(!output||hasError)return;
 void withPaidDownload({slug,feature:tool.title+' text download'},()=>
  download(new Blob([output],{type:'text/plain;charset=utf-8'}),`toolnexa-${slug}-result.txt`));
}
const fileAccept=slug==='merge-pdf'||slug==='split-pdf'?'application/pdf,.pdf':'image/png,image/jpeg,image/webp,image/gif,image/bmp';
return <section className="tool-workspace" aria-label={tool.title+' workspace'}>
 <div className="tool-workspace-heading">
  <div><p className="tool-workspace-kicker">SMART TOOL WORKSPACE</p><h2>Try {tool.title}</h2><p>Configure your input and generate a result in your browser.</p></div>
  <span className="tool-workspace-free">{quota?(quota.limit===null?'Allowance unavailable':quota.plan+' · '+Math.max(0,quota.limit-quota.used)+' left'):'Checking access…'}</span>
 </div>
 <div className="tool-workspace-body">
  <div className="tool-editor">
   <div className="tool-editor-title"><h3>Input &amp; settings</h3><button type="button" className="tool-reset" onClick={reset} disabled={working}>Clear all</button></div>
   {isText&&<div className="tool-field">
    <label htmlFor="tool-text">{slug==='qr-code-generator'?'Text or URL':slug==='text-to-pdf'?'Document text':'Your text'}</label>
    <textarea id="tool-text" value={text} onChange={e=>setText(e.target.value)} rows={slug==='qr-code-generator'?3:7} className="field tool-textarea" placeholder={slug==='qr-code-generator'?'Paste a URL or enter text to turn into a QR code…':'Enter or paste your text here…'}/>
    <div className="tool-input-hint"><span>{inputSize.toLocaleString()} characters</span><span>{slug==='qr-code-generator'?'Maximum 2,000 characters':'Processed in your browser'}</span></div>
   </div>}
   {isFile&&<div className="tool-field">
    <label htmlFor="tool-file">Select {slug==='image-to-pdf'?'images':slug==='merge-pdf'?'PDF files':slug==='split-pdf'?'a PDF file':'an image'}</label>
    <input key={fileKey} id="tool-file" type="file" className="field tool-file-input" accept={fileAccept} multiple={slug==='merge-pdf'||slug==='image-to-pdf'} onChange={e=>{setFiles(Array.from(e.target.files||[]));setOutput('');setQr('');setDownloaded(false);setLastDownload(null)}}/>
    {files.length>0&&<ToolUploadPreview files={files}/>}
    {files.length>0?<div className="tool-file-summary"><strong>{files.length} file{files.length===1?'':'s'} selected</strong><span>{files.slice(0,3).map(f=>f.name).join(' · ')}{files.length>3?' and more':''}</span></div>:null}
    <p className="small-note">Your files are processed locally. Maximum 25 MB per file. {slug==='image-to-pdf'?'Up to 20 images.':slug==='merge-pdf'?'Choose 2–15 PDFs.':''}</p>
   </div>}
   {['image-to-jpg','image-to-webp','image-to-pdf'].includes(slug)&&<div className="tool-field"><label htmlFor="tool-quality">Image quality: {imageQuality}%</label><input id="tool-quality" className="tool-range-input" type="range" min="40" max="100" step="5" value={imageQuality} onChange={e=>setImageQuality(Number(e.target.value))}/><p className="small-note">Lower quality usually creates a smaller download. Images are processed in your browser.</p></div>}
   {slug==='split-pdf'&&<div className="tool-field"><label htmlFor="tool-page-ranges">Pages to extract</label><input id="tool-page-ranges" className="field" value={text} onChange={e=>setText(e.target.value)} placeholder="For example: 1-3,5"/><p className="small-note">Use commas and ranges, for example 1,3-5.</p></div>}
   {['case-converter','base64-encoder','url-encoder','gst-calculator','json-formatter'].includes(slug)&&<div className="tool-field"><label htmlFor="tool-mode">Mode</label><select id="tool-mode" className="field" value={mode} onChange={e=>setMode(e.target.value)}>{(slug==='case-converter'?[['encode','Title Case'],['upper','UPPERCASE'],['lower','lowercase'],['sentence','Sentence case']]:slug==='gst-calculator'?[['encode','Add GST (exclusive)'],['inclusive','Remove included GST']]:slug==='json-formatter'?[['encode','Pretty-print JSON'],['compact','Minify JSON']]:[['encode','Encode'],['decode','Decode']]).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></div>}
   {['password-generator','gst-calculator','percentage-calculator','profit-margin','image-resizer'].includes(slug)&&<div className="tool-field"><label htmlFor="tool-number">{slug==='password-generator'?'Password length':slug==='image-resizer'?'New width (px)':slug==='profit-margin'?'Cost price':slug==='gst-calculator'?'Amount':'Base number'}</label><input id="tool-number" type="number" inputMode="decimal" className="field" value={num} onChange={e=>setNum(e.target.value)}/></div>}
   {['gst-calculator','percentage-calculator','profit-margin'].includes(slug)&&<div className="tool-field"><label htmlFor="tool-number-2">{slug==='gst-calculator'?'GST rate (%)':slug==='profit-margin'?'Selling price':'Percentage (%)'}</label><input id="tool-number-2" type="number" inputMode="decimal" className="field" value={num2} onChange={e=>setNum2(e.target.value)}/></div>}
   {slug==='password-generator'&&<label className="tool-checkbox"><input type="checkbox" checked={symbols} onChange={e=>setSymbols(e.target.checked)}/> Include symbols for stronger passwords</label>}
   <div className="tool-quota-panel" aria-live="polite">
    <div className="tool-quota-top"><strong>{quota?quota.plan+' plan':'Checking your plan…'}</strong><span>{quota?(quota.limit===null?'Allowance unavailable':quota.used+' / '+quota.limit+' uses today'):'Verifying limits'}</span></div>
    {quota&&quota.limit!==null&&<div className="tool-quota-track" role="progressbar" aria-label="Daily tool usage" aria-valuemin={0} aria-valuemax={quota.limit} aria-valuenow={quota.used}><span style={{width:Math.min(100,quota.used/quota.limit*100)+'%'}}/></div>}
    <p>{quota?(quota.limit===null?'Please refresh quota status.':Math.max(0,quota.limit-quota.used)+' daily uses remaining · resets at 00:00 UTC'):'Daily limits are checked against your verified subscription.'}</p>
    {quota&&<p className="tool-quota-notice">{quota.mode==='account'?'Synced across signed-in devices · a run is reserved before processing':'Stored in this browser · successful operations count toward the daily limit'}</p>}
    {quotaError&&<p role="alert" className="tool-quota-error">{quotaError}</p>}
    {quota&&quota.limit!==null&&quota.used>=quota.limit&&<div className="tool-quota-upgrade" role="status"><strong>Daily limit reached</strong><p>New operations are locked until the next daily reset or a higher plan is activated.</p><Link href="/pricing" className="button">View subscription plans →</Link></div>}
   </div>
   <div className="tool-editor-actions"><button type="button" className="button tool-run-button" onClick={()=>{setCopyMessage('');void run()}} disabled={working||quota===null||!!quotaError}>{quota&&quota.limit!==null&&quota.used>=quota.limit?'Limit reached':runLabel} <span aria-hidden="true">→</span></button></div>
  </div>
  <aside className="tool-output" aria-label="Tool result">
   <div className="tool-output-top"><div><p className="tool-workspace-kicker">RESULT</p><h3>Your output</h3></div><span className={'tool-result-status '+(hasError?'is-error':output||qr?'is-ready':'')}>{working?'Processing':hasError?'Error':output||qr?'Ready':'Waiting'}</span></div>
   {working?<p className="tool-empty-result" role="status">Processing your request…</p>:output?<pre className={'tool-output-content '+(hasError?'tool-output-error':'')} role="status">{output}</pre>:<div className="tool-empty-result"><span aria-hidden="true">✦</span><p>Results will appear here after you run the tool.</p></div>}
   {output&&!hasError&&!working&&!qr&&!downloaded&&<CopyableResultRows text={output} slug={slug}/>}
   {qr&&<div className="tool-qr-result"><img src={qr} alt="Generated QR code" width={240} height={240}/><button type="button" className="button" onClick={()=>void withPaidDownload({slug,feature:"QR code PNG download"},()=>{const a=document.createElement("a");a.href=qr;a.download="toolnexa-qr.png";document.body.appendChild(a);a.click();a.remove()})}>Download QR PNG</button></div>}
   {lastDownload&&downloaded&&<div className="tool-output-actions"><button type="button" className="button outline" onClick={()=>void withPaidDownload({slug,feature:tool.title+' file download'},()=>download(lastDownload.blob,lastDownload.name))}>Download again</button><span className="small-note">{lastDownload.name} · {(lastDownload.blob.size/1024/1024).toFixed(2)} MB</span></div>}
   {output&&!hasError&&!qr&&!downloaded&&<div className="tool-output-actions"><button type="button" className="button outline" onClick={()=>void copyResult()}>Copy result</button><button type="button" className="button outline" onClick={downloadTextResult}>Download .txt</button></div>}
   {copyMessage&&<p className="small-note mt-3" role="status">{copyMessage}</p>}
   <p className="tool-local-note">Privacy first · Local browser processing</p>
  </aside>
 </div>
</section>;
}
