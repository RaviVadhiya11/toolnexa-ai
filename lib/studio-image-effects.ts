import {createCanvas} from '@/lib/studio-suite-client';
export function solidBackgroundCutout(source:HTMLCanvasElement,tolerance:number,feather:number){
 const canvas=createCanvas(source,source.width,source.height);
 const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
 const image=ctx.getImageData(0,0,canvas.width,canvas.height);
 const {width:w,height:h}=canvas,pixels=image.data;
 const starts=[0,w-1,(h-1)*w,h*w-1];
 const corner=starts.map(i=>Array.from(pixels.slice(i*4,i*4+3)));
 const bg=corner.reduce((a,b)=>a.map((n,c)=>n+b[c]),[0,0,0]).map(n=>n/4);
 const visited=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 function accept(i:number){
  if(i<0||visited[i])return;
  visited[i]=1;
  const k=i*4;
  const distance=Math.sqrt((pixels[k]-bg[0])**2+(pixels[k+1]-bg[1])**2+(pixels[k+2]-bg[2])**2);
  if(distance>tolerance)return;
  queue[tail++]=i;
 }
 for(let x=0;x<w;x++){accept(x);accept((h-1)*w+x)}
 for(let y=0;y<h;y++){accept(y*w);accept(y*w+w-1)}
 while(head<tail){
  const i=queue[head++],x=i%w,y=Math.floor(i/w);
  if(x>0)accept(i-1);if(x+1<w)accept(i+1);
  if(y>0)accept(i-w);if(y+1<h)accept(i+w);
 }
 const mask=new Uint8Array(w*h);
 for(let i=0;i<tail;i++)mask[queue[i]]=1;
 // Feather only along the foreground/background boundary; preserve opaque interiors.
 const original=new Uint8ClampedArray(pixels);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const index=y*w+x;if(mask[index]){pixels[index*4+3]=0;continue}
  if(feather>0){
   let nearby=0,total=0;
   for(let dy=-feather;dy<=feather;dy++)for(let dx=-feather;dx<=feather;dx++){
    if(dx*dx+dy*dy>feather*feather)continue;
    const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;
    total++;nearby+=mask[yy*w+xx];
   }
   pixels[index*4+3]=Math.round(original[index*4+3]*(1-nearby/Math.max(1,total)));
  }
 }
 ctx.putImageData(image,0,0);return canvas;
}
export function healMaskedImage(source:HTMLCanvasElement,mask:Uint8Array){
 const {width:w,height:h}=source;
 const result=createCanvas(source,w,h);const ctx=result.getContext('2d',{willReadFrequently:true})!;
 const image=ctx.getImageData(0,0,w,h),data=image.data;
 if(mask.length!==w*h)throw Error('Mask size mismatch');
 let pending=mask.reduce((a,v)=>a+(v?1:0),0);
 if(pending===0)throw Error('Paint over the unwanted area with the brush first.');
 if(pending>w*h*.4)throw Error('Select a smaller area for accurate healing (under 40%).');
 const known=new Uint8Array(w*h);
 for(let i=0;i<w*h;i++)if(!mask[i])known[i]=1;
 let frontier:number[]=[];
 for(let i=0;i<w*h;i++)if(mask[i])frontier.push(i);
 for(let pass=0;pass<Math.max(w,h)&&pending>0;pass++){
  const next:number[]=[],filled:number[]=[];
  for(const idx of frontier){
   const x=idx%w,y=Math.floor(idx/w),neighbors=[x>0?idx-1:-1,x+1<w?idx+1:-1,y>0?idx-w:-1,y+1<h?idx+w:-1];
   const valid=neighbors.filter(n=>n>=0&&known[n]);
   if(!valid.length){next.push(idx);continue}
   for(let c=0;c<4;c++){
    let value=0;for(const n of valid)value+=data[n*4+c];
    data[idx*4+c]=Math.round(value/valid.length);
   }
   filled.push(idx);
  }
  for(const idx of filled)known[idx]=1;
  pending-=filled.length;frontier=next;
  if(!filled.length)break;
 }
 if(pending>0)throw Error('Area too large to heal. Try a smaller brush region.');
 // Slight edge smoothing on the newly healed interior.
 const original=new Uint8ClampedArray(data);
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  const i=y*w+x;if(!mask[i])continue;
  for(let c=0;c<3;c++){
   let sum=original[i*4+c]*4;
   for(const k of [i-1,i+1,i-w,i+w])sum+=original[k*4+c];
   data[i*4+c]=Math.round(sum/8);
  }
 }
 ctx.putImageData(image,0,0);return result;
}
export function restorePhoto(source:HTMLCanvasElement,denoise:number,sharpness:number,colour:'original'|'sepia'|'cool'|'warm'){
 const canvas=createCanvas(source,source.width,source.height),ctx=canvas.getContext('2d',{willReadFrequently:true})!;
 const w=canvas.width,h=canvas.height,image=ctx.getImageData(0,0,w,h),original=new Uint8ClampedArray(image.data);
 const values=new Uint8ClampedArray(original);
 if(denoise>0){
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
   const i=(y*w+x)*4;
   for(let c=0;c<3;c++){
    const arr=[] as number[];
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)arr.push(original[((y+dy)*w+x+dx)*4+c]);
    arr.sort((a,b)=>a-b);
    values[i+c]=Math.round(original[i+c]*(1-denoise/100)+arr[4]*denoise/100);
   }
  }
 }
 const input=new Uint8ClampedArray(values),strength=sharpness/100;
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  const i=(y*w+x)*4;
  for(let c=0;c<3;c++){
   const v=input[i+c]*(1+4*strength)-strength*(input[i-4+c]+input[i+4+c]+input[i-w*4+c]+input[i+w*4+c]);
   values[i+c]=Math.max(0,Math.min(255,Math.round(v)));
  }
 }
 if(colour!=='original'){
  for(let i=0;i<values.length;i+=4){
   const gray=.299*values[i]+.587*values[i+1]+.114*values[i+2];
   if(colour==='sepia'){values[i]=Math.min(255,gray*1.13);values[i+1]=Math.min(255,gray*.99);values[i+2]=Math.min(255,gray*.79)}
   if(colour==='warm'){values[i]=Math.min(255,values[i]*1.05+5);values[i+1]=Math.min(255,values[i+1]*1.01);values[i+2]=Math.max(0,values[i+2]*.95)}
   if(colour==='cool'){values[i]=Math.max(0,values[i]*.94);values[i+1]=Math.min(255,values[i+1]*1.03);values[i+2]=Math.min(255,values[i+2]*1.1+4)}
  }
 }
 image.data.set(values);ctx.putImageData(image,0,0);return canvas;
}
