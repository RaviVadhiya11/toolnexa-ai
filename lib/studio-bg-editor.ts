import {createCanvas} from '@/lib/studio-suite-client';

export type BgFill='transparent'|'white'|'color'|'gradient'|'image';
export type BgBrush='erase'|'restore';
export type BgOptions={
 fill:BgFill; color:string; size:number; offsetX:number; offsetY:number; shadow:boolean;
 image?:HTMLImageElement|null;shadowStrength?:number;
};
export function composeBackground(cutout:HTMLCanvasElement,options:BgOptions){
 const w=cutout.width,h=cutout.height;
 if(!w||!h||w*h>12000000)throw Error('Image dimensions are unsupported');
 const out=document.createElement('canvas');out.width=w;out.height=h;
 const ctx=out.getContext('2d');
 if(!ctx)throw Error('Canvas unavailable');
 if(options.fill==='white'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h)}
 if(options.fill==='color'){ctx.fillStyle=options.color;ctx.fillRect(0,0,w,h)}
 if(options.fill==='gradient'){
  const grad=ctx.createLinearGradient(0,0,w,h);
  grad.addColorStop(0,options.color);grad.addColorStop(1,'#ffffff');
  ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
 }
 if(options.fill==='image'){
  const img=options.image;
  if(img&&img.naturalWidth>0&&img.naturalHeight>0){
   const ratio=Math.max(w/img.naturalWidth,h/img.naturalHeight);
   const iw=img.naturalWidth*ratio,ih=img.naturalHeight*ratio;
   ctx.drawImage(img,(w-iw)/2,(h-ih)/2,iw,ih);
  }else{ctx.fillStyle='#f5f5f5';ctx.fillRect(0,0,w,h)}
 }
 const s=Math.max(.5,Math.min(1.6,options.size/100));
 const sw=w*s,sh=h*s,dx=(w-sw)/2+options.offsetX/100*w,dy=(h-sh)/2+options.offsetY/100*h;
 if(options.shadow){
  ctx.shadowColor='rgba(0,0,0,'+(.42*Math.max(0,Math.min(100,options.shadowStrength??65))/100)+')';ctx.shadowBlur=Math.max(5,Math.round(w*.026));
  ctx.shadowOffsetX=Math.round(w*.009);ctx.shadowOffsetY=Math.round(h*.019);
 }
 ctx.drawImage(cutout,dx,dy,sw,sh);
 ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
 return out;
}
export function refineBackground(cutout:HTMLCanvasElement,original:HTMLCanvasElement,
 x:number,y:number,radius:number,action:BgBrush){
 if(cutout.width!==original.width||cutout.height!==original.height)
  throw Error('Source and mask sizes do not match');
 const w=cutout.width,h=cutout.height;
 const cutCtx=cutout.getContext('2d',{willReadFrequently:true});
 const originalCtx=original.getContext('2d',{willReadFrequently:true});
 if(!cutCtx||!originalCtx)throw Error('Canvas unavailable');
 const r=Math.max(2,Math.min(100,Math.round(radius)));
 const left=Math.max(0,Math.floor(x-r)),top=Math.max(0,Math.floor(y-r));
 const right=Math.min(w,Math.ceil(x+r+1)),bottom=Math.min(h,Math.ceil(y+r+1));
 const ww=right-left,hh=bottom-top;
 if(ww===0||hh===0)return;
 const cut=cutCtx.getImageData(left,top,ww,hh);
 const src=originalCtx.getImageData(left,top,ww,hh);
 for(let yy=0;yy<hh;yy++)for(let xx=0;xx<ww;xx++){
  const dx=xx+left-x,dy=yy+top-y,d=Math.hypot(dx,dy);
  if(d>r)continue;
  const alpha=Math.max(0,Math.min(1,(r-d)/Math.max(1,r*.25)));
  const i=(yy*ww+xx)*4;
  const prev=cut.data[i+3],target=action==='restore'?src.data[i+3]:0;
  cut.data[i+3]=Math.round(prev*(1-alpha)+target*alpha);
  if(action==='restore'){
   for(let c=0;c<3;c++)cut.data[i+c]=src.data[i+c];
  }
 }
 cutCtx.putImageData(cut,left,top);
}
