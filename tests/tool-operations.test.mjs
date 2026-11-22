import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import ts from 'typescript';
import QRCode from 'qrcode';
import {PDFDocument} from 'pdf-lib';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const source=readFileSync(new URL('../lib/tool-operations.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const ops=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
test('word counter handles blank text, multiple lines and Unicode',()=>{
 assert.equal(ops.wordStats('  ').words,0);
 assert.deepEqual({...ops.wordStats('Hello world\nनमस्ते भारत'),readingMinutes:ops.wordStats('Hello world\nनमस्ते भारत').readingMinutes},{
  words:4,characters:24,lines:2,sentences:2,readingMinutes:4/200
 });
 assert.match(ops.wordReport('hello world'),/Words: 2/);
});
test('case converter handles mixed scripts and sentence mode',()=>{
 assert.equal(ops.convertCase('hello WORLD','title'),'Hello World');
 assert.equal(ops.convertCase('ABC','lower'),'abc');
 assert.equal(ops.convertCase('abc','upper'),'ABC');
 assert.equal(ops.convertCase('hello. WORLD','sentence'),'Hello. World');
 assert.throws(()=>ops.convertCase(' ','upper'),/Enter text/);
});
test('reverser preserves emoji grapheme clusters',()=>{
 assert.equal(ops.reverseText('A😀B'),'B😀A');
 assert.equal(ops.reverseText('a\u0301b'),'ba\u0301');
});
test('JSON formatting and strict errors',()=>{
 assert.equal(ops.formatJson('{"a":1}'),'{\n  "a": 1\n}');
 assert.equal(ops.formatJson('{"a":1}',true),'{"a":1}');
 assert.throws(()=>ops.formatJson('oops'),/Invalid JSON/);
});
test('Base64 UTF-8 roundtrip and bad input',()=>{
 const value='नमस्ते Hello 😀';
 assert.equal(ops.decodeBase64(ops.encodeBase64(value)),value);
 assert.throws(()=>ops.decodeBase64('%not-base64'),/Invalid Base64/);
});
test('URL encoder roundtrip and invalid escape',()=>{
 const value='https://example.com/?q=नमस्ते &x=1';
 assert.equal(ops.transformUrl(ops.transformUrl(value),true),value);
 assert.throws(()=>ops.transformUrl('%ZZ',true),/Invalid URL/);
});
test('secure passwords have mandatory character groups and validation',()=>{
 for(const symbols of [true,false]){
  const password=ops.securePassword(24,symbols);
  assert.equal(password.length,24);
  assert.match(password,/[a-z]/);
  assert.match(password,/[A-Z]/);
  assert.match(password,/[2-9]/);
  assert.equal(/[!@#$%^&*_\-+]/.test(password),symbols);
 }
 assert.throws(()=>ops.securePassword(7),/8–128/);
 assert.throws(()=>ops.securePassword(12.5),/8–128/);
});
test('GST inclusive and exclusive computations',()=>{
 assert.match(ops.gstReport(100,18,'exclusive'),/GST: ₹18.00/);
 assert.match(ops.gstReport(118,18,'inclusive'),/Base amount: ₹100.00/);
 assert.throws(()=>ops.gstReport(12,120,'exclusive'),/0–100/);
});
test('percentage and profit calculations',()=>{
 assert.equal(ops.percentageReport(200,25),'25% of 200 = 50.00');
 assert.match(ops.profitReport(80,100),/Margin: 20.00%/);
 assert.throws(()=>ops.profitReport(100,0),/positive/);
});
test('PDF range parser is deterministic, dedupes and rejects invalid ranges',()=>{
 assert.deepEqual(ops.parsePageRanges('1,3-5,3',7),[0,2,3,4]);
 assert.throws(()=>ops.parsePageRanges('3-0',8),/outside/);
 assert.throws(()=>ops.parsePageRanges('1,',8),/Use pages/);
 assert.throws(()=>ops.parsePageRanges('0',8),/outside/);
 assert.throws(()=>ops.parsePageRanges('8',7),/outside/);
});
test('PDF merge and split library workflow',async()=>{
 const src=await PDFDocument.create();
 src.addPage([300,400]);src.addPage([400,500]);
 const saved=await src.save();
 const loaded=await PDFDocument.load(saved);
 const merged=await PDFDocument.create();
 for(const page of await merged.copyPages(loaded,loaded.getPageIndices()))merged.addPage(page);
 assert.equal(merged.getPageCount(),2);
 const split=await PDFDocument.create();
 for(const page of await split.copyPages(merged,ops.parsePageRanges('2',2)))split.addPage(page);
 const reopened=await PDFDocument.load(await split.save());
 assert.equal(reopened.getPageCount(),1);
});
test('QR generator creates nonempty image data',async()=>{
 const url=await QRCode.toDataURL('ToolNexa AI',{width:192});
 assert.match(url,/^data:image\/png;base64,/);
 assert.ok(url.length>300);
});
