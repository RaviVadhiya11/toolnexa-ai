import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const javascript=ts.transpileModule(read('lib/site-url.ts'),{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}
}).outputText;
const {CANONICAL_SITE_URL,LEGACY_SITE_HOST,shouldRedirectLegacyPage}=
 await import('data:text/javascript;base64,'+Buffer.from(javascript).toString('base64'));

test('the new registered domain is the only canonical address',()=>{
 assert.equal(CANONICAL_SITE_URL,'https://toolnexaai.com');
 assert.equal(LEGACY_SITE_HOST,'toolnexa-ai.vercel.app');
 for(const path of ['app/layout.tsx','app/sitemap.ts','app/robots.ts','app/api/paypal/start/route.ts'])
  assert.match(read(path),/CANONICAL_SITE_URL/);
 assert.match(read('app/page.tsx'),/alternates:\{canonical:'\/'\}/);
 assert.match(read('app/layout.tsx'),/metadataBase:new URL\(site\)/);
 assert.match(read('app/layout.tsx'),/openGraph:\{/);
 assert.match(read('app/sitemap.ts'),/url:site\+'\/tools\/'\+tool.slug/);
 assert.match(read('app/robots.ts'),/sitemap:CANONICAL_SITE_URL\+'\/sitemap.xml'/);
 assert.match(read('app/robots.ts'),/host:CANONICAL_SITE_URL/);
});

test('legacy domain permanently redirects public pages, with path and query preserved',()=>{
 const middleware=read('middleware.ts');
 assert.match(middleware,/host===LEGACY_SITE_HOST/);
 assert.match(middleware,/const destination=new URL\(CANONICAL_SITE_URL\)/);
 assert.match(middleware,/destination\.pathname=path/);
 assert.match(middleware,/destination\.search=request\.nextUrl\.search/);
 assert.match(middleware,/NextResponse\.redirect\(destination,308\)/);
 assert.match(middleware,/\/\(\(\?!_next\/static/);
 for(const path of ['/', '/tools', '/pricing','/tools/youtube-thumbnail-downloader','/studio/enhance','/subscribe/return','/robots.txt','/sitemap.xml'])
  assert.equal(shouldRedirectLegacyPage(path,'GET'),true,path);
 const oldUrl=new URL('https://toolnexa-ai.vercel.app/tools/youtube-thumbnail-downloader?quality=hq&from=legacy');
 const destination=new URL(oldUrl.pathname+oldUrl.search,CANONICAL_SITE_URL);
 assert.equal(destination.href,'https://toolnexaai.com/tools/youtube-thumbnail-downloader?quality=hq&from=legacy');
});

test('payment webhooks, API requests, Supabase callbacks and assets are not redirected',()=>{
 for(const path of ['/api/paypal/webhook','/api/usage/quota','/api/tools/download-authorize','/auth/callback','/_next/static/chunks/app.js','/.well-known/apple-app-site-association','/studio-zip-maker.html','/studio-passport-social-reference.html','/favicon.ico','/images/logo.svg'])
  assert.equal(shouldRedirectLegacyPage(path,'GET'),false,path);
 for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS'])
  assert.equal(shouldRedirectLegacyPage('/pricing',method),false,method);
 const audit=read('scripts/paypal-live-audit.mjs');
 assert.match(audit,/toolnexa-ai\.vercel\.app\/api\/paypal\/webhook/);
 const middleware=read('middleware.ts');
 assert.match(middleware,/await client\.auth\.getUser\(\)/);
 assert.match(middleware,/if\(!needsAuth\)return NextResponse\.next/);
});

test('SEO index switch remains explicit; changing the domain does not open private pages to search engines',()=>{
 const root=read('app/layout.tsx'),robots=read('app/robots.ts'),sitemap=read('app/sitemap.ts');
 assert.match(root,/SITE_PUBLIC_LAUNCH_ENABLED==='true'/);
 assert.match(robots,/SITE_PUBLIC_LAUNCH_ENABLED!=='true'/);
 assert.match(sitemap,/SITE_PUBLIC_LAUNCH_ENABLED!=='true'/);
});
