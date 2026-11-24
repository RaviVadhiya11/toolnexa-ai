import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('both PayPal and PhonePe PG are selectable in pricing without changing the live PayPal API',()=>{
 const ui=src('components/premium-pricing.tsx');
 const paypal=src('components/paypal-subscribe.tsx');
 assert.match(ui,/useState<'paypal'\|'phonepe'>\('paypal'\)/);
 assert.match(ui,/Select payment gateway/);
 assert.match(ui,/PayPal — \$\{selectedPrice\} USD/);
 assert.match(ui,/PhonePe PG — India checkout/);
 assert.match(ui,/paymentMethod==='paypal'\?<section/);
 assert.match(ui,/aria-pressed=\{paymentMethod==='phonepe'\}/);
 assert.match(ui,/Merchant activation pending/);
 assert.match(ui,/PhonePe recurring subscription checkout is not live yet/);
 assert.match(ui,/Use PayPal instead/);
 assert.match(paypal,/fetch\('\/api\/paypal\/start'/);
 assert.doesNotMatch(ui,/fetch\('\/api\/phonepe\/start'/);
});

test('unconfigured PhonePe never takes payment or grants account access',()=>{
 const pricing=src('components/premium-pricing.tsx');
 const verify=src('lib/studio-membership.ts');
 const dashboard=src('app/api/pro/status/route.ts');
 assert.match(pricing,/No PhonePe charge or automatic plan activation can be initiated/);
 assert.match(pricing,/production API credentials, INR plan prices, and verified payment callbacks/);
 assert.match(verify,/paypalSubscription\(row\.subscription_id\)/);
 assert.match(dashboard,/paypalSubscription\(record\.subscription_id\)/);
 assert.doesNotMatch(pricing,/PhonePe PG —.*Continue securely to PhonePe/);
});
