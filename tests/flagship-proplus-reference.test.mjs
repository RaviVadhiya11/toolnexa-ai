import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('flagship homepage reproduces reference sections using real routes and pricing data',()=>{
 const home=read('app/page.tsx');
 for(const section of ['flagship-hero','FlagshipHomeExperience mode="upload"','FlagshipHomeExperience mode="compare"',
  'flagship-studio-bento','flagship-utilities','flagship-compare-table-wrap','flagship-plan-grid',
  'ToolList compact','subscriptionPrices.Starter.monthly','subscriptionPrices.Max.monthly',
  'studioItems.map','pricing.map'])
  assert.ok(home.includes(section),section);
 for(const url of ['/studio/enhance','/studio/image-to-vector','/studio/background-remove',
 '/studio/vector','/studio/convert','/studio/svg-editor','/studio/retouch','/studio/restore','/studio/batch'])
  assert.ok(home.includes(url),url);
 assert.doesNotMatch(home,/Unlimited GPU|Razorpay|UPI|Save over 85%|₹299|₹699/);
});
test('uploaded hero files are validated and passed privately to real Studio editor',()=>{
 const hero=read('components/flagship-home-experience.tsx');
 const transfer=read('lib/studio-hero-transfer.ts');
 const enhancer=read('components/professional-image-enhancer.tsx');
 assert.match(hero,/file.size>10\*1024\*1024/);
 assert.match(hero,/accepted.includes\(file.type\)/);
 assert.match(hero,/prepareStudioUpload\(file\)/);
 assert.match(hero,/router.push\('\/studio\/enhance'\)/);
 assert.match(transfer,/let pendingUpload:File\|null=null/);
 assert.match(transfer,/pendingUpload=null/);
 assert.match(enhancer,/takeStudioUpload\(\)/);
 assert.match(enhancer,/chooseFile\(image\)/);
 assert.match(hero,/onChange=\{e=>setSplit\(Number\(e.target.value\)\)\}/);
 assert.match(hero,/Illustrative local filter demo/);
 assert.doesNotMatch(transfer,/localStorage|fetch\(/);
});
test('single flagship navbar, working search modal, keyboard commands, mobile menu',()=>{
 const shell=read('components/shell.tsx');
 const cmd=read('components/flagship-command-palette.tsx');
 assert.match(shell,/flagship-top/);
 assert.match(shell,/flagship-nav-links/);
 assert.match(shell,/FlagshipCommandPalette/);
 assert.match(shell,/setMenuOpen\(true\)/);
 assert.match(cmd,/e.ctrlKey\|\|e.metaKey/);
 assert.match(cmd,/e.key.toLowerCase\(\)==='k'/);
 assert.match(cmd,/e.key==='Escape'/);
 assert.match(cmd,/e.key==='ArrowDown'/);
 assert.match(cmd,/e.key==='ArrowUp'/);
 assert.match(cmd,/e.key==='Enter'/);
 assert.match(cmd,/router.push\(href\)/);
 assert.match(cmd,/tools.filter/);
 assert.match(cmd,/\/studio\/batch/);
});
test('flagship obsidian visual system and mobile CSS are site-wide',()=>{
 const css=read('app/globals.css');
 for(const style of ['Flagship Pro+ V5','--bg:#05060a','flagship-proplus-badge',
  'flagship-command-overlay','flagship-hero-upload','flagship-compare-stage',
  'flagship-studio-bento','flagship-compare-table-wrap','flagship-plan-grid',
  '@media(max-width:430px)','@media(prefers-reduced-motion:reduce)'])
   assert.ok(css.includes(style),style);
 const studio=read('app/studio/studio.css');
 assert.match(studio,/studio-batch-grid/);
 assert.match(studio,/studio-batch-drop/);
});
test('batch engine performs real local sequence, Premium/Max PayPal verification and metered image runs',()=>{
 const batch=read('components/studio-batch-processor.tsx');
 for(const part of ["const MAX_FILES=8","accepted.includes(f.type)",
  "resolution:'8k',purpose:'download'","/api/studio/upscale-authorize",
  "if(res.status===401||res.status===403)","if(!res.ok||data.authorized!==true)",
  "await reserveStudioUsage('studio-enhance')","await image(file)",
  "upscaleDimensions(img.width,img.height,resolution)",
  "ctx.drawImage(img.source","await imageBlob(canvas,format,quality/100)",
  "packageImagesAsZip(produced)","downloadFile(zip","requiredTier=\"Premium\""])
  assert.ok(batch.includes(part),part);
 assert.match(batch,/new Image\(\)/);
 assert.match(batch,/Premium\/Max subscription/);
 assert.doesNotMatch(batch,/setIsPro\(true\)|isProPlus=true|activateDemoPro/);
});
test('local ZIP writer emits CRC32, central directory and ZIP end marker',()=>{
 const zip=read('lib/studio-batch-zip.ts');
 for(const required of ['0xedb88320','0x04034b50','0x02014b50','0x06054b50',
 'TextEncoder','new Blob','arrayBuffer()','setUint32(42,offset,true)'])
  assert.ok(zip.includes(required),required);
 assert.doesNotMatch(zip,/fetch\(|unpkg|cdn.jsdelivr/);
});
test('nine Studio links include Batch, while sixty utility tools and billing safety remain',()=>{
 const nav=read('components/studio-premium-nav.tsx');
 const page=read('app/studio/page.tsx');
 const dash=read('app/dashboard/page.tsx');
 const pricing=read('components/premium-pricing.tsx');
 assert.match(nav,/\/studio\/batch/);assert.match(page,/\/studio\/batch/);
 assert.match(dash,/\/studio\/batch/);assert.match(pricing,/Batch Pro\+ ZIP export/);
 assert.match(pricing,/PayPalSubscribe/);
 assert.match(read('app/api/studio/upscale-authorize/route.ts'),/verifyStudioMember\(\)/);
 assert.match(read('lib/usage-limits.ts'),/Free:3/);
 const tools=read('lib/tools.ts');assert.equal([...tools.matchAll(/\bslug:\s*["']([a-z0-9-]+)["']/g)].length,60);
});
