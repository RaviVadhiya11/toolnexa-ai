import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const components=['components/studio-workspace.tsx','components/image-to-vector.tsx',
 'components/studio-image-suite.tsx','components/studio-vector-formats.tsx'];
test('all original 60 + 8 Studio tools share three Free runs per UTC day',()=>{
 const limits=read('lib/usage-limits.ts');
 assert.match(limits,/Free:3,/);
 assert.match(limits,/Starter:500,Pro:1000,Premium:1500,Max:3000/);
 const api=read('app/api/usage/quota/route.ts');
 assert.match(api,/studioRunSlugs/);
 assert.match(api,/const allowed=new Set\(\[\.\.\.tools.map/);
 const slugs=read('lib/studio-run-slugs.ts');
 assert.equal([...slugs.matchAll(/'studio-[\w-]+'/g)].length,8);
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
test('upscale requires live PayPal access plus daily account quota on server',()=>{
 const api=read('app/api/studio/upscale-authorize/route.ts');
 assert.match(api,/verifyStudioMember\(\)/);
 assert.match(api,/consume_daily_tool_usage/);
 assert.match(api,/8K requires Premium or Max/);
 assert.match(api,/4× \/ 4K require Pro or higher/);
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
