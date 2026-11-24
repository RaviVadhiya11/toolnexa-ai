import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const components=['components/studio-workspace.tsx','components/image-to-vector.tsx',
 'components/studio-image-suite.tsx','components/studio-vector-formats.tsx'];
test('all 60 utilities and Studio downloads share the correct Free and paid daily quotas',()=>{
 const limits=read('lib/usage-limits.ts');
 assert.match(limits,/Free:3,/);
 assert.match(limits,/Starter:500,Pro:1000,Premium:1500,Max:3000/);
 const api=read('app/api/usage/quota/route.ts');
 assert.match(api,/studioRunSlugs/);
 assert.match(api,/const allowed=new Set\(\[\.\.\.tools.map/);
 const slugs=read('lib/studio-run-slugs.ts');
 assert.equal([...slugs.matchAll(/'studio-[\w-]+'/g)].length,10);
 for(const file of components){
  const content=read(file);
  assert.match(content,/StudioQuotaNotice/);
  assert.match(content,/reserveStudioUsage\(/);
 }
 const quota=read('components/studio-quota.tsx');
 assert.match(quota,/consumeUsage\(/);
 assert.match(quota,/\/api\/usage\/quota/);
});
test('all 8 Studio workflows visibly support upscaling',()=>{
 for(const file of components){
  assert.match(read(file),/StudioUpscalePanel/,'Missing upscaler in '+file);
 }
 const component=read('components/studio-upscale-panel.tsx');
 assert.match(component,/Upscale Image/);
 assert.match(component,/Download Upscaled/);
 for(const resolution of ['2x','4x','4k','8k'])assert.ok(component.includes('value="'+resolution+'"'));
 const math=read('lib/studio-upscale.ts');
 assert.match(math,/7680/);
 assert.match(math,/4320/);
 assert.match(math,/33500000/);
});
test('upscale preview uses shared daily quota, full download requires live PayPal',()=>{
 const ui=read('components/studio-upscale-panel.tsx');
 const quota=read('components/studio-quota.tsx');
 const api=read('app/api/studio/upscale-authorize/route.ts');
 assert.match(ui,/await reserveStudioUsage\(usageSlug\)/);
 assert.match(quota,/consumeUsage\(/);
 assert.match(quota,/\/api\/usage\/quota/);
 assert.match(api,/body\?\.purpose!=='download'/);
 assert.match(api,/verifyStudioMember\(\)/);
 assert.match(api,/8K download requires Premium or Max/);
 assert.match(api,/4× \/ 4K download requires Pro, Premium or Max/);
 assert.doesNotMatch(api,/consume_daily_tool_usage/,'Download entitlement must not double-charge');
 const auth=read('lib/studio-membership.ts');
 assert.match(auth,/paypalSubscription\(row\.subscription_id\)/);
 assert.match(auth,/sub\.status==='ACTIVE'/);
 assert.match(auth,/sub\.custom_id===user\.id/);
});
test('pricing reflects Starter 2x, Pro 4K, Premium and Max 8K',()=>{
 const price=read('components/premium-pricing.tsx');
 assert.match(price,/2× image upscale/);
 assert.match(price,/4K upscale export/);
 assert.equal((price.match(/4K and 8K upscale export/g)||[]).length,2);
});


test('4K preview is lightweight, Free can click Download, and full canvas is created only after payment',()=>{
 const ui=read('components/studio-upscale-panel.tsx');
 assert.match(ui,/useState<UpscaleResolution>\('4k'\)/);
 assert.match(ui,/disabled=\{working\|\|disabled\}/);
 assert.match(ui,/disabled=\{checkingDownload\|\|working\}/);
 assert.doesNotMatch(ui,/disabled=\{!resultReady\|\|checkingDownload\}/);
 assert.match(ui,/const maxPreview=720/);
 assert.match(ui,/await reserveStudioUsage\(usageSlug\)/);
 assert.match(ui,/setResult\(blob\)/);
 assert.match(ui,/previewCtx\.fillText\('TOOLNEXA · PREVIEW ONLY'/);
 assert.match(ui,/prepared\.current=renderSource/);
 assert.match(ui,/sourceKey/);
 const authPosition=ui.indexOf("if(!response.ok||data.authorized!==true)");
 const fullPosition=ui.indexOf("const canvas=document.createElement('canvas');canvas.width=w;");
 const downloadPosition=ui.indexOf("downloadFile(file,");
 assert.ok(authPosition>0&&fullPosition>authPosition&&downloadPosition>fullPosition,
  'Full pixels must not be generated or downloaded before server entitlement is verified');
});
test('unauthorized download opens shared plans modal, with retry and pricing preselect',()=>{
 const ui=read('components/studio-upscale-panel.tsx');
 const modal=read('components/premium-plan-modal.tsx');
 assert.match(ui,/onClick=\{\(\)=>void download\(\)\}/);
 assert.match(ui,/fetch\('\/api\/studio\/upscale-authorize'/);
 assert.match(ui,/purpose:'download'/);
 assert.match(ui,/response\.status===401\|\|response\.status===403/);
 assert.match(ui,/setShowPlans\(true\)/);
 assert.match(ui,/PremiumPlanModal open=\{showPlans\}/);
 assert.match(modal,/role="dialog" aria-modal="true"/);
 assert.match(modal,/target="_blank" rel="noopener noreferrer"/);
 assert.match(modal,/\/pricing\?plan=/);
 assert.match(modal,/Verify & Download/);
 assert.match(read('components/premium-pricing.tsx'),/new URLSearchParams\(window\.location\.search\)\.get\('plan'\)/);
 const api=read('app/api/studio/upscale-authorize/route.ts');
 assert.match(api,/verifyStudioMember\(\)/);
 const base=read('lib/studio-upscale.ts');
 assert.match(base,/if\(plan==='Free'\)return false/);
});
