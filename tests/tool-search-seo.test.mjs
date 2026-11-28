import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=ts.transpileModule(read('lib/tool-seo-data.ts'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {toolSeo}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const slugs=[...read('lib/tools.ts').matchAll(/\bslug:\s*["']([a-z0-9-]+)["']/g)].map(x=>x[1]);
const studio=['enhance','background-remove','batch','convert','image-to-vector','restore','retouch','svg-editor','vector','passport-social','zip-maker'].map(s=>'studio/'+s);
test('Each canonical tool has unique truthful search metadata and a guide',()=>{
 const keys=[...slugs,...studio];assert.equal(keys.length,71);assert.deepEqual(Object.keys(toolSeo).sort(),keys.sort());
 for(const field of ['title','description','guide'])assert.equal(new Set(keys.map(key=>toolSeo[key][field])).size,keys.length);
 for(const key of keys){const entry=toolSeo[key];assert.ok(entry.title.length>=15&&entry.title.length<=80,key);assert.ok(entry.description.length>=50&&entry.description.length<=175,key);assert.ok(entry.guide.length>=60,key);for(const link of entry.related){assert.notEqual(link,key);assert.ok(toolSeo[link],key+' links to '+link);}}
});
test('All guides are rendered on canonical pages; invoice Studio alias remains canonicalized',()=>{
 const page=read('app/tools/[slug]/page.tsx');assert.match(page,/return toolMetadata\(slug,/);assert.match(page,/<ToolSearchGuide seoKey=\{slug\}/);
 for(const key of studio){const src=read('app/'+key+'/page.tsx');assert.ok(src.includes('seoKey="'+key+'"'),key);assert.ok(src.includes("toolMetadata('"+key+"'"),key);}
 assert.match(read('app/studio/bill-maker/page.tsx'),/canonical:'\/tools\/invoice-generator'/);
 assert.doesNotMatch(read('app/sitemap.ts'),/\/studio\/bill-maker/);
 assert.match(read('app/tools/page.tsx'),/tools.filter\(tool=>tool.category===category\)/);
 const meta=read('lib/tool-seo.ts');assert.match(meta,/openGraph:/);assert.match(meta,/twitter:/);
});
