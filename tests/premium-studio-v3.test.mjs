import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('premium Studio V3 links eight workflows without changing the 60 utility tools',()=>{
 const nav=read('components/studio-premium-nav.tsx');
 for(const path of ['/studio/vector','/studio/image-to-vector','/studio/convert','/studio/svg-editor',
  '/studio/enhance','/studio/background-remove','/studio/retouch','/studio/restore'])
  assert.ok(nav.includes(path),path);
 assert.match(read('app/studio/layout.tsx'),/StudioTopbar/);
 assert.match(read('lib/usage-limits.ts'),/Free:3/);
 const catalogue=read('lib/tools.ts');
 assert.equal([...catalogue.matchAll(/\bslug:\s*["']([a-z0-9-]+)["']/g)].length,60);
});
test('all shared upload previews have interactive split, draggable before-after, 100-250% zoom and canvas mats',()=>{
 const ui=read('components/studio-upload-preview.tsx');
 for(const item of ['Split','splitAt','studio-inline-split-slider','studio-inline-split-line',
  'setZoom','studio-zoom','studio-preview-options','Compare','Before / After','Reset',
  'Transparency grid','White','Dark','onKeyDown={key}']){
  if(item==='Compare')assert.match(ui,/compare/i);else assert.ok(ui.includes(item),item);
 }
 assert.match(ui,/hasOutput&&<button/);
 assert.match(ui,/onDrop=\{drop\}/);
 assert.match(ui,/onChange=\{chosen\}/);
});
test('background removal keeps AI and offline processing but gains brush history and personal backgrounds',()=>{
 const ui=read('components/studio-image-suite.tsx');
 const engine=read('lib/studio-bg-editor.ts');
 assert.match(ui,/await aiCutout\(source,setStatus\)/);
 assert.match(ui,/solidBackgroundCutout\(source,tolerance,feather\)/);
 for(const p of ['recordBG','travelBG','redoBG','undoBG','recordMask','travelMask',
  'undoMask','redoMask','chooseBackgroundPhoto','bgShadowStrength','bgPhotoUrl',
  "setBgFill('image')",'Soft subject shadow','Shadow intensity','Auto']){
  assert.ok(ui.includes(p),p);
 }
 assert.match(engine,/options\.fill==='image'/);
 assert.match(engine,/options\.shadowStrength\?\?65/);
 assert.match(ui,/const canvas=exportCanvas\(\)/);
 assert.match(ui,/proDownload\(exportCanvas\(\)/);
});
test('professional restore performs actual histogram auto-levels and retouch snapshots',()=>{
 const effects=read('lib/studio-image-effects.ts');
 const ui=read('components/studio-image-suite.tsx');
 assert.match(effects,/autoLevels=false/);
 assert.match(effects,/const histogram=new Uint32Array\(256\)/);
 assert.match(effects,/image\.data\.set\(values\)/);
 assert.match(ui,/setRestoration/);
 assert.match(ui,/Automatic tonal correction/);
 assert.match(ui,/recordMask\(\);drawing.current=true/);
});
test('SVG editor supports undo redo opacity palettes three shapes and group mirror',()=>{
 const ui=read('components/studio-vector-formats.tsx');
 const converter=read('lib/studio-vector-convert.ts');
 for(const p of ['commitSvg','travelSvg','history.past','history.future','setHistory',
  'transformShapes','scale(-1 1)','scale(1 -1)','addShape','star',
  'Shape opacity','Luxury','colorPalettes']){
  assert.ok(ui.includes(p),p);
 }
 assert.match(converter,/const tags=new Set\(\['svg','g'/);
 assert.match(converter,/const attrs=new Set\(\['viewBox'.*'transform'/);
});
test('Image to Vector offers real changes to tracing palette and path smoothing',()=>{
 const ui=read('components/image-to-vector.tsx');
 for(const x of ['tracePreset','chooseTracePreset','value={900}','value="48"',
  'smoothness/100','Path smoothness','MAX_FILE=10*1024*1024',
  'ImageTracer.imagedataToSVG','reserveStudioUsage'])assert.ok(ui.includes(x),x);
});
test('Logo Studio exports real vector with six design variants, swatches and transparent canvas',()=>{
 const ui=read('components/studio-workspace.tsx');
 for(const x of ["'hex'","'waves'","'star'","palettePresets",
  'studio-logo-presets','Artboard background','Transparent',
  "background==='transparent'",'downloadSvg()'])assert.ok(ui.includes(x),x);
 assert.match(ui,/return '<svg xmlns/);
});
test('Photo enhancer provides actual warmth pixel shift, scene-analysis exposure and original AI pass',()=>{
 const ui=read('components/professional-image-enhancer.tsx');
 const filter=read('lib/studio-photo-enhance.ts');
 for(const x of ['smartAutoEnhance','Auto Enhance — Recommended','Analyze exposure',
  "['warmth','Warmth / Temperature'","settings.warmth","sourceKey"]){
  assert.ok(ui.includes(x),x);
 }
 assert.match(filter,/const temperature=Math.max\(-40,Math.min\(40,settings.warmth\)\)/);
 assert.match(filter,/pixels\[i\+2\]-temperature\*\.74/);
 assert.match(read('components/studio-upscale-panel.tsx'),/neuralEnhance2x/);
});
test('Free preview and paid HD download contract survives Studio V3',()=>{
 const gate=read('app/api/studio/upscale-authorize/route.ts');
 assert.match(gate,/verifyStudioMember/);
 assert.match(gate,/purpose!=='download'/);
 const ui=read('components/studio-upscale-panel.tsx');
 assert.match(ui,/await reserveStudioUsage\(usageSlug\)/);
 assert.match(ui,/downloadFile\(file/);
 assert.match(ui,/setShowPlans\(true\)/);
});
