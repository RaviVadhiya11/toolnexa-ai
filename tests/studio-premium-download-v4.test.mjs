import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('premium download popup is reusable, has real plan links and does not navigate away from preview',()=>{
 const x=read('components/premium-plan-modal.tsx');
 assert.match(x,/role="dialog" aria-modal="true"/);
 assert.match(x,/Starter.*Pro.*Premium.*Max/s);
 assert.match(x,/eligible=rank\[tier.name\]>=rank\[requiredTier\]/);
 assert.match(x,/href=\{'\/pricing\?plan='\+tier.name\}/);
 assert.match(x,/target="_blank"/);
 assert.match(x,/onRetry\(\)/);
 assert.match(x,/Not now — keep my preview/);
 assert.match(x,/subscriptionPrices\[tier.name\]\.monthly/);
});
test('full-resolution canvas exists only in verified download path, while preview stays small',()=>{
 const ui=read('components/studio-upscale-panel.tsx');
 assert.match(ui,/const maxPreview=720/);
 const pre=ui.slice(ui.indexOf(' async function upscale(){'),ui.indexOf(' async function download(){'));
 assert.doesNotMatch(pre,/canvas\.width=width;canvas\.height=height/);
 assert.match(pre,/prepared\.current=renderSource/);
 assert.match(pre,/await reserveStudioUsage\(usageSlug\)/);
 const paid=ui.slice(ui.indexOf(' async function download(){'));
 assert.match(paid,/response\.status===401\|\|response\.status===403/);
 assert.match(paid,/if\(!response.ok\|\|data.authorized!==true\)throw/);
 assert.match(paid,/const canvas=document\.createElement\('canvas'\);canvas\.width=w;canvas\.height=h/);
 assert.match(paid,/downloadFile\(file/);
 assert.ok(paid.indexOf('data.authorized!==true')<paid.indexOf('const canvas=document.createElement'));
 assert.match(ui,/disabled=\{checkingDownload\|\|working\}/);
 assert.doesNotMatch(ui,/disabled=\{!resultReady/);
});
test('all eight Studio tools continue sharing paid 2x 4x 4K 8K panel',()=>{
 for(const file of ['components/studio-image-suite.tsx','components/image-to-vector.tsx','components/studio-vector-formats.tsx','components/studio-workspace.tsx']){
  assert.match(read(file),/StudioUpscalePanel/);
 }
 assert.match(read('components/professional-image-enhancer.tsx'),/StudioUpscalePanel/);
 const pricing=read('components/premium-pricing.tsx');
 assert.match(pricing,/URLSearchParams\(window.location.search\)/);
});
test('other standalone Pro HD export buttons launch shared popup even for Free members',()=>{
 const helper=read('components/studio-premium-download.tsx');
 assert.match(helper,/verify.*subscription/i);
 assert.match(helper,/pending\.current=action/);
 assert.match(helper,/if\(response.status===401\|\|response.status===403\)/);
 assert.match(helper,/setOpen\(true\)/);
 assert.match(helper,/if\(exportAction\)await exportAction\(\)/);
 for(const path of ['components/studio-workspace.tsx','components/image-to-vector.tsx','components/studio-image-suite.tsx']){
  const code=read(path);
  assert.match(code,/useStudioPremiumDownload/);
  assert.match(code,/await premium\.run\(async\(\)=>/);
  assert.match(code,/premium\.modal/);
  assert.match(code,/premium\.checking/);
  assert.doesNotMatch(code,/pro\?<button/);
  assert.doesNotMatch(code,/isPro\?<button/);
 }
 assert.match(read('app/api/studio/hd-export/route.ts'),/verifyHdMember\(\)/);
});
test('Free quota remains three shared daily uses; backend still validates paid plans',()=>{
 const caps=read('lib/usage-limits.ts');
 assert.match(caps,/Free:3/);
 const api=read('app/api/studio/upscale-authorize/route.ts');
 assert.match(api,/verifyStudioMember\(\)/);
 assert.match(api,/8K download requires Premium or Max/);
 assert.match(api,/4× \/ 4K download requires Pro, Premium or Max/);
 assert.doesNotMatch(api,/consume_daily_tool_usage/);
});
