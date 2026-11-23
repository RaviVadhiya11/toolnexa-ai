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
  ['Premium','9.99','99.99'],['Unlimited','14.99','149.99']
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

test('unlimited requires verified account and rate-limited server RPC',()=>{
 assert.match(quota,/consume_unlimited_tool_usage/);
 assert.match(quota,/UNLIMITED_QUOTA_ENABLED/);
 assert.match(quota,/USAGE_DB_QUOTAS_ENABLED/);
 assert.match(quota,/plan==='Unlimited'/);
 const limits=source('lib/usage-limits.ts');
 assert.match(limits,/Unlimited:null/);
 const migration=source('supabase/migrations/20261123_unlimited_fair_use.sql');
 assert.match(migration,/public\.unlimited_tool_throttle/);
 assert.match(migration,/grant execute on function public\.consume_unlimited_tool_usage\(uuid\) to service_role/i);
 assert.match(migration,/revoke all on function public\.consume_unlimited_tool_usage\(uuid\) from public,anon,authenticated/i);
});

test('website is noindex by default until an explicit public launch',()=>{
 for(const src of [layout,robots,sitemap])assert.match(src,/SITE_PUBLIC_LAUNCH_ENABLED/);
 assert.match(robots,/disallow:'\/'/);
 assert.match(layout,/index:process\.env\.SITE_PUBLIC_LAUNCH_ENABLED==='true'/);
 assert.match(sitemap,/return \[\]/);
});
