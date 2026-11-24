/* High-quality conventional photo enhancement on canvas.
 * Helps colour/exposure, reduces light noise and sharpens edges without inventing details.
 * The separate UpscalerJS option can run a trained neural model after this stage.
 */
export type PhotoPreset='natural'|'portrait'|'product'|'logo'|'old';
export type PhotoSettings={
 brightness:number;contrast:number;saturation:number;denoise:number;sharpness:number;
};
export const photoPresets:Record<PhotoPreset,PhotoSettings>={
 natural:{brightness:104,contrast:109,saturation:110,denoise:12,sharpness:34},
 portrait:{brightness:105,contrast:105,saturation:104,denoise:27,sharpness:21},
 product:{brightness:107,contrast:117,saturation:120,denoise:8,sharpness:53},
 logo:{brightness:100,contrast:125,saturation:112,denoise:0,sharpness:62},
 old:{brightness:107,contrast:116,saturation:106,denoise:35,sharpness:29},
};
export function enhancePhotoCanvas(source:HTMLImageElement,settings:PhotoSettings,maxSide=900){
 const max=Math.max(source.naturalWidth,source.naturalHeight);
 if(!Number.isFinite(max)||max<1)throw Error('Upload a valid image first.');
 const ratio=Math.min(1,maxSide/max);
 const w=Math.max(1,Math.round(source.naturalWidth*ratio));
 const h=Math.max(1,Math.round(source.naturalHeight*ratio));
 const canvas=document.createElement('canvas');
 canvas.width=w;canvas.height=h;
 const context=canvas.getContext('2d',{willReadFrequently:true});
 if(!context)throw Error('Image processing is not supported in this browser.');
 context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
 context.filter='brightness('+settings.brightness+'%) contrast('+settings.contrast+'%) saturate('+settings.saturation+'%)';
 context.drawImage(source,0,0,w,h);context.filter='none';
 const noise=Math.min(1,Math.max(0,settings.denoise/100));
 const sharpening=Math.min(.74,Math.max(0,settings.sharpness/100*.73));
 if(noise===0&&sharpening===0)return canvas;
 const image=context.getImageData(0,0,w,h);
 const pixels=image.data;
 // Detail-preserving neighborhood denoise with thresholded color similarity.
 if(noise>0&&w>2&&h>2){
  const before=new Uint8ClampedArray(pixels);
  const threshold=16+noise*65;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
   const index=(y*w+x)*4;
   for(let channel=0;channel<3;channel++){
    const center=before[index+channel];
    let sum=center*2,weight=2;
    for(const offset of [-w*4-4,-w*4,-w*4+4,-4,4,w*4-4,w*4,w*4+4]){
     const sample=before[index+offset+channel];
     const delta=Math.abs(sample-center);
     if(delta<threshold){const k=1-delta/Math.max(1,threshold);sum+=sample*k;weight+=k}
    }
    pixels[index+channel]=Math.round(center*(1-noise*.85)+(sum/weight)*noise*.85);
   }
  }
 }
 if(sharpening>0&&w>2&&h>2){
  const before=new Uint8ClampedArray(pixels);
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
   const i=(y*w+x)*4;
   for(let channel=0;channel<3;channel++){
    const center=before[i+channel];
    const neighborhood=(before[i-4+channel]+before[i+4+channel]+before[i-w*4+channel]+before[i+w*4+channel])/4;
    const value=center+(center-neighborhood)*sharpening;
    pixels[i+channel]=Math.max(0,Math.min(255,Math.round(value)));
   }
  }
 }
 context.putImageData(image,0,0);
 return canvas;
}
