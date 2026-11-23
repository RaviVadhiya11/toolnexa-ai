import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const path=new URL('../scripts/paypal-provision-plans.mjs',import.meta.url);
const safeEnv={...process.env,
 PAYPAL_ENV:'sandbox',PAYPAL_CLIENT_ID:'',PAYPAL_CLIENT_SECRET:'',
 PAYPAL_PRODUCT_ID:'',PAYPAL_PLAN_ID_MAX:'',PAYPAL_PLAN_ID_MAX_YEARLY:''
};
const invoke=(args,env=safeEnv)=>spawnSync(process.execPath,[path.pathname,...args],{
 env,encoding:'utf8',timeout:12000
});
test('PayPal plan helper is a safe DRY RUN by default and lists all tiers without credentials',()=>{
 const result=invoke([]);
 assert.equal(result.status,0,result.stderr);
 assert.match(result.stdout,/DRY RUN/);
 for(const tier of ['Starter','Pro','Premium','Max'])assert.match(result.stdout,new RegExp(tier));
 assert.match(result.stdout,/PAYPAL_PLAN_ID_MAX_YEARLY/);
 assert.match(result.stdout,/No PayPal API called/);
});
test('PayPal plan helper refuses mutation without exactly one scoped plan and private credentials',()=>{
 const all=invoke(['--execute']);
 assert.notEqual(all.status,0);
 assert.match(all.stderr,/ONE plan per run/);
 const one=invoke(['--only=Max-monthly','--execute']);
 assert.notEqual(one.status,0);
 assert.match(one.stderr,/PAYPAL_PRODUCT_ID/);
 const live=invoke(['--only=Max-yearly','--execute'],{...safeEnv,PAYPAL_ENV:'live'});
 assert.notEqual(live.status,0);
 assert.match(live.stderr,/--confirm-live-payments/);
});
test('Website checkout remains gated on correctly configured verified plan and merchant flags',()=>{
 const pay=readFileSync(new URL('../lib/paypal.ts',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../app/pricing/page.tsx',import.meta.url),'utf8');
 assert.match(pay,/PAYPAL_PLAN_ID_MAX_YEARLY/);
 assert.match(pay,/PAYPAL_MAX_CHECKOUT_ENABLED/);
 assert.match(ui,/PAYPAL_CHECKOUT_ENABLED/);
 const helper=readFileSync(path,'utf8');
 assert.match(helper,/v1\/billing\/plans/);
 assert.match(helper,/billing_cycles/);
 assert.match(helper,/--confirm-live-payments/);
});
