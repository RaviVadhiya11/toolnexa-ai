/* Browser-only common file helpers. Downloads are not uploads. */
export const MAX_IMAGE_BYTES=12*1024*1024;
export function downloadFile(data:Blob,name:string){
 const url=URL.createObjectURL(data);
 const anchor=document.createElement('a');
 anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),18000);
}
export function imageBlob(canvas:HTMLCanvasElement,type='image/png',quality=.93){
 return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not render image')),type,quality));
}
export async function readImage(file:File){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose JPG, PNG or WebP.');
 if(file.size>MAX_IMAGE_BYTES)throw Error('Maximum 12 MB image.');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();
  await new Promise<void>((ok,no)=>{image.onload=()=>ok();image.onerror=()=>no(Error('Image could not be decoded'));image.src=url});
  if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>48000000)throw Error('Image exceeds supported 48 megapixels.');
  return image;
 }finally{URL.revokeObjectURL(url)}
}
export function createCanvas(image:CanvasImageSource,width:number,height:number,filter?:string){
 if(width<1||height<1||width*height>12000000)throw Error('Image is too large for the browser canvas.');
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw Error('Canvas unavailable on this device.');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 if(filter)ctx.filter=filter;
 ctx.drawImage(image,0,0,width,height);
 return canvas;
}
export function cropCanvas(image:HTMLImageElement,maxSide=1400){
 const factor=Math.min(1,maxSide/Math.max(image.naturalWidth,image.naturalHeight));
 return createCanvas(image,Math.max(1,Math.round(image.naturalWidth*factor)),Math.max(1,Math.round(image.naturalHeight*factor)));
}
export async function proDownload(canvas:HTMLCanvasElement,kind:'image'|'vector'|'cutout',scale:2|4){
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Canvas not supported');
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 if(pixels.length>2800000)throw Error('For HD export choose an image under 700,000 pixels.');
 let raw='';for(let i=0;i<pixels.length;i+=8192)raw+=String.fromCharCode(...pixels.subarray(i,i+8192));
 const response=await fetch('/api/studio/hd-export',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({width:canvas.width,height:canvas.height,pixels:btoa(raw),scale,kind})});
 if(!response.ok){const j=await response.json().catch(()=>({error:'HD export unavailable'}));throw Error(j.error||'HD export unavailable')}
 await downloadFile(await response.blob(),kind==='vector'?'toolnexa-hd-vector.png':kind==='cutout'?'toolnexa-hd-transparent.png':'toolnexa-hd-image.jpg');
}
