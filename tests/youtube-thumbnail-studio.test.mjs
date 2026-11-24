import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const operations=read('lib/advanced-operations.ts');
const transpiled=ts.transpileModule(operations,{compilerOptions:{
 target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022
}}).outputText;
const {parseYoutubeId}=await import('data:text/javascript;base64,'+Buffer.from(transpiled).toString('base64'));

test('YouTube URL parser supports video, Shorts, live, embeds and short links without accepting other hosts',()=>{
 const id='jNQXAC9IVRw';
 for(const value of [
  id,'https://youtu.be/'+id,
  'https://youtu.be/'+id+'?feature=share',
  'https://www.youtube.com/watch?v='+id,
  'https://www.youtube.com/watch?feature=share&v='+id,
  'https://m.youtube.com/shorts/'+id+'?si=abc',
  'https://youtube.com/live/'+id,
  'https://www.youtube.com/embed/'+id,
  'https://music.youtube.com/watch?v='+id
 ])assert.equal(parseYoutubeId(value),id);
 for(const value of [
  'https://evil-youtube.com/watch?v='+id,
  'https://youtube.com.evil.test/watch?v='+id,
  'https://example.com/watch?v='+id,
  'https://youtu.be/NOT_A_VIDEO_ID',
  'youtube.com/watch?v=x',
  'https://youtube.com/playlist?list=abc'
 ])assert.throws(()=>parseYoutubeId(value));
});

test('instant preview verifies actual available thumbnail sizes and never uses an arbitrary upstream URL',()=>{
 const api=read('app/api/youtube-thumbnail/route.ts');
 const quality=read('lib/youtube-thumbnails.ts');
 assert.match(api,/sharp\(bytes,\{limitInputPixels:16_000_000\}\)\.metadata\(\)/);
 assert.match(api,/meta\.width<preset\.minWidth/);
 assert.match(api,/const url='https:\/\/i\.ytimg\.com\/vi\/'\+id\+'\/'\+quality\+'\.jpg'/);
 assert.match(api,/isYoutubeVideoId\(id\)/);
 assert.match(api,/isYoutubeQuality\(quality\)/);
 assert.match(api,/request\.nextUrl\.searchParams\.get\('list'\)==='1'/);
 assert.match(api,/Content-Disposition':'inline/);
 assert.doesNotMatch(api,/request\.nextUrl\.searchParams\.get\('url'\)/);
 for(const key of ['maxresdefault','sddefault','hqdefault','mqdefault','default'])
  assert.ok(quality.includes("id:'"+key+"'"));
});

test('YouTube thumbnail page previews automatically with Neon UI; downloads preserve Starter tier and shared daily quota',()=>{
 const page=read('app/tools/[slug]/page.tsx');
 const ui=read('components/youtube-thumbnail-downloader.tsx');
 const css=read('components/youtube-thumbnail-downloader.css');
 assert.match(page,/slug==='youtube-thumbnail-downloader'\?<YouTubeThumbnailDownloader\/>/);
 assert.match(ui,/setTimeout\(async\(\)=>\{/);
 assert.match(ui,/setAvailable\(valid\);setChoice\(valid\[0\]\.quality\)/);
 assert.match(ui,/youtubeThumbnailUrl\(videoId,chosen\.quality\)/);
 assert.match(ui,/aria-pressed=\{item\.quality===choice\}/);
 assert.match(ui,/withPaidDownload\(\{slug:SLUG,feature:'YouTube thumbnail JPG download',requiredTier:'Starter'\}/);
 assert.match(ui,/await reserveDownload\(balance\)/);
 assert.match(ui,/consumeUsage\(balance\.key,balance\.limit\)/);
 assert.match(ui,/clientUsed:readUsage\(quotaKey\(null\)\)/);
 assert.match(ui,/mirrorFreeDeviceUsage\(data\.used\)/);
 assert.match(ui,/showDownloadGate\(\{kind:'limit'/);
 assert.match(css,/\.youtube-thumb-studio\{/);
 assert.match(css,/@media\(max-width:540px\)/);
 assert.doesNotMatch(ui,/href=\{\x60https:\/\/i\.ytimg\.com/);
});
