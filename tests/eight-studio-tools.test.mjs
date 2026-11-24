import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const paths=[
 '/studio/vector','/studio/image-to-vector','/studio/convert',
 '/studio/svg-editor','/studio/enhance','/studio/background-remove',
 '/studio/retouch','/studio/restore','/studio/batch',
 '/studio/passport-social','/studio/zip-maker'
];
test('Studio landing page retains all original workspaces plus the approved ZIP Maker',()=>{
 const page=read('app/studio/page.tsx');
 for(const route of paths)assert.ok(page.includes("href:'"+route+"'"),'Missing route '+route);
 const cards=[...page.matchAll(/href:'\/studio\//g)];
 assert.equal(cards.length,11,'All eleven Studio workspaces should be visible');
 for(const route of paths)assert.ok(read('app'+route+'/page.tsx').includes('export default function'),'No Next.js page for '+route);
});
test('legacy 60 tools remain unchanged',()=>{
 const catalogue=read('lib/tools.ts');
 const slugs=[...catalogue.matchAll(/\bslug:\s*["']([a-z0-9-]+)["']/g)];
 assert.equal(slugs.length,60);
});
test('true path-only vector formats, no fabricated proprietary exports',()=>{
 const vector=read('lib/studio-vector-convert.ts');
 for(const item of ['cleanSVG','svg2pdf','setrgbcolor','LWPOLYLINE','%%BoundingBox','eofill'])
  assert.ok(vector.includes(item),'Missing vector primitive '+item);
 assert.ok(vector.includes("format==='eps'")&&vector.includes("format==='pdf'"));
 const tool=read('components/studio-vector-formats.tsx');
 assert.match(tool,/native.*\.(?:AI|CDR)|Native Adobe Illustrator/i);
 assert.doesNotMatch(tool,/downloadFile\([^)]*\.cdr/);
});
test('background AI uses a real on-device model with an explicit offline fallback',()=>{
 const ai=read('lib/studio-bg-ai.ts');
 assert.match(ai,/onnxruntime-web/);
 assert.match(ai,/u2netp.onnx/);
 assert.match(ai,/InferenceSession\.create/);
 assert.match(ai,/session\.run\(/);
 const ui=read('components/studio-image-suite.tsx');
 assert.match(ui,/aiCutout/);
 assert.match(ui,/solidBackgroundCutout/);
 assert.match(ui,/healMaskedImage/);
 assert.match(ui,/restorePhoto/);
 assert.match(ui,/Download Pro HD/);
});
test('Pro HD supports transparent PNG while account gate still requires active PayPal membership',()=>{
 const route=read('app/api/studio/hd-export/route.ts');
 const membership=read('lib/studio-membership.ts');
 assert.match(route,/'cutout'/);
 assert.match(route,/toolnexa-transparent-hd\.png/);
 assert.match(route,/verifyHdMember\(\)/);
 assert.match(route,/consume_daily_tool_usage/);
 assert.match(membership,/paypalSubscription\(row\.subscription_id\)/);
 assert.match(membership,/sub\.status==='ACTIVE'/);
 const pkg=JSON.parse(read('package.json'));
 for(const dependency of ['jspdf','svg2pdf.js','onnxruntime-web'])
  assert.ok(pkg.dependencies[dependency],'Missing runtime '+dependency);
});
