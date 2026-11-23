import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const script=new URL('../scripts/paypal-live-audit.mjs',import.meta.url);
const source=readFileSync(script,'utf8');
function run(env){
 return spawnSync(process.execPath,[script.pathname],{
  env:{...process.env,PAYPAL_LIVE_AUDIT_ENABLED:'false',PAYPAL_CHECKOUT_ENABLED:'false',...env},
  encoding:'utf8',timeout:15000
 });
}
test('live audit never runs unless explicitly opted in',()=>{
 const result=run({PAYPAL_LIVE_AUDIT_ENABLED:'false'});
 assert.equal(result.status,0);
 assert.match(result.stdout,/skipped/);
 assert.doesNotMatch(result.stdout,/PAYPAL_LIVE_AUDIT_RESULT/);
});
test('live audit warns without making a charge when Live credentials are missing',()=>{
 const result=run({PAYPAL_LIVE_AUDIT_ENABLED:'true',PAYPAL_ENV:'sandbox',PAYPAL_CLIENT_ID:'',PAYPAL_CLIENT_SECRET:''});
 assert.equal(result.status,0,result.stderr);
 assert.match(result.stdout,/PAYPAL_LIVE_AUDIT FAIL Live credentials/);
 assert.match(result.stdout,/PAYPAL_LIVE_AUDIT_RESULT=FAIL/);
});
test('live audit is read only, price-verifies eight billing plans and inspects webhook',()=>{
 for(const key of ['Starter','Pro','Premium','Max'])
  assert.match(source,new RegExp("'"+key+"'"));
 for(const price of ['3.99','5.99','9.99','14.99','39.99','59.99','99.99','149.99'])
  assert.ok(source.includes("'"+price+"'"));
 assert.match(source,/\/v1\/billing\/plans\//);
 assert.match(source,/\/v1\/notifications\/webhooks\//);
 assert.match(source,/status&&billing&&amount/);
 assert.match(source,/BILLING\.SUBSCRIPTION\.ACTIVATED/);
 assert.match(source,/BILLING\.SUBSCRIPTION\.CANCELLED/);
 assert.doesNotMatch(source,/\/v1\/billing\/subscriptions(?:\/|')/);
 assert.doesNotMatch(source,/cancel',\{/);
 assert.doesNotMatch(source,/console\.log\([^)]*(?:token|secret|clientId|auth)\b/i);
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.match(pkg.scripts.prebuild,/scripts\/paypal-live-audit\.mjs/);
});


test('payment-enabled release fails closed if audit is disabled or merchant fails verification',()=>{
 const noAudit=run({PAYPAL_LIVE_AUDIT_ENABLED:'false',PAYPAL_CHECKOUT_ENABLED:'true'});
 assert.notEqual(noAudit.status,0);
 assert.match(noAudit.stderr,/refusing checkout-enabled release/);
 const auditFailure=run({
  PAYPAL_LIVE_AUDIT_ENABLED:'true',PAYPAL_CHECKOUT_ENABLED:'true',
  PAYPAL_ENV:'sandbox',PAYPAL_CLIENT_ID:'',PAYPAL_CLIENT_SECRET:''
 });
 assert.notEqual(auditFailure.status,0);
 assert.match(auditFailure.stderr,/checkout-enabled release blocked/);
});

test('auditor can identify a uniquely matching PayPal plan when a copied ID returns 404',()=>{
 for(const snippet of [
  '/v1/billing/plans?page_size=20&page=',
  'page<=5',
  "expectedName='ToolNexa AI '",
  'matching_plans=',
  'verified_live_plan_id=',
  'Number(c?.pricing_scheme?.fixed_price?.value)===Number(price)',
  '/v1/notifications/webhooks/'
 ])assert.ok(source.includes(snippet),'Audit must contain '+snippet);
 assert.doesNotMatch(source,/\/v1\/billing\/subscriptions['"]\s*,\s*\{/);
});

test('webhook recovery reads merchant webhook listing without creating one',()=>{
 assert.ok(source.includes("request('/v1/notifications/webhooks',headers)"));
 assert.ok(source.includes('matching_webhooks='));
 assert.ok(source.includes('verified_live_webhook_id='));
 assert.ok(source.includes('await inspectWebhookList()'));
 assert.doesNotMatch(source,/method:\s*'POST'\s*,\s*headers/);
});
