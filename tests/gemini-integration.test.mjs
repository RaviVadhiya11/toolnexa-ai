import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const api=read('app/api/ai/social/route.ts');
const ui=read('components/advanced-tool-runner.tsx');
const migration=read('supabase/migrations/20261123_social_ai_free_quotas.sql');
const env=read('.env.example');

test('Gemini key is used only in server API, never in browser UI',()=>{
 assert.match(api,/process\.env\.GEMINI_API_KEY/);
 assert.match(api,/x-goog-api-key/);
 assert.doesNotMatch(ui,/GEMINI_API_KEY|x-goog-api-key|generativelanguage\.googleapis\.com/);
 assert.match(ui,/\/api\/ai\/social/);
 assert.match(env,/GEMINI_AI_ENABLED=false/);
});
test('API remains fail-closed until separately enabled and signed in',()=>{
 assert.match(api,/GEMINI_AI_ENABLED!=='true'/);
 assert.match(api,/supabase\.auth\.getUser/);
 assert.match(api,/Invalid request origin/);
 assert.match(api,/Sign in to generate/);
 assert.match(api,/permittedModels/);
 assert.match(api,/reserve_social_ai_usage/);
});
test('AI usage RPC uses service role only with RLS and bounded free quota',()=>{
 for(const table of ['social_ai_usage_daily','social_ai_global_daily']){
  assert.match(migration,new RegExp('alter table public\\.'+table+' enable row level security','i'));
  assert.match(migration,new RegExp('revoke all on public\\.'+table+' from anon, authenticated','i'));
 }
 assert.match(migration,/public\.social_ai_global_daily\.used < 30/);
 assert.match(migration,/public\.social_ai_usage_daily\.used < 3/);
 assert.match(migration,/revoke all on function public\.reserve_social_ai_usage\(uuid\) from public, anon, authenticated/);
 assert.match(migration,/grant execute on function public\.reserve_social_ai_usage\(uuid\) to service_role/);
});
test('Offline generation stays available even when Gemini is not configured',()=>{
 assert.match(ui,/aiMode==='offline'/);
 assert.match(ui,/socialSuggestions\(text,option,'professional'\)/);
 assert.match(ui,/Generation mode/);
 assert.match(ui,/The entered topic is sent securely/);
});
