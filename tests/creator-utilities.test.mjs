import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import ts from 'typescript';
const load=async path=>{
 const s=readFileSync(new URL('../'+path,import.meta.url),'utf8');
 const js=ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
};
const operations=await load('lib/creator-operations.ts');
const rows=await load('lib/copyable-output.ts');

test('JSON to CSV quotes, escaping, nested fields, missing values and spreadsheet-injection protection',()=>{
 const csv=operations.jsonToCsv(JSON.stringify([
  {name:'Alice',address:{city:'Ahmedabad'},message:'Hi, "friend"\nThanks',formula:'=2+2',score:-10},
  {name:'Bob',address:{city:'Delhi'},message:'ok',formula:' +SUM(1,2)',extra:true}
 ]));
 assert.match(csv,/name,address.city,message,formula,score,extra/);
 assert.match(csv,/"Hi, ""friend""\nThanks"/);
 assert.match(csv,/'=2\+2/);
 assert.match(csv,/"' \+SUM\(1,2\)"/);
 assert.match(csv,/-10/);
 assert.match(csv,/Bob,Delhi,ok/);
 assert.ok(csv.endsWith('\r\n'));
});
test('JSON to CSV refuses arrays of scalars, malformed JSON and too many records',()=>{
 assert.throws(()=>operations.jsonToCsv('{"a":1}'),/array/);
 assert.throws(()=>operations.jsonToCsv('[1,2]'),/object/);
 assert.throws(()=>operations.jsonToCsv('{oops}'),/valid JSON/);
 assert.throws(()=>operations.jsonToCsv(JSON.stringify(Array(5001).fill({a:1}))),/5,000/);
});
test('UTM builder encodes values, preserves query and fragment, overwrites duplicate UTM keys',()=>{
 const url=operations.buildUtmUrl('https://example.com/path?ref=home&utm_source=old#pricing',
  'YouTube Shorts','Social Media','New Launch','Best Ideas','CTA Button');
 const parsed=new URL(url);
 assert.equal(parsed.searchParams.get('ref'),'home');
 assert.deepEqual(parsed.searchParams.getAll('utm_source'),['YouTube Shorts']);
 assert.equal(parsed.searchParams.get('utm_medium'),'Social Media');
 assert.equal(parsed.searchParams.get('utm_campaign'),'New Launch');
 assert.equal(parsed.searchParams.get('utm_term'),'Best Ideas');
 assert.equal(parsed.searchParams.get('utm_content'),'CTA Button');
 assert.equal(parsed.hash,'#pricing');
});
test('UTM builder rejects dangerous schemes and missing campaign fields',()=>{
 assert.throws(()=>operations.buildUtmUrl('javascript:alert(1)','x','y','z'),/HTTP\(S\)/);
 assert.throws(()=>operations.buildUtmUrl('https://a.com/','x','','z'),/utm_medium/);
 assert.throws(()=>operations.buildUtmUrl('https://u:p@example.com','a','b','c'),/credentials/);
});
test('SEO builder escapes untrusted HTML and creates semantic social metadata',()=>{
 const html=operations.makeSeoMetaTags('https://example.com/page?a=1&b=2',
  'Learn <SEO> & Branding','A useful guide to <safe> metadata & previews.',
  'https://example.com/img.jpg');
 assert.match(html,/<title>Learn &lt;SEO&gt; &amp; Branding<\/title>/);
 assert.match(html,/https:\/\/example.com\/page\?a=1&amp;b=2/);
 assert.match(html,/name="twitter:card" content="summary_large_image"/);
 assert.match(html,/property="og:image"/);
 assert.doesNotMatch(html,/<script/);
});
test('SEO builder refuses unsafe URLs and empty descriptions',()=>{
 assert.throws(()=>operations.makeSeoMetaTags('data:text/html,x','Valid','A long enough description here.'),/HTTP\(S\)/);
 assert.throws(()=>operations.makeSeoMetaTags('https://example.com','Valid','short'),/10/);
});
test('file hashing computes real SHA-256 and SHA-512 checksums and verifies against expected',async()=>{
 Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
 const file=new Blob(['abc']);
 const sha256=await operations.fileChecksum(file,'SHA-256');
 assert.equal(sha256,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
 const sha512=await operations.fileChecksum(file,'SHA-512');
 assert.equal(sha512.length,128);
 assert.match(operations.hashVerification(sha256,sha256.toUpperCase()),/MATCH/);
 assert.match(operations.hashVerification(sha256,'0'.repeat(64)),/MISMATCH/);
 assert.throws(()=>operations.hashVerification(sha256,'abc'),/64/);
 assert.throws(()=>operations.hashVerification(sha256,sha512),/length/);
});
test('multi-line result copier copies independent values but ignores structured code',()=>{
 const extracted=rows.extractCopyableRows('Monthly EMI: 700\nInterest: 200\nTotal: 900','emi-calculator');
 assert.equal(extracted.length,3);
 assert.equal(extracted[0].copyValue,'700');
 assert.equal(extracted[1].copyValue,'200');
 assert.deepEqual(rows.extractCopyableRows('{"test":true}\n  another line','json-formatter'),[]);
 assert.deepEqual(rows.extractCopyableRows('Only one line','text-sorter'),[]);
 assert.equal(rows.extractCopyableRows('<title>Test</title>\n<meta name="description" content="a">','seo-meta-generator').length,2);
});
test('the catalogue contains exactly 60 tools and both runners expose per-item copying',()=>{
 const catalogue=readFileSync(new URL('../lib/tools.ts',import.meta.url),'utf8');
 const slugs=[...catalogue.matchAll(/slug:"([a-z0-9-]+)"/g)].map(x=>x[1]);
 assert.equal(slugs.length,60);
 for(const slug of ['json-to-csv','sha-file-checker','utm-campaign-builder','seo-meta-generator'])
  assert.ok(slugs.includes(slug));
 for(const file of ['components/tool-runner.tsx','components/advanced-tool-runner.tsx']){
  const ui=readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assert.match(ui,/CopyableResultRows/);
 }
});
