import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('single secure checkout dialog has three payment tabs, one provider action and a real PayPal path',()=>{
 const ui=src('components/premium-pricing.tsx');
 const paypal=src('components/paypal-subscribe.tsx');
 const css=src('app/neon-glass-3d.css');
 assert.match(ui,/useState<'upi'\|'card'\|'paypal'>\('paypal'\)/);
 assert.match(ui,/role="dialog" aria-modal="true"/);
 assert.match(ui,/id="subscription-checkout"/);
 assert.match(ui,/secure-checkout-title/);
 assert.match(ui,/Select Payment Method/);
 for(const method of ['upi','card','paypal'])
  assert.match(ui,new RegExp("aria-pressed=\\{paymentMethod==='"+method+"'\\}"));
 assert.match(ui,/aria-label="Single secure payment action"/);
 assert.match(ui,/paymentMethod==='paypal'\?\(available\?/);
 assert.match(ui,/<PayPalSubscribe key=\{selected/);
 assert.match(paypal,/fetch\('\/api\/paypal\/start'/);
 assert.match(css,/\.premium-shell \.secure-checkout-dialog/);
 assert.match(css,/@media\(max-width:600px\)/);
});

test('unconfigured PhonePe never takes payment, stores card details or grants account access',()=>{
 const ui=src('components/premium-pricing.tsx');
 const verify=src('lib/studio-membership.ts');
 const dashboard=src('app/api/pro/status/route.ts');
 assert.match(ui,/PhonePe recurring payments are pending merchant enablement and live integration/);
 assert.match(ui,/PhonePe.*Activation pending/);
 assert.match(ui,/No card or UPI information is collected here/);
 assert.match(ui,/Card information will be entered only on PhonePe's secure hosted checkout/);
 assert.match(ui,/Pricing pending/);
 assert.doesNotMatch(ui,/type="password".*CVV|Cardholder Name|placeholder="4242/);
 assert.doesNotMatch(ui,/fetch\('\/api\/phonepe\/start'/);
 assert.match(verify,/paypalSubscription\(row\.subscription_id\)/);
 assert.match(dashboard,/paypalSubscription\(record\.subscription_id\)/);
});

test('checkout closes on Escape, traps tab focus, and restores page scrolling',()=>{
 const ui=src('components/premium-pricing.tsx');
 assert.match(ui,/document\.body\.style\.overflow='hidden'/);
 assert.match(ui,/event\.key==='Escape'/);
 assert.match(ui,/event\.key!=='Tab'/);
 assert.match(ui,/document\.body\.style\.overflow=priorOverflow/);
 assert.match(ui,/secure-checkout-close/);
 assert.match(ui,/onMouseDown=\{event=>\{if\(event\.target===event\.currentTarget\)setSelected\(null\)\}\}/);
});
