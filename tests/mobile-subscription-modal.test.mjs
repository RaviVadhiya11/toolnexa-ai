import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('every Studio paywall and the global 60-tool subscription gate use a body-level portal',()=>{
 const portal=read('components/studio-modal-portal.tsx');
 const premium=read('components/premium-plan-modal.tsx');
 const global=read('components/download-access-dialog.tsx');
 assert.match(portal,/createPortal\(/);
 assert.match(portal,/document\.body\s*\)/);
 assert.match(portal,/role="presentation"/);
 assert.match(portal,/document\.body\.style\.overflow='hidden'/);
 assert.match(portal,/event\.key==='Escape'/);
 assert.match(portal,/event\.key!=='Tab'/);
 assert.match(portal,/\[data-modal-close\]/);
 assert.match(premium,/<StudioModalPortal open=\{open\} onClose=\{onClose\}>/);
 assert.match(global,/<StudioModalPortal open onClose=\{close\}>/);
 assert.match(global,/return <PremiumPlanModal open/);
 for(const c of [premium,global]){
  assert.match(c,/studio-paywall-header/);
  assert.match(c,/studio-paywall-body/);
  assert.match(c,/studio-paywall-footer/);
  assert.match(c,/data-modal-close/);
  assert.match(c,/role="dialog" aria-modal="true"/);
 }
});

test('mobile popup keeps primary actions visible above nav with its own scroll area',()=>{
 const css=read('components/download-access-dialog.css');
 assert.match(css,/position:fixed;inset:0;z-index:3000/);
 assert.match(css,/height:100dvh/);
 assert.match(css,/\.studio-paywall-dialog\{[\s\S]*?display:flex;flex-direction:column/);
 assert.match(css,/\.studio-paywall-body\{[\s\S]*?overflow-y:auto/);
 assert.match(css,/\.studio-paywall-footer\{[\s\S]*?flex:none/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/@media\(max-width:550px\)/);
 assert.match(css,/calc\(100dvh - 24px/);
 assert.match(css,/linear-gradient\(110deg,#9145f5/);
});

test('payment gates and retry authorization remain server checked',()=>{
 const premium=read('components/premium-plan-modal.tsx');
 const global=read('components/download-access-dialog.tsx');
 const studio=read('components/studio-upscale-panel.tsx');
 assert.match(premium,/eligible=rank\[tier\.name\]>=rank\[requiredTier\]/);
 assert.match(premium,/onRetry\(\)/);
 assert.match(premium,/target="_blank" rel="noopener noreferrer"/);
 assert.match(global,/pending\.current\?\.retry/);
 assert.match(studio,/fetch\('\/api\/studio\/upscale-authorize'/);
 assert.match(studio,/data\.authorized!==true/);
});
