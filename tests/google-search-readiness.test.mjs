import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const studioSlugs=['enhance','background-remove','batch','convert','image-to-vector','restore','retouch','svg-editor','vector','passport-social','zip-maker'];

test('Google sitemap lists every public Studio, all 60 tools and the essential pages',()=>{
 const sitemap=read('app/sitemap.ts');
 assert.match(sitemap,/SITE_PUBLIC_LAUNCH_ENABLED!=='true'/);
 assert.match(sitemap,/tools\.map\(tool=>/);
 assert.match(sitemap,/CANONICAL_SITE_URL\+'\/tools\/'\+tool\.slug/);
 for(const slug of studioSlugs)assert.ok(sitemap.includes("'/studio/"+slug+"'"),slug);
 for(const path of ['/about','/studio','/tools','/pricing','/privacy','/terms','/billing','/support'])
  assert.ok(sitemap.includes("'"+path+"'"),path);
 assert.doesNotMatch(sitemap,/\['\/dashboard'|\['\/login'/);
 assert.match(sitemap,/return \[\.\.\.pages,\.\.\.toolPages\]/);
});

test('Canonical URLs and schema are available on the homepage, tools and Studio pages',()=>{
 const root=read('app/layout.tsx'),seo=read('components/seo-json-ld.tsx');
 assert.match(root,/metadataBase:new URL\(site\)/);
 assert.match(root,/SeoJsonLd data=\{siteSchema\}/);
 assert.match(root,/@type':'WebSite'/);
 assert.match(root,/GOOGLE_SITE_VERIFICATION/);
 assert.match(seo,/application\/ld\+json/);
 assert.match(seo,/replace\(\/<\/g/);
 for(const slug of studioSlugs){
  const page=read('app/studio/'+slug+'/page.tsx');
  assert.ok(page.includes("alternates:{canonical:'/studio/"+slug+"'}"),slug);
 }
 for(const path of ['app/about/page.tsx','app/studio/page.tsx','app/tools/page.tsx'])
  assert.match(read(path),/alternates:\{canonical:/);
 assert.match(read('app/tools/[slug]/page.tsx'),/SeoJsonLd data=\{schema\}/);
 assert.match(read('app/tools/[slug]/page.tsx'),/BreadcrumbList/);
});

test('Robots and noindex prevent account, login, admin and checkout indexing',()=>{
 const robots=read('app/robots.ts'),config=read('next.config.mjs');
 assert.match(robots,/SITE_PUBLIC_LAUNCH_ENABLED!=='true'/);
 assert.match(robots,/sitemap:CANONICAL_SITE_URL\+'\/sitemap\.xml'/);
 for(const path of ['/api/','/auth/','/dashboard','/admin','/login','/signup','/subscribe/'])
  assert.ok(robots.includes("'"+path+"'"),path);
 for(const path of ['/login','/signup','/reset-password','/pro/:path*','/studio/passport-social/pro'])
  assert.ok(config.includes("source:'"+path+"'"),path);
 assert.match(read('app/studio/passport-social/pro/page.tsx'),/robots:\{index:false,follow:false\}/);
});

test('Search-visible disclosures reflect the real three-run shared Free quota',()=>{
 for(const path of ['app/support/page.tsx','app/billing/page.tsx','app/terms/page.tsx']){
  const src=read(path);
  assert.doesNotMatch(src,/10 browser-local successful|10 local tool runs|all 10 Studio workspaces|All 56 utility tools/);
  assert.match(src,/3 shared/);
 }
 assert.match(read('app/privacy/page.tsx'),/persistent first-party browser identifier cookie/);
 assert.match(read('components/shell.tsx'),/href="\/about"/);
});
