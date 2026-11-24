import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const MB=1024*1024;
function zipModule(){
 const input=read('lib/zip-plan-limits.ts');
 const js=ts.transpileModule(input,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};
 vm.runInNewContext(js,{exports});
 return exports;
}

test('ZIP Maker tiers enforce files, size, compression and Max eligibility',()=>{
 const lib=zipModule();
 assert.equal(lib.zipRequiredTier(1,100,'smart'),'Starter');
 assert.equal(lib.zipRequiredTier(20,30*MB,'smart'),'Starter');
 assert.equal(lib.zipRequiredTier(21,31*MB,'smart'),'Pro');
 assert.equal(lib.zipRequiredTier(1,10,'maximum'),'Pro');
 assert.equal(lib.zipRequiredTier(60,100*MB,'maximum'),'Pro');
 assert.equal(lib.zipRequiredTier(61,100*MB,'smart'),'Premium');
 assert.equal(lib.zipRequiredTier(150,200*MB,'maximum'),'Premium');
 assert.equal(lib.zipRequiredTier(151,200*MB,'smart'),'Max');
 assert.equal(lib.zipRequiredTier(300,300*MB,'smart'),'Max');
 assert.equal(lib.zipRequiredTier(301,1,'fast'),null);
 assert.equal(lib.zipRequiredTier(1,301*MB,'smart'),null);
 assert.equal(lib.zipRequiredTier(0,100,'fast'),null);
 assert.equal(lib.zipRequiredTier(1,-1,'smart'),null);
 assert.equal(lib.zipRequiredTier(3,2.3,'smart'),null);
 assert.equal(lib.zipPlanAllows('Starter','Pro'),false);
 assert.equal(lib.zipPlanAllows('Pro','Starter'),true);
 assert.equal(lib.zipPlanAllows('Max','Max'),true);
});

test('approved ZIP Maker demo styling and functioning ZIP32 composer remain intact',()=>{
 const html=read('public/studio-zip-maker.html');
 for(const term of ['Upload & File Manager','Smart Compression & Export','selectFolder','keepFolders','includeReadme','crc32','centralHeader','endHeader','CompressionStream','ZIP Archive Summary','Try Demo'])
  assert.ok(html.includes(term),'Missing approved UI or ZIP writer '+term);
 assert.match(html,/ToolNexa AI — Advanced ZIP Maker Studio/); // approved brand
 assert.match(html,/toolnexa-zip-access/);
 assert.match(html,/toolnexa-zip-resume/);
 assert.match(html,/requestZipAccess\(\)/);
 assert.match(html,/async function createZip\(alreadyAuthorized=false\)/);
 assert.match(html,/if\(!alreadyAuthorized\)await requestZipAccess\(\)/);
 assert.match(html,/let authorizationSequence=0,plan='Free'/);
 assert.doesNotMatch(html,/No upload or account required for this preview/);
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,1);
 assert.doesNotThrow(()=>new vm.Script(scripts[0][1]));
});
test('ZIP entitlement verified against live PayPal before shared quota reservation',()=>{
 const api=read('app/api/studio/zip-authorize/route.ts');
 assert.match(api,/verifyStudioMember/);
 assert.match(api,/zipRequiredTier/);
 assert.match(api,/zipPlanAllows/);
 assert.match(api,/get\('origin'\)/);
 const bridge=read('components/zip-maker-experience.tsx');
 assert.match(bridge,/fetch\('\/api\/studio\/zip-authorize'/);
 assert.match(bridge,/await reserveStudioUsage\('studio-zip-maker'\)/);
 assert.ok(bridge.indexOf("await fetch('/api/studio/zip-authorize'")<
   bridge.indexOf("await reserveStudioUsage('studio-zip-maker')"));
 assert.match(bridge,/isZipRequest\(data\)/);
 assert.match(bridge,/showDownloadGate/);
 assert.match(bridge,/toolnexa-zip-resume/);
 assert.match(bridge,/sandbox="allow-scripts allow-downloads allow-top-navigation-by-user-activation"/);
 assert.doesNotMatch(bridge,/allow-same-origin/);
 assert.match(read('lib/studio-run-slugs.ts'),/'studio-zip-maker'/);
 assert.match(read('components/premium-plan-modal.tsx'),/\|'Max'/);
});

test('ZIP Maker is discoverable and does not add a duplicate editor footer',()=>{
 assert.match(read('app/studio/page.tsx'),/href:'\/studio\/zip-maker'/);
 assert.match(read('app/tools/page.tsx'),/href="\/studio\/zip-maker"/);
 assert.match(read('components/shell.tsx'),/href="\/studio\/zip-maker"/);
 assert.match(read('components/studio-premium-nav.tsx'),/pathname==='\/studio\/zip-maker'/);
 assert.match(read('next.config.mjs'),/source:'\/studio-zip-maker.html'/);
 const html=read('public/studio-zip-maker.html');
 assert.match(html,/\.footnote\{display:none!important\}/);
 assert.match(html,/\.header\{display:none!important\}/);
});
