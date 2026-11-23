// Every advertised tool must be wired to an actual processing path.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const catalogue=source('lib/tools.ts'),standard=source('components/tool-runner.tsx'),advanced=source('components/advanced-tool-runner.tsx');
const slugs=[...catalogue.matchAll(/\bslug:\s*["']([a-z0-9-]+)["']/g)].map(x=>x[1]);
assert.equal(slugs.length,56,'Expected 56 published tools');
assert.equal(new Set(slugs).size,slugs.length,'Duplicate catalogue slug');
const standardCases=[...standard.matchAll(/\bcase\s+["']([a-z0-9-]+)["']\s*:/g)].map(x=>x[1]);
const advancedCases=[...advanced.matchAll(/\bcase\s+["']([a-z0-9-]+)["']\s*:/g)].map(x=>x[1]);
const grouped=[...advanced.matchAll(/const (?:PDF_TOOLS|IMAGE_TOOLS|DOC_TOOLS)=new Set\(\[([\s\S]*?)\]\);/g)]
 .flatMap(match=>[...match[1].matchAll(/['"]([a-z0-9-]+)['"]/g)].map(x=>x[1]));
const operations=[...standardCases,...advancedCases,...grouped];
assert.equal(standardCases.length,20,'Existing tools must retain their processing branches');
assert.equal(new Set(operations).size,operations.length,'Duplicate tool implementation branch');
assert.deepEqual([...operations].sort(),[...slugs].sort(),'Every published tool needs exactly one handler');
for(const slug of slugs)assert.match(slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
for(const required of ['validFile','parsePageRanges','setWorking(true)','setWorking(false)','catch(error)','recordUse(slug)','remember(slug)'])assert.ok(standard.includes(required),'Missing standard guard: '+required);
for(const required of ['verifyQuota','reserve(q)','processAdvancedPdf','processAdvancedImage','generateBusinessPdf','consumeUsage','logUsage(slug)','recent(slug)','setWorking(false)'])assert.ok(advanced.includes(required),'Missing advanced guard: '+required);
console.log('Tool coverage: 56/56 published tools have a handler, 20 existing + 36 advanced.');
