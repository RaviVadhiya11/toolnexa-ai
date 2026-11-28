import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Tools page Studio promotion stays compact with short copy and 5 real shortcuts',()=>{
 const page=read('app/tools/page.tsx');
 assert.match(page,/className="tools-studio-spotlight"/);
 assert.match(page,/12 Studios/);
 assert.match(page,/Create more with/);
 assert.match(page,/ToolNexa Studio/);
 assert.match(page,/tools-studio-spotlight-actions/);
 for(const path of ['/studio','/studio/image-to-vector','/studio/passport-social','/studio/zip-maker','/studio/bill-maker'])
  assert.ok(page.includes('href="'+path+'"'),'Missing Studio shortcut '+path);
 assert.doesNotMatch(page,/NEW: 12 Creator Studio Workspaces/);
 assert.doesNotMatch(page,/real Premium\/Max batch ZIP processing/);
 assert.match(page,/<ToolList\/>/);
});

test('Tools promo has mobile 3-up shortcut layout without giant full-width standalone buttons',()=>{
 const css=read('app/neon-glass-3d.css');
 assert.match(css,/\.premium-shell \.tools-studio-spotlight\{/);
 assert.match(css,/\.premium-shell \.tools-studio-spotlight-actions\{/);
 assert.match(css,/\.premium-shell \.tools-studio-shortcuts\{/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/html\.light \.premium-shell \.tools-studio-spotlight\{/);
 const page=read('app/tools/page.tsx');
 assert.match(page,/className="premium-tools-header"/);
 assert.match(page,/<Suspense fallback/);
});
