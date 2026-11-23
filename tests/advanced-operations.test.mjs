import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

// Run the production TypeScript operations as real JS, not just source-string checks.
const file=readFileSync(new URL('../lib/advanced-operations.ts',import.meta.url),'utf8');
const js=ts.transpileModule(file,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const op=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

test('YouTube IDs are accepted only from valid YouTube video URLs',()=>{
 const id='jNQXAC9IVRw';
 assert.equal(op.parseYoutubeId('https://www.youtube.com/watch?v='+id),id);
 assert.equal(op.parseYoutubeId('https://youtube.com/shorts/'+id+'?feature=share'),id);
 assert.equal(op.parseYoutubeId('https://youtu.be/'+id),id);
 assert.equal(op.parseYoutubeId(id),id);
 assert.throws(()=>op.parseYoutubeId('https://evil.youtube.com/watch?v='+id));
 assert.throws(()=>op.parseYoutubeId('https://youtube.com.evil.example/watch?v='+id));
});
test('CSV parser correctly handles quoted commas, escaped quotes and CRLF',()=>{
 const out=JSON.parse(op.csvToJson('name,note\r\nAda,"hello, world"\r\nBea,"quote ""inside"""'));
 assert.deepEqual(out,[{name:'Ada',note:'hello, world'},{name:'Bea',note:'quote "inside"'}]);
 assert.throws(()=>op.csvToJson('a,a\nx,y'));
 assert.throws(()=>op.csvToJson('a,b\n"open,y'));
});
test('color conversion correctly validates bounds',()=>{
 assert.match(op.colorConvert('#09f'),/#0099FF/);
 assert.match(op.colorConvert('12, 24, 36'),/#0C1824/);
 assert.throws(()=>op.colorConvert('999, 1, 0'));
});
test('EMI handles zero interest and nonzero interest',()=>{
 assert.match(op.emiReport(1200,0,12),/100/);
 assert.match(op.emiReport(100000,9,12),/Monthly EMI/);
 assert.throws(()=>op.emiReport(0,5,12));
});
test('date and age calculations reject invalid calendar dates',()=>{
 assert.match(op.ageReport('2000-01-01','2026-01-01'),/26 years/);
 assert.match(op.dateDifferenceReport('2026-01-01','2026-01-08'),/7 days/);
 assert.throws(()=>op.ageReport('2026-02-30','2026-11-23'));
 assert.throws(()=>op.ageReport('2027-01-01','2026-11-23'));
});
test('JWT inspection never misrepresents cryptographic verification',()=>{
 const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
 const data=op.jwtReport(encode({alg:'none'})+'.'+encode({sub:'abc',exp:2100000000})+'.x');
 assert.match(data,/NOT verified/);
 assert.match(data,/"sub": "abc"/);
 assert.throws(()=>op.jwtReport('invalid'));
});
test('line compare, sorting and regex produce actual results',()=>{
 assert.match(op.textDiff('a\nb','a\nc'),/\+ c/);
 assert.equal(op.textSort('c\nb\nb\na',true),'a\nb\nc');
 assert.match(op.regexReport('AB12','\\d+','g'),/12/);
});
test('social suggestions are functional but truthfully labelled as offline',()=>{
 const out=op.socialSuggestions('travel hacks','YouTube','professional');
 assert.match(out,/SMART OFFLINE/);
 assert.match(out,/#travel/);
 assert.match(out,/travel hacks/);
});
