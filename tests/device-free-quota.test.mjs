import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Free uses a stable HttpOnly device cookie and server-atomic quota regardless of authentication',()=>{
 const api=read('app/api/usage/quota/route.ts');
 assert.match(api,/const deviceCookie='toolnexa_device_v1'/);
 assert.match(api,/httpOnly:true,secure:request\.nextUrl\.protocol==='https:'/);
 assert.match(api,/sameSite:'lax'/);
 assert.match(api,/path:'\/',maxAge:60\*60\*24\*730/);
 assert.match(api,/if\(plan==='Free'\)\{/);
 assert.match(api,/p_device_id:deviceId/);
 assert.match(api,/consume_daily_device_tool_usage/);
 assert.match(api,/sync_daily_device_tool_usage/);
 assert.match(api,/return respond\(\{mode:'device',plan,limit,used,userId:user\?\.id\?\?null\}\)/);
 assert.match(api,/return handler\(request,'read'\)/);
 assert.match(api,/return handler\(request,'consume'\)/);
 assert.match(api,/return handler\(request,'sync'\)/);
 assert.match(api,/legacyUsed/);
 assert.match(api,/consume_daily_tool_usage/);
 assert.match(api,/if\(plan==='Max'/);
});

test('Free counter retains guest and historical account usage when logging in or out',()=>{
 const helpers=read('lib/usage-limits.ts');
 assert.match(helpers,/freeBrowserUsageFloor\(userId:string\|null\)/);
 assert.match(helpers,/Math\.max\(readUsage\(quotaKey\(null\)\),userId\?readUsage\(quotaKey\(userId\)\):0\)/);
 assert.match(helpers,/const key=quotaKey\(null\)/);
 assert.match(helpers,/method:'PATCH'/);
 assert.match(helpers,/mirrorFreeDeviceUsage\(used\)/);
 for(const path of ['components/tool-runner.tsx','components/advanced-tool-runner.tsx','components/studio-quota.tsx']){
  const ui=read(path);
  assert.match(ui,/reconcileFreeDeviceUsage\(/,path);
  assert.match(ui,/mirrorFreeDeviceUsage\(/,path);
  assert.match(ui,/mode==='device'/,path);
  assert.match(ui,/clientUsed:readUsage\(quotaKey\(null\)\)/,path);
  assert.match(ui,/\/api\/usage\/quota/,path);
 }
 const advanced=read('components/advanced-tool-runner.tsx');
 assert.match(advanced,/aiMode==='gemini'&&!q\.userId/);
});

test('device database RPC is atomic, private, and not accessible to anonymous clients',()=>{
 const sql=read('supabase/migrations/20261124_device_free_daily_usage.sql');
 assert.match(sql,/create table if not exists public\.daily_device_tool_usage/);
 assert.match(sql,/primary key \(device_id, usage_day\)/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/revoke all on public\.daily_device_tool_usage from anon, authenticated/);
 assert.match(sql,/greatest\(public\.daily_device_tool_usage\.used,p_floor\)\+1/);
 for(const name of ['sync_daily_device_tool_usage','consume_daily_device_tool_usage']){
  assert.match(sql,new RegExp('revoke all on function public\\.'+name));
  assert.match(sql,new RegExp('grant execute on function public\\.'+name));
 }
 assert.match(sql,/security definer set search_path = ''/);
});

test('paid account quotas and plan limits remain unchanged',()=>{
 const limits=read('lib/usage-limits.ts'),api=read('app/api/usage/quota/route.ts');
 assert.match(limits,/Free:3,Starter:500,Pro:1000,Premium:1500,Max:3000/);
 assert.match(api,/const \{data,error\}=await db\.rpc\('consume_daily_tool_usage',\{p_user_id:user\.id,p_limit:limit\}\)/);
 assert.match(api,/return respond\(\{mode:'account',plan,limit,used:data,userId:user\.id\}\)/);
});
