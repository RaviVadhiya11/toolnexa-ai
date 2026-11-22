'use client';
import {useState} from 'react';import QRCode from 'qrcode';import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';import type {Tool} from '@/lib/tools';
function download(data:Blob,name:string){const url=URL.createObjectURL(data);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000)}
function recordUse(slug:string){void fetch('/api/usage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug}),keepalive:true}).catch(()=>{});}
function remember(slug:string){try{const old=JSON.parse(localStorage.getItem('toolnexa-recent')||'[]') as string[];localStorage.setItem('toolnexa-recent',JSON.stringify([slug,...old.filter(x=>x!==slug)].slice(0,10)))}catch{}}
async function canvasImage(file:File,width?:number){const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');const w=width||bitmap.width;const h=Math.max(1,Math.round(bitmap.height*w/bitmap.width));if(w*h>35000000){bitmap.close();throw Error('Image too large (max 35 megapixels)')}canvas.width=w;canvas.height=h;canvas.getContext('2d')!.drawImage(bitmap,0,0,w,h);bitmap.close();return canvas}
async function toBlob(canvas:HTMLCanvasElement,mime:string){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(Error('Conversion failed')),mime,.9))}
function utf8To64(s:string){const bytes=new TextEncoder().encode(s);let str='';for(const b of bytes)str+=String.fromCharCode(b);return btoa(str)}
function from64(s:string){const raw=atob(s);return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,c=>c.charCodeAt(0)))}
function validFile(file:File|undefined,types:string[]){if(!file)throw Error('Choose a file first');if(file.size>25*1024*1024)throw Error('Maximum file size is 25 MB');if(!types.some(t=>file.type===t||file.name.toLowerCase().endsWith(t==='application/pdf'?'.pdf':'.'+t.split('/').pop())))throw Error('Invalid file type');return file}
function parsePageRanges(input:string,max:number){const pages=new Set<number>();for(const part of input.split(',')){const s=part.trim();if(!/^\d+(\s*-\s*\d+)?$/.test(s))throw Error('Use page numbers such as 1,3-5');const [a,b]=s.split('-').map(x=>Number(x.trim()));const end=b||a;if(a<1||end>max||end<a)throw Error('Page range out of bounds');for(let i=a;i<=end;i++)pages.add(i-1)}if(!pages.size)throw Error('Specify pages');return [...pages].sort((a,b)=>a-b)}
export function ToolRunner({tool}:{tool:Tool}){const [text,setText]=useState(''),[mode,setMode]=useState('encode'),[num,setNum]=useState('1000'),[num2,setNum2]=useState('18'),[files,setFiles]=useState<File[]>([]),[output,setOutput]=useState(''),[qr,setQr]=useState(''),[working,setWorking]=useState(false),[symbols,setSymbols]=useState(true),[fileKey,setFileKey]=useState(0),[copyMessage,setCopyMessage]=useState('');const slug=tool.slug;
const textSlugs=['word-counter','case-converter','text-reverser','json-formatter','base64-encoder','url-encoder','qr-code-generator','text-to-pdf'];const fileSlugs=['image-resizer','image-to-png','image-to-jpg','image-to-webp','image-to-pdf','merge-pdf','split-pdf'];
async function run(){setWorking(true);setOutput('');setQr('');try{let output='';const a=Number(slug==='password-generator'&&num==='1000'?'16':slug==='image-resizer'&&num==='1000'?'800':num),b=Number(num2);if(['gst-calculator','percentage-calculator','profit-margin'].includes(slug)&&(!Number.isFinite(a)||!Number.isFinite(b)))throw Error('Enter valid numbers');switch(slug){
case 'word-counter':output=`Words: ${text.trim()?text.trim().split(/\s+/).length:0}\nCharacters: ${[...text].length}\nLines: ${text?text.split(/\r?\n/).length:0}`;break;
case 'case-converter':output=mode==='upper'?text.toUpperCase():mode==='lower'?text.toLowerCase():text.toLowerCase().replace(/\b\w/g,x=>x.toUpperCase());break;
case 'text-reverser':output=[...text].reverse().join('');break;
case 'uuid-generator':output=crypto.randomUUID();break;
case 'password-generator':{const len=Math.floor(a);if(len<8||len>128)throw Error('Choose a length from 8 to 128');const alphabet='abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'+(symbols?'!@#$%^&*_-+':'');const max=256-(256%alphabet.length);let pwd='';while(pwd.length<len){const arr=new Uint8Array((len-pwd.length)*2);crypto.getRandomValues(arr);for(const b of arr){if(b<max&&pwd.length<len)pwd+=alphabet[b%alphabet.length]}}output=pwd;break}
case 'json-formatter':output=JSON.stringify(JSON.parse(text),null,2);break;
case 'base64-encoder':output=mode==='encode'?utf8To64(text):from64(text);break;
case 'url-encoder':output=mode==='encode'?encodeURIComponent(text):decodeURIComponent(text);break;
case 'qr-code-generator':if(!text.trim())throw Error('Enter text or URL');if(text.length>2000)throw Error('QR input must be at most 2000 characters');{const url=await QRCode.toDataURL(text,{width:320,margin:2,errorCorrectionLevel:'M'});setQr(url);output='QR code generated locally. Use Download PNG.'}break;
case 'gst-calculator':{if(a<0||b<0||b>100)throw Error('Enter a positive amount and GST rate 0–100');const gst=mode==='inclusive'?a-a/(1+b/100):a*b/100;output=`GST: ₹${gst.toFixed(2)}\nBase amount: ₹${(mode==='inclusive'?a-gst:a).toFixed(2)}\nTotal: ₹${(mode==='inclusive'?a:a+gst).toFixed(2)}`;break}
case 'percentage-calculator':output=`${b}% of ${a} = ${(a*b/100).toFixed(2)}`;break;
case 'profit-margin':if(b<=0)throw Error('Selling price must be positive');output=`Profit: ₹${(b-a).toFixed(2)}\nMargin: ${((b-a)/b*100).toFixed(2)}%\nMarkup: ${a>0?((b-a)/a*100).toFixed(2)+'%':'N/A'}`;break;
case 'image-resizer':case 'image-to-png':case 'image-to-jpg':case 'image-to-webp':{const file=validFile(files[0],['image/png','image/jpeg','image/webp','image/gif','image/bmp']);const width=slug==='image-resizer'?Number(num==='1000'?'800':num):undefined;if(width!==undefined&&(!Number.isInteger(width)||width<1||width>5000))throw Error('Width must be from 1 to 5000');const c=await canvasImage(file,width);const mime=slug==='image-to-jpg'?'image/jpeg':slug==='image-to-webp'?'image/webp':'image/png';if(mime==='image/jpeg'){const context=c.getContext('2d')!;context.globalCompositeOperation='destination-over';context.fillStyle='#ffffff';context.fillRect(0,0,c.width,c.height);context.globalCompositeOperation='source-over'}const blob=await toBlob(c,mime);const ext=mime.split('/')[1]==='jpeg'?'jpg':mime.split('/')[1];download(blob,`toolnexa-image.${ext}`);output=`Downloaded ${c.width} × ${c.height} ${ext.toUpperCase()} image`;break}
case 'image-to-pdf':{if(!files.length)throw Error('Select at least one image');if(files.length>20)throw Error('Maximum 20 images per PDF');const pdf=await PDFDocument.create();for(const f of files){validFile(f,['image/png','image/jpeg','image/webp','image/gif','image/bmp']);const c=await canvasImage(f);const png=await toBlob(c,'image/png');const img=await pdf.embedPng(await png.arrayBuffer());const maxW=595,maxH=842,scale=Math.min(maxW/img.width,maxH/img.height,1);const width=img.width*scale,height=img.height*scale;const p=pdf.addPage([Math.max(width,72),Math.max(height,72)]);p.drawImage(img,{x:0,y:p.getHeight()-height,width,height})}download(new Blob([new Uint8Array(await pdf.save())],{type:'application/pdf'}),'toolnexa-images.pdf');output=`Created PDF with ${files.length} images`;break}
case 'text-to-pdf':{if(!text.trim())throw Error('Enter text first');const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica);let page=pdf.addPage([595,842]),y=790;const lines=text.replace(/[^\x20-\x7e\n\r\t]/g,'?').split(/\r?\n/);for(const line of lines){const words=line.split(' ');let row='';for(const word of words){const candidate=row?row+' '+word:word;if(font.widthOfTextAtSize(candidate,11)>520&&row){if(y<52){page=pdf.addPage([595,842]);y=790}page.drawText(row,{x:36,y,size:11,font,color:rgb(.1,.15,.25)});y-=18;row=word}else row=candidate}if(y<52){page=pdf.addPage([595,842]);y=790}page.drawText(row,{x:36,y,size:11,font,color:rgb(.1,.15,.25)});y-=18}download(new Blob([new Uint8Array(await pdf.save())],{type:'application/pdf'}),'toolnexa-text.pdf');output='Text PDF generated and downloaded (non-Latin characters are replaced in this starter tool).';break}
case 'merge-pdf':{if(files.length<2)throw Error('Select at least 2 PDF files');if(files.length>15)throw Error('Select at most 15 PDF files');const pdf=await PDFDocument.create();for(const f of files){validFile(f,['application/pdf']);const src=await PDFDocument.load(await f.arrayBuffer());const pages=await pdf.copyPages(src,src.getPageIndices());pages.forEach(p=>pdf.addPage(p))}download(new Blob([new Uint8Array(await pdf.save())],{type:'application/pdf'}),'toolnexa-merged.pdf');output=`Merged ${files.length} PDFs`;break}
case 'split-pdf':{const file=validFile(files[0],['application/pdf']);const src=await PDFDocument.load(await file.arrayBuffer());const indexes=parsePageRanges(text,src.getPageCount());const pdf=await PDFDocument.create();const pages=await pdf.copyPages(src,indexes);pages.forEach(p=>pdf.addPage(p));download(new Blob([new Uint8Array(await pdf.save())],{type:'application/pdf'}),'toolnexa-extracted.pdf');output=`Extracted ${indexes.length} pages`;break}
}setOutput(output);remember(slug);recordUse(slug)}catch(error){setOutput(`Error: ${error instanceof Error?error.message:'Processing failed'}`)}finally{setWorking(false)}}
const isText=textSlugs.includes(slug);
const isFile=fileSlugs.includes(slug);
const hasError=output.startsWith('Error:');
const inputSize=Array.from(text).length;
const runLabel=working?'Processing…':slug==='qr-code-generator'?'Generate QR code':slug==='password-generator'?'Generate password':slug==='uuid-generator'?'Generate UUID':slug==='merge-pdf'?'Merge PDF files':slug==='split-pdf'?'Extract PDF pages':slug.startsWith('image-')?'Process image':'Run tool';
function reset(){
 if(working)return;
 setText('');setMode('encode');setNum('1000');setNum2('18');
 setFiles([]);setOutput('');setQr('');setSymbols(true);setFileKey(v=>v+1);setCopyMessage('');
}
async function copyResult(){
 if(!output||hasError)return;
 try{await navigator.clipboard.writeText(output);setCopyMessage('Copied to clipboard')}
 catch{setCopyMessage('Copy unavailable in this browser. Select the result text instead.')}
}
function downloadTextResult(){
 if(!output||hasError)return;
 download(new Blob([output],{type:'text/plain;charset=utf-8'}),`toolnexa-${slug}-result.txt`);
}
const fileAccept=slug.includes('pdf')&&slug!=='image-to-pdf'&&slug!=='text-to-pdf'?'application/pdf,.pdf':'image/*';
return <section className="tool-workspace" aria-label={tool.title+' workspace'}>
 <div className="tool-workspace-heading">
  <div><p className="tool-workspace-kicker">SMART TOOL WORKSPACE</p><h2>Try {tool.title}</h2><p>Configure your input and generate a result in your browser.</p></div>
  <span className="tool-workspace-free">Free tool</span>
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
    <input key={fileKey} id="tool-file" type="file" className="field tool-file-input" accept={fileAccept} multiple={slug==='merge-pdf'||slug==='image-to-pdf'} onChange={e=>{setFiles(Array.from(e.target.files||[]));setOutput('');setQr('')}}/>
    {files.length>0?<div className="tool-file-summary"><strong>{files.length} file{files.length===1?'':'s'} selected</strong><span>{files.slice(0,3).map(f=>f.name).join(' · ')}{files.length>3?' and more':''}</span></div>:null}
    <p className="small-note">Your files are processed locally. Maximum 25 MB per file. {slug==='image-to-pdf'?'Up to 20 images.':slug==='merge-pdf'?'Choose 2–15 PDFs.':''}</p>
   </div>}
   {slug==='split-pdf'&&<div className="tool-field"><label htmlFor="tool-page-ranges">Pages to extract</label><input id="tool-page-ranges" className="field" value={text} onChange={e=>setText(e.target.value)} placeholder="For example: 1-3,5"/><p className="small-note">Use commas and ranges, for example 1,3-5.</p></div>}
   {['case-converter','base64-encoder','url-encoder','gst-calculator'].includes(slug)&&<div className="tool-field"><label htmlFor="tool-mode">Mode</label><select id="tool-mode" className="field" value={mode} onChange={e=>setMode(e.target.value)}>{(slug==='case-converter'?[['encode','Title Case'],['upper','UPPERCASE'],['lower','lowercase']]:slug==='gst-calculator'?[['encode','Add GST (exclusive)'],['inclusive','Remove included GST']]:[['encode','Encode'],['decode','Decode']]).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></div>}
   {['password-generator','gst-calculator','percentage-calculator','profit-margin','image-resizer'].includes(slug)&&<div className="tool-field"><label htmlFor="tool-number">{slug==='password-generator'?'Password length':slug==='image-resizer'?'New width (px)':slug==='profit-margin'?'Cost price':slug==='gst-calculator'?'Amount':'Base number'}</label><input id="tool-number" type="number" inputMode="decimal" className="field" value={slug==='password-generator'&&num==='1000'?'16':slug==='image-resizer'&&num==='1000'?'800':num} onChange={e=>setNum(e.target.value)}/></div>}
   {['gst-calculator','percentage-calculator','profit-margin'].includes(slug)&&<div className="tool-field"><label htmlFor="tool-number-2">{slug==='gst-calculator'?'GST rate (%)':slug==='profit-margin'?'Selling price':'Percentage (%)'}</label><input id="tool-number-2" type="number" inputMode="decimal" className="field" value={num2} onChange={e=>setNum2(e.target.value)}/></div>}
   {slug==='password-generator'&&<label className="tool-checkbox"><input type="checkbox" checked={symbols} onChange={e=>setSymbols(e.target.checked)}/> Include symbols for stronger passwords</label>}
   <div className="tool-editor-actions"><button type="button" className="button tool-run-button" onClick={()=>{setCopyMessage('');void run()}} disabled={working}>{runLabel} <span aria-hidden="true">→</span></button></div>
  </div>
  <aside className="tool-output" aria-label="Tool result">
   <div className="tool-output-top"><div><p className="tool-workspace-kicker">RESULT</p><h3>Your output</h3></div><span className={'tool-result-status '+(hasError?'is-error':output||qr?'is-ready':'')}>{working?'Processing':hasError?'Error':output||qr?'Ready':'Waiting'}</span></div>
   {working?<p className="tool-empty-result" role="status">Processing your request…</p>:output?<pre className={'tool-output-content '+(hasError?'tool-output-error':'')} role="status">{output}</pre>:<div className="tool-empty-result"><span aria-hidden="true">✦</span><p>Results will appear here after you run the tool.</p></div>}
   {qr&&<div className="tool-qr-result"><img src={qr} alt="Generated QR code" width={240} height={240}/><a className="button" href={qr} download="toolnexa-qr.png">Download QR PNG</a></div>}
   {output&&!hasError&&!qr&&<div className="tool-output-actions"><button type="button" className="button outline" onClick={()=>void copyResult()}>Copy result</button><button type="button" className="button outline" onClick={downloadTextResult}>Download .txt</button></div>}
   {copyMessage&&<p className="small-note mt-3" role="status">{copyMessage}</p>}
   <p className="tool-local-note">Privacy first · Local browser processing</p>
  </aside>
 </div>
</section>;
}
