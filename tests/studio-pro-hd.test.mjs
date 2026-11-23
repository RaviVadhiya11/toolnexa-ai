import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(name)=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('dedicated studio keeps the existing 60 tools and exposes both pages',()=>{
 const tools=read('lib/tools.ts');
 const slugs=[...tools.matchAll(/\bslug:\s*["']([a-z0-9-]+)["']/g)];
 assert.equal(slugs.length,60);
 const vector=read('app/studio/vector/page.tsx');
 const enhance=read('app/studio/enhance/page.tsx');
 assert.match(vector,/StudioWorkspace mode="vector"/);
 assert.match(enhance,/StudioWorkspace mode="image"/);
 const browser=read('components/studio-workspace.tsx');
 assert.match(browser,/Download SVG/);
 assert.match(browser,/image\/svg\+xml/);
 assert.match(browser,/renderSvgToCanvas|rasterSvg/);
 assert.match(browser,/Download Standard PNG/);
 assert.match(browser,/api\/studio\/hd-export/);
});
test('HD output requires server-side paid PayPal membership, not a client plan flag',()=>{
 const gate=read('lib/studio-membership.ts');
 for(const value of ["auth.getUser()","paypal_subscriptions","paypalSubscription(row.subscription_id)","subscription_id","plan_id","'ACTIVE'","'Pro'","'Premium'","'Max'"]){
  assert.ok(gate.includes(value),value);
 }
 assert.match(gate,/sub\.custom_id===user\.id/);
 assert.match(gate,/Upgrade to Pro or higher/);
 const handler=read('app/api/studio/hd-export/route.ts');
 assert.match(handler,/verifyHdMember\(\)/);
 assert.match(handler,/if\('error' in member\)/);
 assert.match(handler,/request\.headers\.get\('origin'\)/);
 assert.match(handler,/consume_daily_tool_usage/);
 assert.match(handler,/p_user_id:member\.userId/);
 assert.match(handler,/width\*height>700000/);
 assert.match(handler,/scale!==2&&scale!==4/);
 assert.match(handler,/output\.length>3900000/);
 assert.doesNotMatch(handler,/PAYPAL_CHECKOUT_ENABLED==='true'\s*\|\|\s*true/);
});
test('pricing accurately describes Pro-plus exports and no generative AI enhancement promise',()=>{
 const price=read('components/premium-pricing.tsx');
 const x=price.match(/HD image JPEG upscaling/g)||[];
 assert.equal(x.length,3,'Pro, Premium and Max must include HD JPEG in pricing');
 const ui=read('components/studio-workspace.tsx');
 assert.match(ui,/traditional image processing, not generative AI detail reconstruction/);
 assert.match(ui,/isPro=\['Pro','Premium','Max'\]/);
 const pkg=JSON.parse(read('package.json'));
 assert.ok(pkg.dependencies.sharp,'Image processing dependency required');
 const privacy=read('app/privacy/page.tsx');
 assert.match(privacy,/pixel data from your current artwork is sent to our server/);
});
