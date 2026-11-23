import {PDFDocument,StandardFonts,degrees,rgb} from 'pdf-lib';

const pdfBlob=(bytes:Uint8Array)=>new Blob([new Uint8Array(bytes)],{type:'application/pdf'});
export type GeneratedFile={blob:Blob;name:string;message:string};
export async function processAdvancedPdf(slug:string,file:File,primary:string,secondary:string,option:string):Promise<GeneratedFile>{
 if(!file||(!file.name.toLowerCase().endsWith('.pdf')&&file.type!=='application/pdf'))throw Error('Choose a PDF document.');
 if(file.size>25*1024*1024)throw Error('PDF maximum size is 25 MB.');
 const bytes=await file.arrayBuffer();
 if(slug==='protect-pdf'){
  if(primary.length<8||primary.length>128)throw Error('Use a password of 8–128 characters.');
  if(primary!==secondary)throw Error('Passwords do not match.');
  const {PDFDocument:SecurePDF}=await import('@cantoo/pdf-lib');
  const doc=await SecurePDF.load(bytes);
  doc.encrypt({userPassword:primary,ownerPassword:crypto.randomUUID(),permissions:{printing:'highResolution'}});
  const secured=await doc.save();
  // Independent read-only verification: encrypted files cannot be opened without a key.
  const verified=await SecurePDF.load(secured,{ignoreEncryption:true});
  if(!verified.isEncrypted)throw Error('Encryption verification failed. No file was saved.');
  return {blob:pdfBlob(secured),name:'toolnexa-protected.pdf',message:'AES-256 encrypted PDF verified. Keep your password safe; it cannot be recovered by this website.'};
 }
 let doc:PDFDocument;
 try{doc=await PDFDocument.load(bytes)}catch{throw Error('PDF could not be opened. Encrypted or malformed PDFs are unsupported for this tool.')}
 const pages=doc.getPages();
 if(pages.length===0)throw Error('PDF has no pages.');
 if(pages.length>400)throw Error('Maximum 400 PDF pages.');
 const short=(value:string)=>value.slice(0,130);
 if(slug==='pdf-compressor'){
  const packed=await doc.save({useObjectStreams:true,objectsPerTick:25});
  const percent=Math.round((1-packed.length/bytes.byteLength)*1000)/10;
  return {blob:pdfBlob(packed),name:'toolnexa-optimized.pdf',message:percent>0?'PDF optimized. Size changed by -'+percent+'%.':'PDF structure optimized; no size reduction achieved. Image-heavy PDFs may need lossy image downsampling.'};
 }
 if(slug==='rotate-pdf'){
  const angle=Number(option);
  if(![90,180,270].includes(angle))throw Error('Choose 90, 180 or 270 degrees.');
  const target=primary.trim()?new Set(parseNumbers(primary,pages.length)):new Set(pages.map((_,i)=>i));
  pages.forEach((p,i)=>{if(target.has(i))p.setRotation(degrees(((p.getRotation().angle+angle)%360)));});
 }
 if(slug==='pdf-watermark'){
  if(!primary.trim())throw Error('Enter watermark text.');
  if(!/^[\x20-\x7E]+$/.test(primary)||primary.length>70)throw Error('PDF watermarks support up to 70 printable Latin characters.');
  const font=await doc.embedFont(StandardFonts.HelveticaBold);
  for(const page of pages){
   const size=Math.min(40,Math.max(14,page.getWidth()/Math.max(12,primary.length*.7)));
   page.drawText(primary,{x:Math.max(18,page.getWidth()/10),y:page.getHeight()/2,size,font,rotate:degrees(35),color:rgb(.5,.5,.5),opacity:.35});
  }
 }
 if(slug==='pdf-page-numbers'){
  const font=await doc.embedFont(StandardFonts.Helvetica);
  const start=Number(primary.trim()||'1');
  if(!Number.isInteger(start)||start<1||start>1e6)throw Error('Starting page number must be between 1 and 1,000,000.');
  for(const [i,page] of pages.entries()){
   const text=String(start+i),size=11;
   page.drawText(text,{x:(page.getWidth()-font.widthOfTextAtSize(text,size))/2,y:20,size,font,color:rgb(.25,.28,.38)});
  }
 }
 if(slug==='reorder-pdf'){
  const order=parseNumbers(primary,pages.length);
  if(order.length!==pages.length||new Set(order).size!==pages.length)throw Error('Enter each page number exactly once, like 3,1,2.');
  const next=await PDFDocument.create();
  const copies=await next.copyPages(doc,order);
  copies.forEach(p=>next.addPage(p));
  return {blob:pdfBlob(await next.save()),name:'toolnexa-reordered.pdf',message:'Reordered '+order.length+' PDF pages.'};
 }
 if(slug==='delete-pdf-pages'){
  const remove=new Set(parseNumbers(primary,pages.length));
  if(remove.size>=pages.length)throw Error('At least one page must remain.');
  for(let i=pages.length-1;i>=0;i--)if(remove.has(i))doc.removePage(i);
 }
 if(slug==='pdf-metadata'){
  const mode=option==='view'?'view':'update';
  if(mode==='view'){
   const fields=['Title: '+(doc.getTitle()||'—'),'Author: '+(doc.getAuthor()||'—'),'Subject: '+(doc.getSubject()||'—'),'Keywords: '+(doc.getKeywords()||'—'),'Pages: '+pages.length];
   return {blob:new Blob(),name:'',message:fields.join('\n')};
  }
  if(!primary.trim()&&!secondary.trim())throw Error('Enter a title and/or author.');
  if(primary.trim())doc.setTitle(short(primary.trim()));
  if(secondary.trim())doc.setAuthor(short(secondary.trim()));
 }
 const result=await doc.save({useObjectStreams:true});
 const names:Record<string,string>={
  'rotate-pdf':'rotated','pdf-watermark':'watermarked','pdf-page-numbers':'numbered',
  'delete-pdf-pages':'pages-removed','pdf-metadata':'metadata-updated'
 };
 return {blob:pdfBlob(result),name:'toolnexa-'+(names[slug]||'document')+'.pdf',message:'Successfully processed '+doc.getPageCount()+' PDF page(s).'};
}
function parseNumbers(input:string,total:number):number[]{
 const parts=input.trim().split(',').map(s=>s.trim());
 if(!input.trim()||parts.some(s=>!/^\d+$/.test(s)))throw Error('Enter page numbers separated by commas, e.g. 1,3,2.');
 const nums=parts.map(Number);
 if(nums.some(n=>n<1||n>total))throw Error('Page numbers must be between 1 and '+total+'.');
 return nums.map(n=>n-1);
}
