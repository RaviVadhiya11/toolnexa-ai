import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('single Neon Glass secure checkout has exactly two payment gateways and one provider action',()=>{
 const ui=src('components/premium-pricing.tsx');
 const paypal=src('components/paypal-subscribe.tsx');
 const css=src('app/neon-glass-3d.css');
 assert.match(ui,/useState<'paypal'\|'phonepe'>\('paypal'\)/);
 assert.match(ui,/role="dialog" aria-modal="true"/);
 assert.match(ui,/id="subscription-checkout"/);
 assert.match(ui,/secure-checkout-title/);
 assert.match(ui,/Select Payment Method/);
 assert.match(ui,/ToolNexa AI · Secure Checkout/);
 assert.match(ui,/PhonePe PG · India checkout/);
 assert.doesNotMatch(ui,/paymentMethod==='upi'|paymentMethod==='card'/);
 assert.equal((ui.match(/className=\{paymentMethod==='/g)||[]).length,2);
 for(const method of ['paypal','phonepe'])
  assert.match(ui,new RegExp("aria-pressed=\\{paymentMethod==='"+method+"'\\}"));
 assert.match(ui,/aria-label="Single secure payment action"/);
 assert.match(ui,/paymentMethod==='paypal'\?\(available\?/);
 assert.match(ui,/<PayPalSubscribe key=\{selected/);
 assert.match(paypal,/fetch\('\/api\/paypal\/start'/);
 assert.match(css,/\.premium-shell \.secure-checkout-dialog/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/background:radial-gradient\(ellipse at 85% 0%/);
 assert.doesNotMatch(css,/\.secure-checkout-dialog\{[^}]*background:#f7f5f0/);
 assert.match(css,/@media\(max-width:600px\)/);
});

test('unconfigured PhonePe never takes payment, stores card details or grants account access',()=>{
 const ui=src('components/premium-pricing.tsx');
 const verify=src('lib/studio-membership.ts');
 const dashboard=src('app/api/pro/status/route.ts');
 assert.match(ui,/Production credentials, merchant approval and verified callbacks are still required/);
 assert.match(ui,/PhonePe PG · Activation pending/);
 assert.match(ui,/No card or UPI information is collected here/);
 assert.match(ui,/UPI and card options will be provided by PhonePe/);
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
