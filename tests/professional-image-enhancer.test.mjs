import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('image enhancer uses separate fully interactive photo workspace',()=>{
 const page=file('app/studio/enhance/page.tsx');
 const ui=file('components/professional-image-enhancer.tsx');
 assert.match(page,/ProfessionalImageEnhancer/);
 for(const marker of [
  'onDrop={drop}', 'image/jpeg,image/png,image/webp','MAX_IMAGE=10*1024*1024',
  "setCompare(","photo-compare-range","Auto Enhance — Recommended",
  "photoPresets","photo-adjust-","Preview","StudioUpscalePanel",
  'usageSlug="studio-enhance"','enableAI'
 ])assert.ok(ui.includes(marker),'Missing interactive enhancer control: '+marker);
});
test('five photo presets add browser-side sharpness, color and noise controls',()=>{
 const code=file('lib/studio-photo-enhance.ts');
 for(const word of ['natural','portrait','product','logo','old','sharpening','denoise','noise','brightness','contrast','saturation','getImageData'])
  assert.ok(code.includes(word),'Missing '+word);
 assert.match(code,/context\.putImageData\(image,0,0\)/);
});
test('experimental neural detail is real learned 2x model and is optional',()=>{
 const model=file('lib/studio-neural-upscale.ts');
 const panel=file('components/studio-upscale-panel.tsx');
 assert.match(model,/import\('upscaler'\)/);
 assert.match(model,/import\('@tensorflow\/tfjs'\)/);
 assert.match(model,/engine\.upscale\(input/);
 assert.match(model,/patchSize:32/);
 assert.match(model,/padding:4/);
 assert.match(model,/side=typeof window.*320:480/);
 assert.match(panel,/enableAI&&engine==='ai'&&format==='photo'/);
 assert.match(panel,/neuralEnhance2x/);
 assert.match(panel,/Classic HD/);
 assert.match(panel,/AI Detail/);
 assert.match(panel,/setResult\(blob\)/);
 const pkg=JSON.parse(file('package.json'));
 assert.equal(pkg.dependencies.upscaler,'1.0.0');
 assert.ok(pkg.dependencies['@tensorflow/tfjs']);
});
test('Free 3 previews/day and verified paid downloads are retained in upscale panel',()=>{
 const ui=file('components/studio-upscale-panel.tsx');
 assert.match(ui,/await reserveStudioUsage\(usageSlug\)/);
 assert.match(ui,/onClick=\{\(\)=>void download\(\)\}/);
 assert.match(ui,/purpose:'download'/);
 assert.match(ui,/response\.status===401\|\|response\.status===403/);
 assert.match(ui,/setShowPlans\(true\)/);
 assert.match(ui,/Preview only|PREVIEW ONLY/);
 const api=file('app/api/studio/upscale-authorize/route.ts');
 assert.match(api,/verifyStudioMember/);
 assert.doesNotMatch(api,/consume_daily_tool_usage/);
 const limits=file('lib/usage-limits.ts');
 assert.match(limits,/Free:3/);
});
