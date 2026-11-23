export type UpscaleResolution='2x'|'4x'|'4k'|'8k';
export type UpscalePlan='Free'|'Starter'|'Pro'|'Premium'|'Max';
export function canUpscale(plan:UpscalePlan,resolution:UpscaleResolution){
 if(plan==='Free')return false;
 if(resolution==='8k')return plan==='Premium'||plan==='Max';
 if(resolution==='4x'||resolution==='4k')return plan==='Pro'||plan==='Premium'||plan==='Max';
 return true;
}
export function upscaleDimensions(width:number,height:number,resolution:UpscaleResolution){
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width*height>48000000)
  throw Error('Invalid source dimensions.');
 let w=width,h=height;
 if(resolution==='2x'||resolution==='4x'){
  const factor=resolution==='2x'?2:4;w=width*factor;h=height*factor;
 }else{
  const box=resolution==='4k'?{w:3840,h:2160}:{w:7680,h:4320};
  // Portrait / square use the same pixel-area class with portrait-friendly dimensions.
  const fit=width>height?Math.min(box.w/width,box.h/height):
   height>width?Math.min(box.h/width,box.w/height):
   Math.min(box.h/width,box.h/height);
  w=Math.round(width*fit);h=Math.round(height*fit);
 }
 if(w<1||h<1||w*h>33500000)
  throw Error('Requested export is too large for reliable browser processing. Try 4K or a smaller input.');
 return {width:w,height:h,pixels:w*h};
}
