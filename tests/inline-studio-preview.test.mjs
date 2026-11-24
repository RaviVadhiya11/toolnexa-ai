import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('all eight Studio tools use same upload/design area for live preview',()=>{
 const enhancer=read('components/professional-image-enhancer.tsx');
 const suite=read('components/studio-image-suite.tsx');
 const toVector=read('components/image-to-vector.tsx');
 const formats=read('components/studio-vector-formats.tsx');
 const vector=read('components/studio-workspace.tsx');
 assert.match(enhancer,/StudioUploadPreview/);
 assert.match(enhancer,/outputUrl=\{previewUrl\}/);
 assert.match(suite,/StudioUploadPreview/);
 assert.match(suite,/outputUrl=\{mode==='retouch'\?resultUrl\|\|originalUrl:resultUrl\}/);
 assert.match(toVector,/StudioUploadPreview/);
 assert.match(toVector,/outputUrl=\{svgUrl\}/);
 assert.match(formats,/StudioUploadPreview/);
 assert.match(formats,/sourceUrl=\{preview\}/);
 assert.match(vector,/studio-inline-preset-stage/);
 for(const id of ['/studio/enhance','/studio/background-remove','/studio/retouch','/studio/restore',
  '/studio/image-to-vector','/studio/convert','/studio/svg-editor','/studio/vector'])
  assert.ok(read('app/studio/page.tsx').includes("href:'"+id+"'"),id);
});

test('common upload control shows processed image and offers compare replace zoom and reset',()=>{
 const ui=read('components/studio-upload-preview.tsx');
 for(const part of ['sourceUrl','outputUrl','onFile','onDrop={drop}','onChange={chosen}',
  'compare','Replace','Zoom','Reset','studio-inline-stage','studio-inline-state','editor?:ReactNode'])
  assert.ok(ui.includes(part),part);
 assert.match(ui,/hasOutput&&<button/);
 assert.match(ui,/editor\?<div className="studio-inline-custom">/);
});
test('BG editor supports genuine alpha restoration, erase, color, positioning and exported composites',()=>{
 const ops=read('lib/studio-bg-editor.ts');
 const ui=read('components/studio-image-suite.tsx');
 for(const part of ['refineBackground','composeBackground','erase','restore','fill','color',
  'gradient','offsetX','offsetY','shadow'])assert.ok(ops.includes(part),part);
 assert.match(ops,/cut\.data\[i\+3\]=Math\.round/);
 assert.match(ops,/src\.data\[i\+3\]/);
 assert.match(ui,/bgCanvas/);
 assert.match(ui,/onPointerDown=\{e=>\{bgDrawing/);
 assert.match(ui,/onPointerMove=\{e=>\{if\(bgDrawing/);
 assert.match(ui,/onPointerUp=\{finishBgBrush\}/);
 assert.match(ui,/Transparent PNG/);
 assert.match(ui,/Soft subject shadow/);
 assert.match(ui,/const canvas=exportCanvas\(\)/);
 assert.match(ui,/await proDownload\(exportCanvas\(\)/);
 assert.match(ui,/getCanvas=\{async\(\)=>exportCanvas\(\)\}/);
});
test('membership and Free 3 shared daily usage restrictions stay in effect',()=>{
 assert.match(read('lib/usage-limits.ts'),/Free:3/);
 assert.match(read('components/studio-image-suite.tsx'),/await reserveStudioUsage\('studio-'/);
 assert.match(read('components/studio-upscale-panel.tsx'),/purpose:'download'/);
 assert.match(read('app/api/studio/upscale-authorize/route.ts'),/verifyStudioMember\(\)/);
});
