import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const engineSource=read('lib/passport-social-engine.ts');
const output=ts.transpileModule(engineSource,{compilerOptions:{
 module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022
}}).outputText;
const engine=await import('data:text/javascript;base64,'+Buffer.from(output,'utf8').toString('base64'));

test('Passport demo dimensions: 35x45 mm, 2x2 inch, 50x70 mm at actual 300/600 PPI',()=>{
 assert.deepEqual(engine.outputPixels(engine.passportPresets[0]),{width:413,height:531});
 assert.deepEqual(engine.outputPixels(engine.passportPresets[1]),{width:600,height:600});
 assert.deepEqual(engine.outputPixels(engine.passportPresets[2]),{width:591,height:827});
 assert.deepEqual(engine.outputPixels(engine.passportPresets[0],600),{width:827,height:1063});
 assert.throws(()=>engine.outputPixels({...engine.passportPresets[0],w:151}),/15–150 mm/);
});
test('Passport and social media retain existing dimensions and add advanced application and profile presets',()=>{
 assert.equal(engine.passportPresets.length,6);
 assert.equal(engine.socialPresets.length,14);
 assert.deepEqual(engine.outputPixels(engine.passportPresets.find(p=>p.id==='exam')),{width:200,height:230});
 assert.deepEqual(engine.outputPixels(engine.passportPresets.find(p=>p.id==='25x35')),{width:295,height:413});
 assert.deepEqual(engine.outputPixels(engine.socialPresets.find(p=>p.id==='whatsapp')),{width:800,height:800});
 const get=id=>engine.socialPresets.find(p=>p.id===id);
 assert.deepEqual(engine.outputPixels(get('igpost')),{width:1080,height:1080});
 assert.deepEqual(engine.outputPixels(get('igportrait')),{width:1080,height:1350});
 assert.deepEqual(engine.outputPixels(get('story')),{width:1080,height:1920});
 assert.deepEqual(engine.outputPixels(get('youtube')),{width:1280,height:720});
 assert.deepEqual(engine.outputPixels(get('linkedin')),{width:1584,height:396});
 assert.deepEqual(engine.outputPixels(get('profile')),{width:640,height:640});
 assert.deepEqual(engine.outputPixels(get('facebook')),{width:820,height:312});
 assert.deepEqual(engine.outputPixels(get('pinterest')),{width:1000,height:1500});
 assert.throws(()=>engine.outputPixels({...get('igpost'),w:9000}),/128–4096/);
});
test('4x6 print sheets preserve actual physical dimensions rather than squeezing oversized photos',()=>{
 const p=engine.passportPresets[0],d=engine.outputPixels(p);
 const grid=engine.printSheetGrid(d.width,d.height,300);
 assert.equal(grid.width,1200);assert.equal(grid.height,1800);assert.equal(grid.count,6);
 const square=engine.outputPixels(engine.passportPresets[1]);
 assert.equal(engine.printSheetGrid(square.width,square.height).count,2);
 const oversize=engine.outputPixels({...p,w:150,h:150});
 assert.equal(engine.printSheetGrid(oversize.width,oversize.height).count,0);
 const sixHundred=engine.outputPixels(p,600);
 const hd=engine.printSheetGrid(sixHundred.width,sixHundred.height,600);
 assert.equal(hd.width,2400);assert.equal(hd.height,3600);assert.equal(hd.count,6);
 assert.match(engineSource,/does not physically fit a 4 × 6 inch sheet/);
});
test('Passport & Social tool is actually linked across all page entry points',()=>{
 const route=read('app/studio/passport-social/page.tsx');
 assert.match(route,/export default function PassportSocialPage/);
 const locations=[
 'app/studio/page.tsx','components/studio-premium-nav.tsx','components/flagship-command-palette.tsx',
 'app/page.tsx','app/dashboard/page.tsx'
 ];
 for(const path of locations)assert.ok(read(path).includes('/studio/passport-social'),path);
 assert.match(read('app/studio/page.tsx'),/10 Workspaces/);
 assert.match(read('app/layout.tsx'),/10 Creator Studio Workspaces/);
 assert.match(read('app/page.tsx'),/<strong>70<\/strong>/);
 assert.equal([...read('lib/tools.ts').matchAll(/\bslug:\s*["']([a-z0-9-]+)["']/g)].length,60);
});
test('Original HTML demo feature set preserved: tabs, crop, background, guide, 4x6 and formats',()=>{
 const ui=read('components/passport-social-studio.tsx');
 for(const key of ['Passport / ID','Social Media','onPointerDown={pointerDown}',
 'onPointerMove={pointerMove}','Zoom','Brightness','Move horizontally','Move vertically',
 'Custom','4 × 6 inch photo print sheet','Show face positioning guide',
 "(['png','jpeg','webp'] as const)",'Download','ps-preview-stage','ps-presets'])
  assert.ok(ui.includes(key),key);
 assert.match(ui,/const sourceKey=\[/);
 assert.match(ui,/StudioUpscalePanel/);
 assert.match(ui,/onPreviewChange=\{setUpscaledPreview\}/);
 assert.match(ui,/demoPassportCanvas\(\)/);
 assert.match(ui,/DEMO PORTRAIT/);
 assert.match(ui,/official requirements/);
});
test('AI cutout is genuine U2Netp with offline fallback and consumes daily allowance',()=>{
 const ui=read('components/passport-social-studio.tsx');
 assert.match(ui,/await import\('@\/lib\/studio-bg-ai'\)/);
 assert.match(ui,/await aiCutout\(small,setStatus\)/);
 assert.match(ui,/solidBackgroundCutout\(small,65,2\)/);
 assert.match(ui,/await reserveStudioUsage\('studio-passport-social'\)/);
 assert.match(ui,/cutoutRef.current=\{image:output/);
 assert.match(read('lib/studio-bg-ai.ts'),/InferenceSession\.create/);
 assert.match(engineSource,/ctx\.drawImage\(src,x,y,iw,ih\)/);
 assert.match(engineSource,/ctx\.filter='brightness\('/);
});
test('Pro HD and physically sized PDF only export AFTER verified active PayPal membership',()=>{
 const ui=read('components/passport-social-studio.tsx');
 const check=ui.indexOf("if(!response.ok||json.authorized!==true)");
 const quota=ui.indexOf("await reserveStudioUsage('studio-passport-social');",ui.indexOf('async function proExport'));
 const pdf=ui.indexOf('pdf.addImage(');
 assert.ok(check>0&&quota>check&&pdf>quota);
 assert.match(ui,/response.status===401\|\|response.status===403/);
 assert.match(ui,/setPlansOpen\(true\)/);
 assert.match(ui,/purpose:'download'/);
 assert.match(ui,/resolution:'4k'/);
 assert.match(ui,/new jsPDF\(\{unit:'in',format:\[4,6\],orientation:'portrait'\}\)/);
 assert.match(ui,/requiredTier="Pro"/);
 assert.match(ui,/onRetry=\{\(\)=>void proExport\(exportRequested.current\)\}/);
 assert.match(ui,/Pro 2× export would exceed the 32 MP canvas limit/);
 assert.match(read('app/api/studio/upscale-authorize/route.ts'),/verifyStudioMember\(\)/);
 assert.match(read('components/premium-pricing.tsx'),/Passport 600-PPI print PDF/);
});
test('New tool uses shared server-validated daily quota and never claims automated passport acceptance',()=>{
 const slugs=read('lib/studio-run-slugs.ts');
 assert.match(slugs,/'studio-passport-social'/);
 assert.equal([...slugs.matchAll(/'studio-[\w-]+'/g)].length,9);
 assert.match(read('app/api/usage/quota/route.ts'),/studioRunSlugs/);
 assert.match(read('lib/usage-limits.ts'),/Free:3,Starter:500,Pro:1000,Premium:1500,Max:3000/);
 const ui=read('components/passport-social-studio.tsx');
 assert.match(ui,/does not verify head size, pose, eyes, lighting/);
 assert.doesNotMatch(ui,/guaranteed acceptance|government approved|100% guaranteed|fake premium/);
});
