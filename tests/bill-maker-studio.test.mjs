import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Bill & Invoice Maker is available in Studio, homepage, search and navigation',()=>{
 for(const p of ['app/studio/page.tsx','app/page.tsx','app/tools/page.tsx','components/shell.tsx','components/studio-premium-nav.tsx','components/flagship-command-palette.tsx','app/dashboard/page.tsx'])assert.ok(read(p).includes('/studio/bill-maker'),p);
 assert.match(read('app/studio/bill-maker/page.tsx'),/<BillMaker\/>/);
 assert.match(read('app/studio/bill-maker/page.tsx'),/canonical:'\/tools\/invoice-generator'/);
 assert.match(read('components/bill-maker.tsx'),/const SLUG='invoice-generator'/);
});
