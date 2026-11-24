'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Check,ClipboardPaste,Download,ImageIcon,Link2,LoaderCircle,ShieldCheck,Video, X} from 'lucide-react';
import {parseYoutubeId} from '@/lib/advanced-operations';
import {withPaidDownload,showDownloadGate} from '@/lib/download-access';
import {dailyLimits,isUsagePlan,quotaKey,readUsage,consumeUsage,reconcileFreeDeviceUsage,mirrorFreeDeviceUsage,type QuotaMode,type UsagePlan} from '@/lib/usage-limits';
import {isYoutubeQuality,youtubeThumbnailUrl,type YoutubeThumbOption,type YoutubeThumbQuality} from '@/lib/youtube-thumbnails';
import './youtube-thumbnail-downloader.css';

const SLUG='youtube-thumbnail-downloader';
type Balance={plan:UsagePlan;mode:QuotaMode;used:number;limit:number;key:string;userId:string|null};
type ThumbnailApi={ok?:boolean;available?:YoutubeThumbOption[];error?:string};

function parsedVideoId(input:string):string{
 const trimmed=input.trim();
 if(!trimmed||trimmed.length>2048)return '';
 const normalized=/^(?:www\.|m\.)?(?:youtube\.com|youtube-nocookie\.com|youtu\.be)\//i.test(trimmed)?
  'https://'+trimmed:trimmed;
 try{return parseYoutubeId(normalized)}catch{return ''}
}
function saveJpeg(blob:Blob,videoId:string,quality:YoutubeThumbQuality){
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 a.href=url;
 a.download='toolnexa-youtube-'+videoId+'-'+quality+'.jpg';
 document.body.appendChild(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),30000);
}

