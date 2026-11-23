/* Client-side U2Netp salient-object model, Apache-2.0 weights. No image uploads. */
import * as ort from 'onnxruntime-web';
import {createCanvas} from '@/lib/studio-suite-client';
const MODEL='https://huggingface.co/nfa04/u2netp-onnx/resolve/main/u2netp.onnx';
let ready:Promise<ort.InferenceSession>|null=null;
async function getSession(){
 if(!ready){
  ort.env.wasm.wasmPaths='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/dist/';
  ort.env.wasm.numThreads=1;
  ready=ort.InferenceSession.create(MODEL,{executionProviders:['wasm']}).catch(error=>{ready=null;throw error});
 }
 return ready;
}
export async function aiCutout(source:HTMLCanvasElement,onStep?:(step:string)=>void){
 onStep?.('Loading 4.6 MB open-source AI model. First run needs internet…');
 const session=await getSession();
 const thumb=createCanvas(source,320,320);
 const ctx=thumb.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw Error('Canvas unavailable');
 const rgba=ctx.getImageData(0,0,320,320).data;
 const input=new Float32Array(3*320*320);
 const means=[.485,.456,.406],stds=[.229,.224,.225];
 for(let i=0;i<320*320;i++)for(let c=0;c<3;c++)
  input[c*320*320+i]=((rgba[i*4+c]/255)-means[c])/stds[c];
 onStep?.('AI is separating foreground and background…');
 const outputs=await session.run({[session.inputNames[0]]:new ort.Tensor('float32',input,[1,3,320,320])});
 const prediction=outputs[session.outputNames[0]].data as Float32Array;
 if(!prediction||prediction.length<320*320)throw Error('AI model returned an invalid mask.');
 let minimum=Infinity,maximum=-Infinity;
 for(let i=0;i<320*320;i++){minimum=Math.min(minimum,prediction[i]);maximum=Math.max(maximum,prediction[i])}
 const gray=new Uint8ClampedArray(320*320*4);
 for(let i=0;i<320*320;i++){
  const value=Math.max(0,Math.min(255,Math.round((prediction[i]-minimum)/Math.max(1e-6,maximum-minimum)*255)));
  gray[i*4]=value;gray[i*4+1]=value;gray[i*4+2]=value;gray[i*4+3]=255;
 }
 const mask=document.createElement('canvas');mask.width=320;mask.height=320;
 mask.getContext('2d')?.putImageData(new ImageData(gray,320,320),0,0);
 const scaled=createCanvas(mask,source.width,source.height);
 const alpha=scaled.getContext('2d',{willReadFrequently:true})?.getImageData(0,0,source.width,source.height).data;
 if(!alpha)throw Error('Mask could not be resized.');
 const output=createCanvas(source,source.width,source.height);
 const outCtx=output.getContext('2d',{willReadFrequently:true});
 if(!outCtx)throw Error('Canvas unavailable');
 const pixels=outCtx.getImageData(0,0,output.width,output.height);
 for(let i=0;i<pixels.data.length;i+=4){
  // Soft alpha values preserve hairs and edges better than a hard threshold.
  const value=alpha[i]/255;
  pixels.data[i+3]=Math.round(pixels.data[i+3]*Math.min(1,Math.max(0,(value-.025)/.96)));
 }
 outCtx.putImageData(pixels,0,0);onStep?.('AI foreground mask ready.');
 return output;
}
