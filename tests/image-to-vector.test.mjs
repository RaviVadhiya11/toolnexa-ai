import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('real ImageTracer makes true editable SVG path geometry from pixel data',()=>{
 const ImageTracer=require('imagetracerjs');
 const w=32,h=32;
 const data=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;
  const black=x>=6&&x<=26&&y>=6&&y<=26&&!(x>=12&&x<=20&&y>=12&&y<=20);
  data[i]=black?10:245;data[i+1]=black?20:245;data[i+2]=black?30:245;data[i+3]=255;
 }
 const svg=ImageTracer.imagedataToSVG({width:w,height:h,data},{
  numberofcolors:2,colorsampling:2,colorquantcycles:3,pathomit:0,
  ltres:1,qtres:1,viewbox:true,strokewidth:0
 });
 assert.match(svg,/<svg\b/);
 assert.match(svg,/<path\b/,'Must contain traced path data');
 assert.match(svg,/\bd="/,'Must contain vector drawing instructions');
 assert.doesNotMatch(svg,/<image\b|data:image|<foreignObject\b/,'SVG must not wrap an embedded bitmap');
});
test('vector page displays an image upload and real raster-to-path converter ahead of presets',()=>{
 const page=read('app/studio/vector/page.tsx');
 const importer=page.indexOf('<ImageToVector/>');
 assert.ok(importer>=0);
 assert.ok(importer<page.indexOf('<StudioWorkspace mode="vector"/>'),'Upload-to-vector must be prominent');
 const ui=read('components/image-to-vector.tsx');
 for(const word of ['StudioUploadPreview','image/png,image/jpeg,image/webp','Trace Image to Vector',
  'ImageTracer.imagedataToSVG','Download SVG Vector','setSvg(result.xml)',
  '/api/studio/hd-export','role="status"','before-after']){
  if(word==='before-after')assert.match(ui,/vectorize-before-after/);
  else assert.ok(ui.includes(word),'Missing '+word);
 }
 assert.ok(ui.includes("!xml.includes('<path')"),'Reject missing real vector paths');
 assert.match(ui,/MAX_FILE=10\*1024\*1024/);
 const pkg=JSON.parse(read('package.json'));
 assert.equal(pkg.dependencies.imagetracerjs,'1.2.6');
});
