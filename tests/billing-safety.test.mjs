import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pricing=source('lib/subscription-pricing.ts');
const start=source('app/api/paypal/start/route.ts');
const subscribe=source('components/paypal-subscribe.tsx');
const quota=source('app/api/usage/quota/route.ts');
const layout=source('app/layout.tsx');
const robots=source('app/robots.ts');
const sitemap=source('app/sitemap.ts');

test('all four paid tiers have explicitly priced monthly and yearly plans',()=>{
 for(const [tier,monthly,yearly] of [
  ['Starter','3.99','39.99'],['Pro','5.99','59.99'],
  ['Premium','9.99','99.99'],['Max','14.99','149.99']
 ]){
  assert.match(pricing,new RegExp(tier+":\\s*\\{monthly:'"+monthly.replace('.','\\.')+"',yearly:'"+yearly.replace('.','\\.')+"'\\}"));
 }
});

test('every checkout uses a guarded server endpoint, never direct browser SDK subscription creation',()=>{
 assert.match(subscribe,/fetch\('\/api\/paypal\/start'/);
 assert.doesNotMatch(subscribe,/actions\.subscription\.create/);
 assert.doesNotMatch(subscribe,/paypal\.com\/sdk\/js/);
 assert.match(start,/paypalPlanIdForCheckout/);
 assert.match(start,/paypal_validate_billing_plan/);
 assert.match(start,/expectedInterval/);
 assert.match(start,/expectedPrice/);
 assert.match(start,/cycle\?\.total_cycles!==0/);
 assert.match(start,/currency_code!=='USD'/);
 assert.match(start,/membership_lookup/);
});

test('Max has a real capped quota and server-verified daily usage RPC',()=>{
 const limits=source('lib/usage-limits.ts');
 const pay=source('lib/paypal.ts');
 const pricingUi=source('components/premium-pricing.tsx');
 const publicPricing=source('app/pricing/page.tsx');
 const dashboard=source('app/dashboard/page.tsx');
 assert.match(limits,/Max:3000/);
 assert.match(limits,/Max:300/);
 assert.doesNotMatch(limits,/Unlimited/);
 assert.match(quota,/consume_daily_tool_usage/);
 assert.doesNotMatch(quota,/consume_unlimited_tool_usage/);
 assert.match(quota,/p_limit:limit/);
 assert.match(quota,/plan==='Max'/);
 assert.match(quota,/USAGE_DB_QUOTAS_ENABLED/);
 assert.match(pay,/PAYPAL_PLAN_ID_MAX/);
 assert.match(pay,/PAYPAL_PLAN_ID_MAX_YEARLY/);
 assert.match(pay,/PAYPAL_MAX_CHECKOUT_ENABLED/);
 assert.doesNotMatch(pay,/PAYPAL_PLAN_ID_UNLIMITED/);
 assert.match(pricingUi,/300 texts per batch request/);
 assert.match(pricingUi,/3,000 tool runs per day/);
 assert.doesNotMatch(pricingUi,/Unlimited|unlimitedPreviewPrices/);
 assert.match(publicPricing,/maxEnabled=/);
 assert.doesNotMatch(dashboard,/Unlimited/);
 const migration=source('supabase/migrations/20261123_account_usage.sql');
 assert.match(migration,/p_limit integer/);
 assert.match(migration,/where public.daily_tool_usage.used < p_limit/);
 assert.match(migration,/grant execute on function public[.]consume_daily_tool_usage[(]uuid,integer[)] to service_role/i);
});

test('website is noindex by default until an explicit public launch',()=>{
 for(const src of [layout,robots,sitemap])assert.match(src,/SITE_PUBLIC_LAUNCH_ENABLED/);
 assert.match(robots,/disallow:'\/'/);
 assert.match(layout,/index:process\.env\.SITE_PUBLIC_LAUNCH_ENABLED==='true'/);
 assert.match(sitemap,/return \[\]/);
});
