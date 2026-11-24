import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('V4 reference design applies to all 60 original utility routes and 8 Studio routes',()=>{
 const tools=read('lib/tools.ts');
 assert.equal([...tools.matchAll(/\bslug:\s*["']([a-z0-9-]+)["']/g)].length,60);
 const page=read('app/tools/[slug]/page.tsx');
 assert.match(page,/<ToolRunner key=\{slug\}/);
 assert.match(page,/<AdvancedToolRunner key=\{slug\}/);
 assert.match(read('components/tool-runner.tsx'),/ToolUploadPreview files=\{files\}/);
 assert.match(read('components/advanced-tool-runner.tsx'),/ToolUploadPreview files=\{\[file\]\}/);
 const css=read('app/globals.css');
 for(const cssPart of ['ToolNexa V4','tool-workspace','.premium-main','.tier-card','.premium-home-hero',
  '.tool-upload-preview','.tool-file-input','.tool-quota-panel','@media(max-width:670px)'])
  assert.ok(css.includes(cssPart),cssPart);
 const nav=read('components/studio-premium-nav.tsx');
 assert.match(nav,/>V4<\/span>/);
 for(const id of ['/studio/vector','/studio/image-to-vector','/studio/convert','/studio/svg-editor',
  '/studio/enhance','/studio/background-remove','/studio/retouch','/studio/restore'])
  assert.ok(nav.includes(id),id);
 assert.match(read('app/page.tsx'),/Free users receive 3 shared daily runs/);
});
test('utility upload preview uses revocable local object URLs, real metadata and no server upload',()=>{
 const ui=read('components/tool-upload-preview.tsx');
 assert.match(ui,/URL.createObjectURL\(file\)/);
 assert.match(ui,/URL.revokeObjectURL\(url\)/);
 assert.match(ui,/file.type.startsWith\('image\/'\)/);
 assert.match(ui,/readableBytes\(file.size\)/);
 assert.match(ui,/PDF document/);
 assert.doesNotMatch(ui,/fetch\(/);
});
test('all eight Studio tools have original-stage before/after, press/hold comparison, fit and 2x inspection',()=>{
 const preview=read('components/studio-upload-preview.tsx');
 for(const part of ['holdOriginal','onPointerDown','onPointerUp','onPointerCancel','onBlur','Fit',
  '2× Inspect','studio-inline-split-slider','studio-inline-split-line','Transparency grid',
  'Replace','onDrop={drop}','setZoom','studio-v4'])if(part!=='studio-v4')assert.ok(preview.includes(part),part);
 for(const file of ['components/professional-image-enhancer.tsx','components/studio-image-suite.tsx',
  'components/image-to-vector.tsx','components/studio-vector-formats.tsx']){
  const ui=read(file);
  assert.match(ui,/StudioUploadPreview/);
  assert.match(ui,/onPreviewChange=\{setUpscaledPreview\}/);
 }
 const logo=read('components/studio-workspace.tsx');
 assert.match(logo,/onPreviewChange=\{setUpscaledPreview\}/);
});
test('enhancer V4 large preview stage, truthful local sample scenes and live previews',()=>{
 const enhancer=read('components/professional-image-enhancer.tsx');
 const demo=read('lib/studio-sample-scenes.ts');
 assert.match(enhancer,/studio-v4-samples/);
 assert.match(enhancer,/loadSample/);
 assert.match(enhancer,/upscaledPreview\|\|previewUrl/);
 assert.match(enhancer,/studio-v4-detailed-compare/);
 assert.match(enhancer,/StudioUpscalePanel getCanvas=\{processedCanvas\}/);
 assert.match(demo,/new File\(\[blob\]/);
 assert.match(demo,/Locally generated illustrative sample scenes/);
 const css=read('app/studio/studio.css');
 assert.match(css,/grid-template-columns:minmax\(0,1\.48fr\) minmax\(320px,\.86fr\)/);
 assert.match(css,/\.photo-enhance-preview-group\{grid-column:1;grid-row:1;position:sticky/);
});
test('V4 upscale gives real format and quality export, interactive resolution/engine cards, protected download',()=>{
 const ui=read('components/studio-upscale-panel.tsx');
 for(const key of ["'2x'","'4x'","'4k'","'8k'","'webp'","'jpeg'","'png'",
  'studio-v4-scale-grid','studio-v4-engine-grid','studio-v4-export-options','studio-v4-process',
  'onPreviewChange?.(url)','imageBlob(canvas,mime,exportQuality/100)',
  'if(file.type!==mime)','onClick={()=>void download()}'])assert.ok(ui.includes(key),key);
 assert.match(ui,/response\.status===401\|\|response\.status===403/);
 assert.match(ui,/if\(!response.ok\|\|data.authorized!==true\)throw/);
 assert.match(ui,/downloadFile\(file/);
 const auth=ui.indexOf('data.authorized!==true'),blob=ui.indexOf('const file=await imageBlob(canvas');
 assert.ok(auth<blob,'Full-size export only after paid authorization');
 const route=read('app/api/studio/upscale-authorize/route.ts');
 assert.match(route,/verifyStudioMember\(\)/);
 assert.match(route,/8K download requires Premium or Max/);
});
test('no demo-only GPU, INR or fake local subscription unlock reaches production',()=>{
 const pages=['components/studio-upscale-panel.tsx','components/professional-image-enhancer.tsx',
  'components/premium-plan-modal.tsx','components/studio-premium-download.tsx'];
 for(const file of pages){
  const ui=read(file);
  assert.doesNotMatch(ui,/Unlimited Cloud AI GPU|Cloud AI GPU \(Real-ESRGAN\)|activateDemoPro|₹299|UPI\s*\/\s*GPay/);
 }
 const price=read('components/premium-pricing.tsx');
 assert.match(price,/subscriptionPrices/);
 assert.match(read('lib/usage-limits.ts'),/Free:3/);
});