export function YouTubeThumbnailDownloader(){
 const [link,setLink]=useState('');
 const videoId=useMemo(()=>parsedVideoId(link),[link]);
 const [available,setAvailable]=useState<YoutubeThumbOption[]>([]);
 const [choice,setChoice]=useState<YoutubeThumbQuality|null>(null);
 const [loading,setLoading]=useState(false);
 const [fetchError,setFetchError]=useState('');
 const [previewError,setPreviewError]=useState(false);
 const [downloading,setDownloading]=useState(false);
 const [downloadError,setDownloadError]=useState('');
 const [notice,setNotice]=useState('');
 const [quota,setQuota]=useState<Balance|null>(null);
 const [quotaError,setQuotaError]=useState('');
 const locked=useRef(false);
 const chosen=available.find(q=>q.quality===choice)||null;
 const preview=videoId&&chosen?youtubeThumbnailUrl(videoId,chosen.quality):'';

 const refreshQuota=useCallback(async():Promise<Balance>=>{
  const response=await fetch('/api/usage/quota',{cache:'no-store',credentials:'same-origin'});
  const result=await response.json().catch(()=>({error:'Usage service unavailable'})) as {
   plan?:unknown;mode?:unknown;used?:unknown;userId?:unknown;error?:string
  };
  if(!response.ok)throw Error(result.error||'Unable to check daily usage.');
  if(!isUsagePlan(result.plan)||!['device','account','browser'].includes(String(result.mode)))
   throw Error('Unexpected usage allowance.');
  const plan=result.plan,mode=result.mode as QuotaMode;
  const userId=typeof result.userId==='string'?result.userId:null;
  const key=quotaKey(mode==='device'?null:userId);
  const used=mode==='device'?await reconcileFreeDeviceUsage(Number(result.used),userId):
   mode==='account'?Number(result.used):readUsage(key);
  if(!Number.isSafeInteger(used)||used<0)throw Error('Invalid account usage value.');
  const balance={plan,mode,userId,key,used,limit:dailyLimits[plan]};
  setQuota(balance);setQuotaError('');
  return balance;
 },[]);

 useEffect(()=>{
  let active=true;
  const update=()=>{void refreshQuota().catch(()=>{if(active)setQuotaError('Daily usage unavailable. Downloads may require a refresh.')})};
  update();
  window.addEventListener('focus',update);
  window.addEventListener('toolnexa-subscription-changed',update);
  return()=>{active=false;window.removeEventListener('focus',update);window.removeEventListener('toolnexa-subscription-changed',update)};
 },[refreshQuota]);

 useEffect(()=>{
  setAvailable([]);setChoice(null);setFetchError('');setPreviewError(false);setNotice('');setDownloadError('');
  if(!videoId){setLoading(false);return}
  let active=true;
  const controller=new AbortController();
  setLoading(true);
  const timer=window.setTimeout(async()=>{
   try{
    const response=await fetch('/api/youtube-thumbnail?videoId='+encodeURIComponent(videoId)+'&list=1',{
     cache:'no-store',credentials:'same-origin',signal:controller.signal
    });
    const data=await response.json() as ThumbnailApi;
    if(!response.ok)throw Error(data.error||'Thumbnail service unavailable.');
    const valid=(data.available||[]).filter((q):q is YoutubeThumbOption=>
     isYoutubeQuality(q.quality)&&Number.isInteger(q.width)&&Number.isInteger(q.height)&&
     q.width>=100&&q.height>=70&&q.width<=4096&&q.height<=4096);
    if(!valid.length)throw Error('No public thumbnail was found for this YouTube video.');
    if(active){setAvailable(valid);setChoice(valid[0].quality)}
   }catch(err){
    if(active&&!controller.signal.aborted)setFetchError(err instanceof Error?err.message:'Unable to load thumbnail preview.');
   }finally{if(active)setLoading(false)}
  },260);
  return()=>{active=false;window.clearTimeout(timer);controller.abort()};
 },[videoId]);

 async function pasteFromClipboard(){
  try{setLink(await navigator.clipboard.readText())}
  catch{setNotice('Use your browser’s Paste option to insert the YouTube link.')}
 }
 async function reserveDownload(balance:Balance){
  if(balance.used>=balance.limit){
   showDownloadGate({kind:'limit',feature:'YouTube thumbnail download',requiredTier:'Starter',
    currentPlan:balance.plan,message:'Your daily tool allowance has finished. Upgrade or return after the UTC reset.'});
   throw Error('Daily tool limit reached.');
  }
  if(balance.mode==='browser'){
   const used=consumeUsage(balance.key,balance.limit);
   if(used===null)throw Error('Daily usage limit reached or browser storage is unavailable.');
   setQuota({...balance,used});return;
  }
  const response=await fetch('/api/usage/quota',{
   method:'POST',credentials:'same-origin',cache:'no-store',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({slug:SLUG,...(balance.mode==='device'?{clientUsed:readUsage(quotaKey(null))}:{})})
  });
  const data=await response.json().catch(()=>({error:'Unable to reserve daily usage'})) as {used?:number;error?:string};
  if(!response.ok){
   if(response.status===429){
    setQuota({...balance,used:balance.limit});
    showDownloadGate({kind:'limit',feature:'YouTube thumbnail download',requiredTier:'Starter',
     currentPlan:balance.plan,message:data.error||'Daily tool allowance reached.'});
   }
   throw Error(data.error||'Daily usage verification failed.');
  }
  if(typeof data.used!=='number')throw Error('Unexpected daily usage response.');
  if(balance.mode==='device')mirrorFreeDeviceUsage(data.used);
  setQuota({...balance,used:data.used});
 }

 async function downloadSelected(){
  if(!videoId||!chosen||locked.current)return;
  setNotice('');setDownloadError('');
  // Existing global subscription popup handles free accounts and expired plans.
  await withPaidDownload({slug:SLUG,feature:'YouTube thumbnail JPG download',requiredTier:'Starter'},async()=>{
   if(locked.current)return;
   locked.current=true;setDownloading(true);
   try{
    const url=youtubeThumbnailUrl(videoId,chosen.quality);
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store'});
    if(!response.ok)throw Error('This thumbnail quality is no longer available. Choose another size.');
    const blob=await response.blob();
    if(!blob.type.startsWith('image/jpeg')||blob.size<300)
     throw Error('Thumbnail image could not be downloaded.');
    const balance=await refreshQuota();
    await reserveDownload(balance);
    saveJpeg(blob,videoId,chosen.quality);
    setNotice('Downloaded '+chosen.width+' × '+chosen.height+' JPG successfully.');
    void fetch('/api/usage',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({slug:SLUG}),keepalive:true}).catch(()=>{});
   }catch(err){setDownloadError(err instanceof Error?err.message:'Download failed. Please try again.')}
   finally{locked.current=false;setDownloading(false)}
  });
 }

 return <section className="youtube-thumb-studio" aria-label="YouTube Thumbnail Studio">
  <div className="youtube-thumb-heading">
   <div className="youtube-thumb-icon"><Video size={24} aria-hidden="true"/></div>
   <div><span className="youtube-thumb-eyebrow">CREATOR STUDIO · IMAGE UTILITIES</span>
    <h2>Thumbnail Preview &amp; Download</h2>
    <p>Paste a YouTube video link. View the original thumbnail and choose the best available resolution.</p>
   </div>
   <span className="youtube-thumb-chip"><ShieldCheck size={14} aria-hidden="true"/> Public thumbnail</span>
  </div>

  <div className="youtube-thumb-input-panel">
   <label htmlFor="youtube-thumbnail-link"><Link2 size={16} aria-hidden="true"/> YouTube video, Shorts or live link</label>
   <div className="youtube-thumb-input-wrap">
    <input id="youtube-thumbnail-link" type="url" value={link} spellCheck={false} autoComplete="off"
     onChange={event=>setLink(event.target.value)} placeholder="https://youtube.com/watch?v=..."
     aria-describedby="youtube-thumbnail-help" />
    {link&&<button type="button" className="youtube-thumb-input-icon" aria-label="Clear YouTube link"
     onClick={()=>setLink('')}><X size={17}/></button>}
    <button className="youtube-thumb-paste" type="button" onClick={()=>void pasteFromClipboard()}>
     <ClipboardPaste size={16} aria-hidden="true"/> Paste
    </button>
   </div>
   <div className="youtube-thumb-input-details" id="youtube-thumbnail-help">
    <span>Supports watch, youtu.be, Shorts, live, embed and video IDs</span>
    <button type="button" onClick={()=>setLink('https://www.youtube.com/watch?v=jNQXAC9IVRw')}>
     Try example
    </button>
   </div>
   {link.trim()&&!videoId&&<p className="youtube-thumb-form-error" role="status">Enter a valid YouTube video link or 11-character video ID.</p>}
   {videoId&&<span className="youtube-thumb-detected"><Check size={14} aria-hidden="true"/> Video detected · {videoId}</span>}
  </div>

  <div className="youtube-thumb-workspace">
   <div className="youtube-thumb-preview-panel">
    <div className="youtube-thumb-section-head"><span><ImageIcon size={17} aria-hidden="true"/> Live thumbnail preview</span>
     {chosen&&<span className="youtube-thumb-resolution">{chosen.width} × {chosen.height}</span>}
    </div>
    <div className={'youtube-thumb-image-shell'+(loading?' is-loading':'')}>
     {preview&&!previewError?
      <img key={preview} src={preview} alt={'Preview of the YouTube video '+videoId}
       width={chosen?.width||480} height={chosen?.height||270}
       onError={()=>setPreviewError(true)}/>:
      <div className="youtube-thumb-empty">
       {loading?<><LoaderCircle className="youtube-thumb-spinner" size={29} aria-hidden="true"/><strong>Finding available thumbnails…</strong></>:
       fetchError||previewError?<><ImageIcon size={28} aria-hidden="true"/><strong>Thumbnail unavailable</strong><span>{fetchError||'Unable to display the selected image. Try another resolution.'}</span></>:
       <><ImageIcon size={30} aria-hidden="true"/><strong>Your thumbnail preview appears here</strong><span>Paste a YouTube link to see the image automatically.</span></>}
      </div>}
    </div>
    {chosen&&<div className="youtube-thumb-image-caption"><span><Check size={15} aria-hidden="true"/> Real YouTube thumbnail</span><span>JPG · {chosen.width} × {chosen.height}</span></div>}
   </div>
   <div className="youtube-thumb-options-panel">
    <div className="youtube-thumb-section-head"><span>Available image qualities</span>
     {available.length>0&&<span className="youtube-thumb-count">{available.length} sizes</span>}
    </div>
    <p className="youtube-thumb-options-copy">Select a resolution below. Only sizes that really exist for this video are shown.</p>
    {available.length?<div className="youtube-thumb-qualities" role="group" aria-label="Thumbnail resolution">
     {available.map((item,index)=><button type="button" key={item.quality}
       aria-pressed={item.quality===choice} className={'youtube-thumb-quality'+(item.quality===choice?' is-selected':'')}
       onClick={()=>{setChoice(item.quality);setPreviewError(false);setNotice('');setDownloadError('')}}>
       <span className="youtube-thumb-quality-top"><strong>{item.label}</strong>
        {item.quality===choice?<Check size={16} aria-hidden="true"/>:index===0?<small>BEST</small>:null}
       </span>
       <span>{item.width} × {item.height} pixels</span>
      </button>)}
     </div>:
      <div className="youtube-thumb-no-qualities">{loading?'Checking Max HD, SD, HQ, MQ and Small…':'Available resolutions will appear after you paste a valid link.'}</div>}
    <button type="button" className="youtube-thumb-download" disabled={!chosen||downloading||loading}
     onClick={()=>void downloadSelected()}>
     {downloading?<LoaderCircle className="youtube-thumb-spinner" size={19} aria-hidden="true"/>:
      <Download size={20} aria-hidden="true"/>}
     {downloading?'Preparing JPG…':chosen?'Download '+chosen.width+' × '+chosen.height+' JPG':'Choose a thumbnail to download'}
    </button>
    <p className="youtube-thumb-premium"><ShieldCheck size={14} aria-hidden="true"/>
     Preview is free. File downloads require a verified Starter plan or higher and count toward your daily allowance.
    </p>
    {quota&&!quotaError&&<p className="youtube-thumb-usage">Daily runs: {Math.max(0,quota.limit-quota.used)} of {quota.limit} remaining · {quota.plan}</p>}
    {quotaError&&<p className="youtube-thumb-usage">{quotaError}</p>}
    {downloadError&&<p className="youtube-thumb-form-error" role="alert">{downloadError}</p>}
    {notice&&<p className="youtube-thumb-success" role="status">{notice}</p>}
   </div>
  </div>
  <p className="youtube-thumb-copyright">Thumbnails belong to their original creators. Download and reuse them only with appropriate permission. Maximum resolution depends on the video.</p>
 </section>;
}
