/* Optional in-browser neural 2x enhancement, based on UpscalerJS's MIT-licensed default ESRGAN-Slim model.
 * Runs on-device; output is subsequently resized to the selected 2x/4x/4K/8K dimensions.
 * Mobile networks must download weights on the first request. Do not promise reconstructed ground truth.
 */
let enginePromise:ReturnType<typeof initModel>|null=null;
async function initModel(){
 await import('@tensorflow/tfjs');
 const {default:Upscaler}=await import('upscaler');
 return new Upscaler();
}
function model(){
 if(!enginePromise)enginePromise=initModel().catch(error=>{enginePromise=null;throw error});
 return enginePromise;
}
export async function neuralEnhance2x(
 source:HTMLCanvasElement,
 onProgress:(message:string)=>void
):Promise<HTMLCanvasElement>{
 if(!source.width||!source.height)throw Error('Upload an image first.');
 onProgress('Loading the AI super-resolution model. Internet is required on first use…');
 const engine=await model();
 // Avoid oversized GPU tensors on phones. Real AI model works at 2x, the final
 // selected output may be larger using classic Lanczos-like canvas interpolation.
 const side=typeof window!=='undefined'&&window.matchMedia('(max-width: 700px)').matches?320:480;
 const ratio=Math.min(1,side/Math.max(source.width,source.height));
 const w=Math.max(1,Math.round(source.width*ratio)),h=Math.max(1,Math.round(source.height*ratio));
 const input=document.createElement('canvas');
 input.width=w;input.height=h;
 const ctx=input.getContext('2d');if(!ctx)throw Error('AI needs canvas support.');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(source,0,0,w,h);
 onProgress('AI is restoring edges and fine patterns (2× neural pass)…');
 let src:string;
 try{
  const result=await engine.upscale(input,{
   output:'base64',
   patchSize:32,
   padding:4,
   awaitNextFrame:true,
   progress:(fraction:number)=>{
    if(Number.isFinite(fraction))onProgress('AI detail pass '+Math.round(fraction*100)+'%');
   }
  });
  if(typeof result!=='string'||!result.startsWith('data:image/'))
   throw Error('AI model returned an unsupported output.');
  src=result;
 }catch(e){
  const reason=e instanceof Error?e.message:'Unknown model error';
  throw Error('AI enhancement could not finish on this device. Choose Classic (Fast) and retry. '+reason);
 }finally{
  input.width=0;input.height=0;
 }
 const img=new Image();
 await new Promise<void>((resolve,reject)=>{
  img.onload=()=>resolve();
  img.onerror=()=>reject(Error('Could not render AI enhanced photo.'));
  img.src=src;
 });
 const result=document.createElement('canvas');
 result.width=img.naturalWidth;result.height=img.naturalHeight;
 const out=result.getContext('2d');if(!out)throw Error('Canvas is unavailable');
 out.drawImage(img,0,0);
 onProgress('AI detail pass complete. Creating your chosen output resolution…');
 return result;
}
