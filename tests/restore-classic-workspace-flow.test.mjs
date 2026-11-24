import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Flagship UI stays installed while classic sidebar navigation is recoverable from any screen',()=>{
 const shell=read('components/shell.tsx'),css=read('app/globals.css');
 assert.match(shell,/className="top premium-top flagship-top"/);
 assert.match(shell,/flagship-nav-links/);
 assert.match(shell,/flagship-gold-cta/);
 assert.match(shell,/FlagshipCommandPalette/);
 assert.match(shell,/has-open-drawer/);
 assert.match(shell,/flagship-workspace-drawer/);
 assert.match(shell,/aria-expanded=\{menuOpen\}/);
 assert.match(shell,/aria-controls="flagship-workspace-drawer"/);
 assert.match(shell,/setMenuOpen\(v=>!v\)/);
 assert.match(css,/\.flagship-nav-menu\{display:inline-flex/);
 assert.match(css,/\.premium-shell>.premium-sidebar.flagship-workspace-drawer.sidebar-open/);
 assert.match(css,/\.premium-shell.has-open-drawer>.premium-menu-backdrop/);
 assert.match(css,/width:min\(88vw,340px\)/);
});
test('Previous all-tool categories and search are functional in the classic drawer',()=>{
 const shell=read('components/shell.tsx');
 assert.match(shell,/const groups=\[/);
 for(const category of ['Text','Image','PDF','Developer','Business','Creator'])
  assert.ok(shell.includes("name:'"+category+"'"),category);
 assert.match(shell,/tools.filter\(tool=>tool.category===group.name\).length/);
 assert.match(shell,/href=\{'\/tools\?category='\+group.name\}/);
 assert.match(shell,/className="flagship-drawer-search"/);
 assert.match(shell,/onSubmit=\{findTools\}/);
 assert.match(shell,/router.push\('\/tools\?q='\+encodeURIComponent\(drawerSearch.trim\(\)\)\)/);
 assert.match(shell,/href="\/studio\/enhance"/);
 assert.match(shell,/href="\/studio\/background-remove"/);
 assert.match(shell,/href="\/studio\/image-to-vector"/);
 assert.match(shell,/href="\/studio\/batch"/);
 const toolList=read('components/tool-list.tsx');
 assert.match(toolList,/urlCategory=params.get\('category'\)/);
 assert.match(toolList,/urlSearch=params.get\('q'\)/);
});
test('Previous interaction behavior is restored without changing premium layouts or quotas',()=>{
 const shell=read('components/shell.tsx'),css=read('app/globals.css');
 assert.match(shell,/e.key==='Escape'/);
 assert.match(shell,/document.body.style.overflow='hidden'/);
 assert.match(shell,/drawerClose.current\?\.focus\(\)/);
 assert.match(shell,/onClick=\{toggle\}/);
 assert.match(css,/\.light .flagship-top/);
 assert.match(css,/\.light .flagship-hero h1/);
 assert.match(css,/\.light .flagship-plan-card/);
 assert.match(css,/\.flagship-classic-shortcuts/);
 const homepage=read('app/page.tsx');
 assert.match(homepage,/FlagshipHomeExperience mode="upload"/);
 assert.match(homepage,/FlagshipHomeExperience mode="compare"/);
 for(const route of ['/studio/enhance','/studio/background-remove','/studio/image-to-vector',
 '/tools?category=PDF','/tools?category=Developer','/dashboard'])
  assert.ok(homepage.includes(route),'missing quick access '+route);
 assert.match(read('lib/usage-limits.ts'),/Free:3/);
 assert.match(read('app/api/studio/upscale-authorize/route.ts'),/verifyStudioMember\(\)/);
 assert.match(read('components/studio-batch-processor.tsx'),/await reserveStudioUsage\('studio-enhance'\)/);
});
