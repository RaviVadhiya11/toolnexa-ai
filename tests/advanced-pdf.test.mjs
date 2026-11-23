import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {PDFDocument} from 'pdf-lib';

const source=readFileSync(new URL('../lib/advanced-file-ops.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const req=createRequire(import.meta.url);
const mod={exports:{}};
new Function('require','module','exports',compiled)(req,mod,mod.exports);
const {processAdvancedPdf}=mod.exports;
const fixture=async()=>{
 const pdf=await PDFDocument.create();
 for(let i=0;i<3;i++)pdf.addPage([400,600]);
 const arr=await pdf.save();
 return {name:'sample.pdf',type:'application/pdf',size:arr.length,arrayBuffer:async()=>arr.slice().buffer};
};
const getDoc=async result=>PDFDocument.load(await result.blob.arrayBuffer());

test('PDF rotation changes requested pages only',async()=>{
 const data=await processAdvancedPdf('rotate-pdf',await fixture(),'2','','90');
 const doc=await getDoc(data);
 assert.equal(doc.getPages()[0].getRotation().angle,0);
 assert.equal(doc.getPages()[1].getRotation().angle,90);
 assert.equal(doc.getPages()[2].getRotation().angle,0);
});
test('PDF page order can be changed',async()=>{
 const data=await processAdvancedPdf('reorder-pdf',await fixture(),'3,1,2','','');
 assert.equal((await getDoc(data)).getPageCount(),3);
 await assert.rejects(async()=>processAdvancedPdf('reorder-pdf',await fixture(),'1,1,2','',''));
});
test('PDF delete preserves other pages',async()=>{
 const data=await processAdvancedPdf('delete-pdf-pages',await fixture(),'2','','');
 assert.equal((await getDoc(data)).getPageCount(),2);
 await assert.rejects(async()=>processAdvancedPdf('delete-pdf-pages',await fixture(),'1,2,3','',''));
});
test('PDF watermark and page numbering produce loadable PDFs',async()=>{
 for(const name of ['pdf-watermark','pdf-page-numbers']){
  const data=await processAdvancedPdf(name,await fixture(),name==='pdf-watermark'?'DRAFT':'5','','');
  assert.equal((await getDoc(data)).getPageCount(),3);
 }
});
test('PDF metadata writes real title and author and views them safely',async()=>{
 const updated=await processAdvancedPdf('pdf-metadata',await fixture(),'Hello PDF','Test Author','update');
 const doc=await getDoc(updated);
 assert.equal(doc.getTitle(),'Hello PDF');assert.equal(doc.getAuthor(),'Test Author');
 const viewed=await processAdvancedPdf('pdf-metadata',await fixture(),'','','view');
 assert.match(viewed.message,/Pages: 3/);
 assert.equal(viewed.name,'');
});
test('PDF structural optimization remains valid',async()=>{
 const optimized=await processAdvancedPdf('pdf-compressor',await fixture(),'','','');
 assert.equal((await getDoc(optimized)).getPageCount(),3);
});
test('PDF password tool really encrypts rather than just labelling output',async()=>{
 const file=await fixture();
 const result=await processAdvancedPdf('protect-pdf',file,'password123','password123','');
 const {PDFDocument:SecurePDF}=await import('@cantoo/pdf-lib');
 const data=await result.blob.arrayBuffer();
 const encrypted=await SecurePDF.load(data,{ignoreEncryption:true});
 assert.equal(encrypted.isEncrypted,true);
 const unlocked=await SecurePDF.load(data,{password:'password123'});
 assert.equal(unlocked.getPageCount(),3);
 await assert.rejects(()=>SecurePDF.load(data,{password:'wrongPassword'}));
 await assert.rejects(async()=>processAdvancedPdf('protect-pdf',file,'short','short',''));
});
