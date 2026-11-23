import {PDFDocument} from 'pdf-lib';
import type {GeneratedFile} from './advanced-file-ops';
function saveCanvas(canvas:HTMLCanvasElement,type:string,quality=.88):Promise<Blob>{
 return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Image export unavailable in this browser.')),type,quality));
}
function canvas(w:number,h:number):[HTMLCanvasElement,CanvasRenderingContext2D]{
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>30_000_000||w>8000||h>8000)
  throw Error('Image size must be positive and at most 30 megapixels.');
 const el=document.createElement('canvas');el.width=w;el.height=h;
 const ctx=el.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Canvas not supported.');
 ctx.imageSmoothingQuality='high';return [el,ctx];
}
async function load(file:File):Promise<ImageBitmap>{
 if(!file||file.size>25*1024*1024||!/^image\/(png|jpeg|webp|gif|bmp)$/.test(file.type))
  throw Error('Choose a PNG, JPG, WebP, GIF or BMP image up to 25 MB.');
 if(typeof createImageBitmap!=='function')throw Error('Please use a modern browser supporting image processing.');
 const img=await createImageBitmap(file);
 if(img.width*img.height>40_000_000){img.close();throw Error('Image too large (40 megapixels maximum).');}
 return img;
}
function cover(ctx:CanvasRenderingContext2D,img:ImageBitmap,x:number,y:number,w:number,h:number){
 const scale=Math.max(w/img.width,h/img.height),sw=w/scale,sh=h/scale;
 ctx.drawImage(img,(img.width-sw)/2,(img.height-sh)/2,sw,sh,x,y,w,h);
}
function parseColor(v:string):[number,number,number]|null{
 const m=/^#?([0-9A-Fa-f]{6})$/.exec(v.trim());if(!m)return null;
 return [parseInt(m[1].slice(0,2),16),parseInt(m[1].slice(2,4),16),parseInt(m[1].slice(4),16)];
}
export async function processAdvancedImage(slug:string,file:File,primary:string,secondary:string,option:string):Promise<GeneratedFile>{
 const img=await load(file);
 try{
  const W=img.width,H=img.height;
  if(slug==='image-to-base64'){
   if(file.size>2*1024*1024)throw Error('Base64 data output limited to 2 MB images.');
   return {blob:new Blob([await file.arrayBuffer()]),name:'',message:'DATA_URL_TO_DISPLAY'};
  }
  if(slug==='color-picker'){
   const x=Number(primary||'50'),y=Number(secondary||'50');
   if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>100||y<0||y>100)throw Error('Pick X and Y from 0 to 100%.');
   const [c,ctx]=canvas(W,H);ctx.drawImage(img,0,0);
   const rgb=ctx.getImageData(Math.min(W-1,Math.floor((x/100)*W)),Math.min(H-1,Math.floor((y/100)*H)),1,1).data;
   const hex='#'+[rgb[0],rgb[1],rgb[2]].map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
   return {blob:new Blob(),name:'',message:hex+'\nRGB: '+rgb[0]+', '+rgb[1]+', '+rgb[2]};
  }
  if(slug==='passport-photo-maker'){
   const [sheet,ctx]=canvas(1240,1754);
   ctx.fillStyle='white';ctx.fillRect(0,0,1240,1754);
   const pw=Math.round(35/210*1240),ph=Math.round(45/297*1754),gap=22;
   const cols=Math.floor((1240-80+gap)/(pw+gap)),rows=Math.floor((1754-120+gap)/(ph+gap));
   let count=0;
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const dx=40+x*(pw+gap),dy=50+y*(ph+gap);
    cover(ctx,img,dx,dy,pw,ph);
    ctx.strokeStyle='#cccccc';ctx.lineWidth=1;ctx.strokeRect(dx-.5,dy-.5,pw+1,ph+1);count++;
   }
   const pdf=await PDFDocument.create();const jpg=await saveCanvas(sheet,'image/jpeg',.92);
   const embedded=await pdf.embedJpg(await jpg.arrayBuffer());
   const page=pdf.addPage([595.28,841.89]);
   page.drawImage(embedded,{x:0,y:0,width:595.28,height:841.89});
   return {blob:new Blob([new Uint8Array(await pdf.save())],{type:'application/pdf'}),name:'toolnexa-passport-photos-A4.pdf',message:count+' photos on A4 at 35 × 45 mm. Print at 100% scale; verify local passport size rules.'};
  }
  let width=W,height=H;
  if(slug==='aspect-ratio-resizer'){
   const ratio=option==='9:16'?9/16:option==='16:9'?16/9:option==='1:1'?1:option==='4:5'?4/5:NaN;
   if(!Number.isFinite(ratio))throw Error('Choose a valid aspect ratio.');
   width=Math.round(Number(primary||1080));
   if(!Number.isInteger(width)||width<100||width>4000)throw Error('Output width must be 100–4000 pixels.');
   height=Math.round(width/ratio);
  }
  if(slug==='image-cropper'){
   const bits=primary.split(',').map(n=>Number(n.trim()));
   if(bits.length!==4||bits.some(n=>!Number.isInteger(n)))throw Error('Crop input must be X,Y,Width,Height, e.g. 0,0,500,500.');
   const [x,y,w,h]=bits;
   if(x<0||y<0||w<1||h<1||x+w>W||y+h>H)throw Error('Crop region must fit within the image ('+W+'×'+H+').');
   const [c,ctx]=canvas(w,h);ctx.drawImage(img,x,y,w,h,0,0,w,h);
   return {blob:await saveCanvas(c,'image/png'),name:'toolnexa-cropped.png',message:'Cropped '+w+' × '+h+' pixels at '+x+', '+y+'.'};
  }
  if(slug==='image-compressor'){
   const quality=Number(primary||'75');
   if(!Number.isInteger(quality)||quality<20||quality>95)throw Error('Quality must be 20–95%.');
   const scale=Math.min(1,3500/Math.max(W,H));
   const [c,ctx]=canvas(Math.round(W*scale),Math.round(H*scale));
   ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0,c.width,c.height);
   const mime=option==='webp'?'image/webp':'image/jpeg';
   const blob=await saveCanvas(c,mime,quality/100);
   if(blob.type!==mime)throw Error('This browser does not support the selected export format.');
   const delta=Math.round((1-blob.size/file.size)*100);
   return {blob,name:'toolnexa-compressed.'+(mime==='image/webp'?'webp':'jpg'),message:'Original '+Math.round(file.size/1024)+' KB → '+Math.round(blob.size/1024)+' KB ('+(delta>=0?delta+'% smaller':Math.abs(delta)+'% larger')+').'};
  }
  const [c,ctx]=canvas(width,height);
  if(slug==='aspect-ratio-resizer'){
   if(secondary==='contain'){
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);
    const scale=Math.min(width/W,height/H);
    ctx.drawImage(img,(width-W*scale)/2,(height-H*scale)/2,W*scale,H*scale);
   }else cover(ctx,img,0,0,width,height);
  }else if(slug==='image-flipper'){
   if(option==='horizontal'){ctx.translate(width,0);ctx.scale(-1,1)}
   else if(option==='vertical'){ctx.translate(0,height);ctx.scale(1,-1)}
   else if(option==='rotate180'){ctx.translate(width,height);ctx.rotate(Math.PI)}
   ctx.drawImage(img,0,0,width,height);
  }else ctx.drawImage(img,0,0,width,height);
  if(slug==='image-watermark'){
   if(!primary.trim())throw Error('Enter watermark text.');
   ctx.font='bold '+Math.max(18,Math.min(84,width/18))+'px sans-serif';
   ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillText(primary.slice(0,60),width/2+2,height/2+2,width*.90);
   ctx.fillStyle='rgba(255,255,255,.87)';ctx.fillText(primary.slice(0,60),width/2,height/2,width*.90);
  }
  if(slug==='background-remover'){
   const tolerance=Number(secondary||'45');
   if(!Number.isFinite(tolerance)||tolerance<0||tolerance>200)throw Error('Tolerance must be between 0 and 200.');
   const data=ctx.getImageData(0,0,width,height);
   const pix=data.data;
   const chosen=parseColor(primary);
   const ref=chosen||[pix[0],pix[1],pix[2]];
   for(let i=0;i<pix.length;i+=4){
    const delta=Math.sqrt((pix[i]-ref[0])**2+(pix[i+1]-ref[1])**2+(pix[i+2]-ref[2])**2);
    // Gradual falloff keeps edges smoother than a hard cut.
    const alpha=Math.max(0,Math.min(1,(delta-tolerance)/30));
    pix[i+3]=Math.round(pix[i+3]*alpha);
   }
   ctx.putImageData(data,0,0);
  }
  const blob=await saveCanvas(c,'image/png');
  const names:Record<string,string>={'image-watermark':'watermarked','background-remover':'transparent','image-flipper':'flipped','aspect-ratio-resizer':'aspect-resized'};
  return {blob,name:'toolnexa-'+(names[slug]||'image')+'.png',message:'Saved '+width+' × '+height+' PNG. '+(slug==='background-remover'?'Solid-color backgrounds work best; complex scenes need true AI segmentation.':'')};
 }finally{img.close()}
}
