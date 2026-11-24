import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('all 60 utility download workflows use the server-verified shared subscription gate',()=>{
 const basic=read('components/tool-runner.tsx');
 const advanced=read('components/advanced-tool-runner.tsx');
 const router=read('app/tools/[slug]/page.tsx');
 for(const input of [basic,advanced]){
  assert.match(input,/withPaidDownload/);
  assert.match(input,/async function run\(\)/);
  assert.match(input,/async function execute\(\)/);
  assert.match(input,/download again|Download again/);
  assert.match(input,/kind:'limit'/);
 }
 assert.match(basic,/QR code PNG download/);
 assert.match(basic,/downloadTextResult/);
 assert.match(basic,/fileSlugs,'text-to-pdf'/);
 assert.match(advanced,/BINARY_TOOLS\.has\(slug\)/);
 assert.match(advanced,/Download text/);
 assert.match(router,/<ToolRunner|<AdvancedToolRunner/);
});
test('premium verification is server-side and checks live active PayPal, never client flags',()=>{
 const auth=read('app/api/tools/download-authorize/route.ts');
 const membership=read('lib/studio-membership.ts');
 const client=read('lib/download-access.ts');
 assert.match(auth,/verifyStudioMember\(\)/);
 assert.match(auth,/requested/);
 assert.match(auth,/new Set<string>\(\[\.\.\.tools/);
 assert.match(auth,/request\.headers\.get\('origin'\)/);
 assert.match(membership,/paypalSubscription\(row.subscription_id\)/);
 assert.match(membership,/sub\.status==='ACTIVE'/);
 assert.match(client,/fetch\('\/api\/tools\/download-authorize'/);
 assert.match(client,/GATE_EVENT/);
 assert.match(client,/GATE_GRANTED_EVENT/);
 assert.doesNotMatch(client,/localStorage/);
});
test('global plan popup is mounted across all routes and can retry the same download',()=>{
 const shell=read('components/shell.tsx'),dialog=read('components/download-access-dialog.tsx');
 assert.match(shell,/<DownloadAccessDialog\/>/);
 assert.match(dialog,/PremiumPlanModal/);
 assert.match(dialog,/pending\.current\?\.retry/);
 assert.match(dialog,/GATE_GRANTED_EVENT/);
 assert.match(dialog,/View Subscription Plans/);
 assert.match(read('components/download-access-dialog.css'),/z-index:3000/);
});
test('Creator exports and quota-limit errors use the same gate, including iframe and 4K/8K',()=>{
 const common=read('lib/studio-suite-client.ts');
 assert.match(common,/withPaidDownload\(/);
 const quota=read('components/studio-quota.tsx');
 assert.match(quota,/showDownloadGate\(/);
 const vector=read('components/studio-workspace.tsx');
 assert.match(vector,/withPaidDownload/);
 const imageVector=read('components/image-to-vector.tsx');
 assert.match(imageVector,/withPaidDownload/);
 const formats=read('components/studio-vector-formats.tsx');
 assert.match(formats,/withPaidDownload/);
 const iframe=read('components/passport-social-exact-experience.tsx');
 assert.match(iframe,/type==='toolnexa-photo-usage'/);
 assert.match(iframe,/type==='toolnexa-photo-premium'/);
 assert.match(iframe,/showDownloadGate/);
 assert.match(iframe,/withPaidDownload/);
 assert.match(iframe,/if\(!await downloadFile\(/);
 const ui=read('public/studio-passport-social-reference.html');
 assert.match(ui,/toolnexa-photo-usage/);
 assert.match(ui,/toolnexa-photo-premium/);
 const upscale=read('components/studio-upscale-panel.tsx');
 assert.match(upscale,/if\(!await downloadFile\(/);
});
