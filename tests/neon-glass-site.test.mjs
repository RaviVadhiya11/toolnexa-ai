import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Neon Glass 3D is a truly site-wide shared stylesheet, not a separate demo',()=>{
 const layout=read('app/layout.tsx');
 const css=read('app/neon-glass-3d.css');
 assert.match(layout,/import '\.\/neon-glass-3d\.css'/);
 for(const selector of ['.premium-shell .flagship-top','.premium-shell .flagship-nav-links',
  '.premium-shell .premium-mobile-nav','.premium-shell .premium-tools-header',
  '.premium-shell .tool-catalogue-card','.premium-shell .suite-tile',
  '.premium-shell .tier-card','.premium-shell .member-hero',
  '.premium-shell .studio-premium-nav','.premium-shell .editorial-footer',
  '.premium-shell .studio-paywall-dialog','.ng-hero-art'])
  assert.ok(css.includes(selector),'Missing Neon Glass styling for '+selector);
 assert.match(css,/@media\(max-width:750px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/html\.light/);
});
test('Neon 3D home art links to working routes without inventing external product claims',()=>{
 const art=read('components/neon-glass-hero-art.tsx');
 const home=read('app/page.tsx');
 const tools=read('lib/tools.ts');
 for(const route of ['/studio/enhance','/studio/zip-maker','/studio/passport-social','/studio'])
  assert.ok(art.includes(route),'Missing tool route '+route);
 assert.match(art,/ng-device-grid/);
 assert.match(art,/ng-float-cube/);
 assert.match(art,/ng-hero-orbit/);
 assert.match(home,/NeonGlassHeroArt/);
 assert.match(home,/FlagshipHomeExperience mode="compare"/);
 assert.match(home,/FlagshipHomeExperience mode="upload"/);
 assert.match(home,/60\+ AI &amp; Utility Tools/);
 assert.ok(home.includes("href:'/studio/zip-maker'"));
 assert.equal([...tools.matchAll(/\bslug:\s*["']([a-z0-9-]+)["']/g)].length,60);
 assert.doesNotMatch(home,/100K\+|10M\+|99\.9%/);
});
test('Neon redesign retains checkout, account quota, full navigation and ZIP export safeguards',()=>{
 const shell=read('components/shell.tsx');
 const price=read('components/premium-pricing.tsx');
 const dash=read('app/dashboard/page.tsx');
 const zip=read('components/zip-maker-experience.tsx');
 for(const route of ['/', '/tools','/studio','/dashboard','/pricing'])
  assert.ok(shell.includes("href:'"+route+"'"),'Missing global navigation '+route);
 assert.match(shell,/DownloadAccessDialog/);
 assert.match(shell,/editorial-footer/);
 assert.match(shell,/premium-mobile-nav/);
 assert.match(price,/PayPalSubscribe/);
 assert.match(price,/subscriptionPrices/);
 assert.match(price,/ZIP Maker: 1,000 files \/ 1 GB/);
 assert.match(dash,/fetch\('\/api\/pro\/status'/);
 assert.match(dash,/dailyLimits/);
 assert.match(zip,/fetch\('\/api\/studio\/zip-authorize'/);
 assert.match(zip,/await reserveStudioUsage\('studio-zip-maker'\)/);
});
