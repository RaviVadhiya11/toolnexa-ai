import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';

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
 assert.match(read('app/studio/page.tsx'),/12 Workspaces/);
 assert.match(read('app/layout.tsx'),/12 Creator Studio workspaces/i);
 assert.match(read('app/page.tsx'),/<strong>60 \+ 12<\/strong>/);
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
 assert.equal([...slugs.matchAll(/'studio-[\w-]+'/g)].length,10);
 assert.match(read('app/api/usage/quota/route.ts'),/studioRunSlugs/);
 assert.match(read('lib/usage-limits.ts'),/Free:3,Starter:500,Pro:1000,Premium:1500,Max:3000/);
 const ui=read('components/passport-social-studio.tsx');
 assert.match(ui,/does not verify head size, pose, eyes, lighting/);
 assert.doesNotMatch(ui,/guaranteed acceptance|government approved|100% guaranteed|fake premium/);
});

test('mobile Passport Studio avoids nested footer, sticky toolbar and iframe height loop',()=>{
 const html=read('public/studio-passport-social-reference.html');
 const bridge=read('components/passport-social-exact-experience.tsx');
 const shell=read('components/shell.tsx');
 const nav=read('components/studio-premium-nav.tsx');
 assert.doesNotMatch(html,/<body[^>]*min-h-screen/);
 assert.doesNotMatch(html,/<footer[\s>]/);
 assert.match(html,/content\.getBoundingClientRect\(\)\.bottom/);
 assert.doesNotMatch(html,/height:Math\.max\(document\.documentElement\.scrollHeight/);
 assert.match(bridge,/setHeight\(previous=>Math\.abs\(previous-next\)>3\?next:previous\)/);
 assert.doesNotMatch(bridge,/minHeight:'100vh'/);
 assert.match(shell,/<footer className="premium-footer editorial-footer" aria-label="ToolNexa AI website footer">/);
 assert.doesNotMatch(shell,/!isPassportEditor&&<footer/);
 const css=read('app/globals.css');
 assert.match(css,/Footer restoration and mobile readability/);
 assert.match(css,/padding-bottom: calc\(108px \+ env\(safe-area-inset-bottom\)\)/);
 assert.match(nav,/pathname==='\/studio\/passport-social'\)return null/);
});

test('Same-page Pro HD exports preserve the existing browser studio with server PayPal checks',()=>{
 const html=read('public/studio-passport-social-reference.html');
 const parent=read('components/passport-social-exact-experience.tsx');
 assert.doesNotMatch(html,/Open Pro HD Studio ↗|href="\/studio\/passport-social\/pro"/);
 for(const id of ['inlineProStudio','btnProPhoto','btnProSheet','btnProPdf','btnPro4k','btnPro8k','proUpgradeLink'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/premiumExport\('photo'\)/);
 assert.match(html,/premiumExport\('sheet'\)/);
 assert.match(html,/premiumExport\('pdf'\)/);
 assert.match(html,/toolnexa-photo-premium/);
 assert.match(html,/makePhysicalPdf/);
 assert.match(html,/toolnexa-photo-canvas-request/);
 assert.match(html,/toolnexa-photo-revision/);
 assert.match(parent,/studio\/upscale-authorize/);
 assert.match(parent,/await reserveStudioUsage\('studio-passport-social'\)/);
 assert.match(parent,/automaticHdDownload/);
 assert.match(parent,/upscaleDimensions/);
 assert.match(parent,/neuralEnhance2x/);
 assert.match(parent,/downloadFile/);
 assert.doesNotMatch(parent,/StudioUpscalePanel|toolnexa-inline-ai-upscaler|showAi/);
 assert.match(parent,/toolnexa-photo-canvas-result/);
 assert.match(html,/toolnexa-photo-auto-upscale/);
 assert.match(html,/autoUpscaleAndDownload/);
 assert.doesNotMatch(html,/btnProAi|toolnexa-photo-open-ai/);
 const verify=parent.indexOf("const authorization=await fetch('/api/studio/upscale-authorize'");
 const run=parent.indexOf("await reserveStudioUsage('studio-passport-social')",parent.indexOf('async function automaticHdDownload'));
 const file=parent.indexOf("downloadFile(blob",parent.indexOf('async function automaticHdDownload'));
 assert.ok(verify>=0 && run>verify && file>run,'Premium auth and quota must precede HD download');
 // Next.js does not compile scripts in static public HTML. Validate them here
 // on every production build so bad inline JS cannot silently ship.
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.ok(scripts.length>=2,'Expected Tailwind config and editor scripts');
 for(const match of scripts)if(match[1].trim())assert.doesNotThrow(()=>new vm.Script(match[1]));
});
