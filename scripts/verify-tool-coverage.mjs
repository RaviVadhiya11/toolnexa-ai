// ToolNexa CI guard: every published tool must have a processing branch.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const tools=readFileSync(new URL('../lib/tools.ts',import.meta.url),'utf8');
const runner=readFileSync(new URL('../components/tool-runner.tsx',import.meta.url),'utf8');
const slugs=[...tools.matchAll(/\bslug:\s*["']([a-z0-9-]+)["']/g)].map(x=>x[1]);
const branches=[...runner.matchAll(/\bcase\s+["']([a-z0-9-]+)["']\s*:/g)].map(x=>x[1]);
assert.equal(slugs.length,20,'Expected exactly 20 published free tools');
assert.equal(new Set(slugs).size,slugs.length,'Duplicate tool slug');
assert.equal(new Set(branches).size,branches.length,'Duplicate processing branch');
assert.deepEqual([...branches].sort(),[...slugs].sort(),'Every published tool needs one processing branch');
for(const slug of slugs){
 assert.match(slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
}
for(const required of ['validFile','parsePageRanges','setWorking(true)','setWorking(false)','catch(error)','recordUse(slug)','remember(slug)']){
 assert.ok(runner.includes(required),'Missing core tool guard: '+required);
}
console.log('Tool catalogue guard passed: all '+slugs.length+' published tools have processing branches.');
