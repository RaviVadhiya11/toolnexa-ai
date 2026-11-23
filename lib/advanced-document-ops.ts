import {PDFDocument} from 'pdf-lib';
import type {GeneratedFile} from './advanced-file-ops';

const PAGE_W=1240,PAGE_H=1754;
async function pdfFromCanvas(canvas:HTMLCanvasElement):Promise<Blob>{
 const jpg=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PDF render failed')),'image/jpeg',.92));
 const pdf=await PDFDocument.create();
 const image=await pdf.embedJpg(await jpg.arrayBuffer());
 const page=pdf.addPage([595.28,841.89]);page.drawImage(image,{x:0,y:0,width:595.28,height:841.89});
 return new Blob([new Uint8Array(await pdf.save())],{type:'application/pdf'});
}
function pageCanvas():{canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D}{
 const canvas=document.createElement('canvas');canvas.width=PAGE_W;canvas.height=PAGE_H;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas not supported by this browser');
 ctx.fillStyle='white';ctx.fillRect(0,0,PAGE_W,PAGE_H);
 ctx.fillStyle='#142235';ctx.fillRect(0,0,PAGE_W,22);
 return {canvas,ctx};
}
function txt(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,font='26px Arial',color='#243349'){
 ctx.fillStyle=color;ctx.font=font;ctx.fillText(text,x,y);
}
function wrapped(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,maxWidth:number,lineHeight:number,font='27px Arial',limit=12):number{
 ctx.font=font;
 const words=value.trim().split(/\s+/);let current='',lines=0;
 for(const word of words){
  const next=current?current+' '+word:word;
  if(ctx.measureText(next).width>maxWidth&&current){
   txt(ctx,current,x,y,font);y+=lineHeight;lines++;current=word;
   if(lines>=limit)throw Error('Text too long for one-page PDF. Shorten your content.');
  }else current=next;
 }
 if(current){txt(ctx,current,x,y,font);y+=lineHeight;}
 return y;
}
export async function generateBusinessPdf(slug:string,primary:string,secondary:string,details:string,option:string):Promise<GeneratedFile>{
 if(primary.trim().length<2||primary.length>120)throw Error('Enter a name or business name of 2–120 characters.');
 if(details.length>8000)throw Error('Maximum 8,000 characters.');
 const {canvas,ctx}=pageCanvas(),margin=86;
 if(slug==='resume-builder'){
  txt(ctx,primary,margin,155,'bold 56px Arial','#101e35');
  txt(ctx,secondary||'Professional Resume',margin,212,'30px Arial','#435b79');
  ctx.fillStyle='#2972d2';ctx.fillRect(margin,246,1068,6);
  let y=316;
  for(const [i,line] of details.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).entries()){
   if(i>22)throw Error('Resume supports up to 23 text sections/lines.');
   const pair=line.indexOf(':');
   if(pair>0&&pair<35){
    txt(ctx,line.slice(0,pair).toUpperCase(),margin,y,'bold 25px Arial','#2070d0');
    y+=36;
    y=wrapped(ctx,line.slice(pair+1),margin,y,1050,35,'27px Arial',6)+24;
   }else y=wrapped(ctx,line,margin,y,1050,36,'27px Arial',6)+14;
   if(y>1605)throw Error('Resume is too long for one page. Please shorten it.');
  }
  if(!details.trim())throw Error('Include contact details, a summary and experience.');
  txt(ctx,'Created using ToolNexa AI',margin,1680,'19px Arial','#8593a6');
  return {blob:await pdfFromCanvas(canvas),name:'toolnexa-resume.pdf',message:'Resume PDF created. Review personal details and formatting before sharing.'};
 }
 const kind=slug==='quotation-maker'?'QUOTATION':'INVOICE';
 const lines=details.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 if(!lines.length||lines.length>19)throw Error('Enter 1–19 items, one per line: Description | Quantity | Unit price.');
 const items=lines.map((line,i)=>{
  const pieces=line.split('|').map(s=>s.trim());
  if(pieces.length!==3)throw Error('Item '+(i+1)+': use Description | Quantity | Price.');
  const [description,quantity,unit]=pieces,q=Number(quantity),price=Number(unit);
  if(!description||description.length>90||!Number.isFinite(q)||q<=0||q>100000||!Number.isFinite(price)||price<0||price>1e8)throw Error('Invalid item '+(i+1)+'.');
  return {description,q,price,total:q*price};
 });
 const tax=Number(option||'0');
 if(!Number.isFinite(tax)||tax<0||tax>100)throw Error('Tax must be from 0 to 100%.');
 const fmt=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n);
 txt(ctx,kind,margin,166,'bold 65px Arial','#102440');
 txt(ctx,'From: '+primary,margin,240,'30px Arial','#273b56');
 txt(ctx,'To: '+(secondary||'Client'),margin,292,'30px Arial','#273b56');
 txt(ctx,'Date: '+new Date().toISOString().slice(0,10),margin,342,'26px Arial','#6b7891');
 ctx.fillStyle='#dce6f2';ctx.fillRect(margin,395,1068,2);
 ctx.fillStyle='#eaf2fc';ctx.fillRect(margin,408,1068,65);
 txt(ctx,'ITEM / DESCRIPTION',margin+15,450,'bold 23px Arial','#254b80');
 txt(ctx,'QTY',margin+680,450,'bold 23px Arial','#254b80');
 txt(ctx,'AMOUNT',margin+860,450,'bold 23px Arial','#254b80');
 let y=518;const maxVisible=19;
 for(const item of items.slice(0,maxVisible)){
  txt(ctx,item.description.length>36?item.description.slice(0,34)+'…':item.description,margin+15,y,'25px Arial');
  txt(ctx,String(item.q),margin+680,y,'25px Arial');
  txt(ctx,fmt(item.total),margin+860,y,'25px Arial');
  ctx.fillStyle='#e9eef4';ctx.fillRect(margin,y+16,1068,1);
  y+=49;
 }
 const subtotal=items.reduce((s,i)=>s+i.total,0);
 const taxAmount=subtotal*tax/100,total=subtotal+taxAmount;
 if(y>1470)throw Error('Too many items for this PDF template.');
 const bottom=Math.max(1490,y+85);
 txt(ctx,'Subtotal',margin+610,bottom,'27px Arial');txt(ctx,fmt(subtotal),margin+860,bottom,'bold 27px Arial');
 txt(ctx,'Tax ('+tax+'%)',margin+610,bottom+49,'27px Arial');txt(ctx,fmt(taxAmount),margin+860,bottom+49,'bold 27px Arial');
 ctx.fillStyle='#2870c7';ctx.fillRect(margin+600,bottom+75,468,3);
 txt(ctx,'TOTAL',margin+610,bottom+119,'bold 30px Arial','#19448a');txt(ctx,fmt(total),margin+860,bottom+119,'bold 30px Arial','#19448a');
 txt(ctx,'Amounts in INR. Please verify tax details and local invoice requirements.',margin,1690,'20px Arial','#8593a6');
 return {blob:await pdfFromCanvas(canvas),name:'toolnexa-'+kind.toLowerCase()+'.pdf',message:kind+' created: '+items.length+' line items, grand total '+fmt(total)+'.'};
}
