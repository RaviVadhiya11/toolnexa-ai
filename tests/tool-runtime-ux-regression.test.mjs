import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('guest social title tool starts with working private offline suggestions, AI remains opt-in',()=>{
 const runner=read('components/advanced-tool-runner.tsx');
 assert.match(runner,/useState<'gemini'\|'offline'>\('offline'\)/);
 assert.match(runner,/aiMode==='offline'/);
 assert.match(runner,/socialSuggestions\(text,option,'professional'\)/);
 assert.match(runner,/Google Gemini AI · signed-in free preview/);
 assert.match(runner,/Offline Smart Mode · no external API/);
 assert.match(runner,/No text is sent to Google in Offline Smart Mode/);
});

test('standard and advanced tools show the same upgrade or storage error when local quota is exhausted',()=>{
 const standard=read('components/tool-runner.tsx');
 const advanced=read('components/advanced-tool-runner.tsx');
 for(const runner of [standard,advanced]){
  assert.match(runner,/consumeUsage\(/);
  assert.match(runner,/readUsage\(/);
  assert.match(runner,/showDownloadGate\(\{kind:reached\?'limit':'error'/);
  assert.match(runner,/requiredTier:'Starter'/);
  assert.match(runner,/Browser storage/);
 }
 assert.match(advanced,/Your daily runs are used up/);
});
