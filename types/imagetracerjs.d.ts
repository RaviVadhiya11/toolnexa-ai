declare module 'imagetracerjs' {
 type ImageTracerOptions={
  pathomit?:number;ltres?:number;qtres?:number;blurradius?:number;
  numberofcolors?:number;colorsampling?:number;colorquantcycles?:number;
  strokewidth?:number;viewbox?:boolean;scale?:number;roundcoords?:number;
  desc?:boolean;
 };
 const ImageTracer:{
  imagedataToSVG(image:ImageData,options?:ImageTracerOptions):string;
 };
 export default ImageTracer;
}
