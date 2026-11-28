import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Official business contact is centralized and linked in every customer help and legal area',()=>{
 const contact=read('lib/contact.ts');assert.match(contact,/business@pixelfirestudio\.in/);assert.match(contact,/'mailto:'\+SUPPORT_EMAIL/);
 assert.match(read('components/support-email.tsx'),/href=\{SUPPORT_MAILTO\}/);
 for(const path of ['app/contact/page.tsx','app/support/page.tsx','app/about/page.tsx','app/privacy/page.tsx','app/terms/page.tsx','app/billing/page.tsx','components/shell.tsx'])assert.match(read(path),/<SupportEmail\/>/,path);
 assert.match(read('app/layout.tsx'),/contactType:'customer support',email:SUPPORT_EMAIL/);
 assert.match(read('app/sitemap.ts'),/'\/contact'/);
});
