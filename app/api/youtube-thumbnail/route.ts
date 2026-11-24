import {NextRequest,NextResponse} from 'next/server';
import sharp from 'sharp';
import {isYoutubeVideoId,isYoutubeQuality,YOUTUBE_THUMB_QUALITIES,type YoutubeThumbQuality} from '@/lib/youtube-thumbnails';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const common={'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=180, s-maxage=1800, stale-while-revalidate=3600'};
const errorResponse=(message:string,status:number)=>NextResponse.json({ok:false,error:message},{status,headers:{...common,'Cache-Control':'no-store'}});

type Picture={bytes:Buffer;width:number;height:number;quality:YoutubeThumbQuality};
async function picture(id:string,quality:YoutubeThumbQuality):Promise<Picture|null>{
 const preset=YOUTUBE_THUMB_QUALITIES.find(q=>q.id===quality);
 if(!preset)return null;
 // A fixed Google image host and strictly validated video ID eliminate arbitrary URL / SSRF.
 const url='https://i.ytimg.com/vi/'+id+'/'+quality+'.jpg';
 try{
  const remote=await fetch(url,{signal:AbortSignal.timeout(9000),next:{revalidate:1800}});
  if(!remote.ok||!(remote.headers.get('content-type')||'').startsWith('image/'))return null;
  const declared=Number(remote.headers.get('content-length')||'0');
  if(declared>5_000_000)return null;
  const bytes=Buffer.from(await remote.arrayBuffer());
  if(bytes.length<300||bytes.length>5_000_000)return null;
  const meta=await sharp(bytes,{limitInputPixels:16_000_000}).metadata();
  if(meta.format!=='jpeg'||!meta.width||!meta.height||meta.width<preset.minWidth||meta.height<70)return null;
  // Missing max-resolution covers often come back as 120×90 image placeholders,
  // so validating actual pixel dimensions is important.
  return {bytes,width:meta.width,height:meta.height,quality};
 }catch{return null}
}

export async function GET(request:NextRequest){
 const id=request.nextUrl.searchParams.get('videoId');
 if(!isYoutubeVideoId(id))return errorResponse('Enter a valid 11-character YouTube video ID.',400);
 if(request.nextUrl.searchParams.get('list')==='1'){
  const images=await Promise.all(YOUTUBE_THUMB_QUALITIES.map(q=>picture(id,q.id)));
  const available=images.flatMap((p,i)=>p?[{
   quality:p.quality,label:YOUTUBE_THUMB_QUALITIES[i].label,
   width:p.width,height:p.height
  }]:[]);
  if(!available.length)return errorResponse('No public thumbnail found for this YouTube video.',404);
  return NextResponse.json({ok:true,videoId:id,available},{headers:common});
 }
 const quality=request.nextUrl.searchParams.get('quality');
 if(!isYoutubeQuality(quality))return errorResponse('Choose a supported thumbnail resolution.',400);
 const img=await picture(id,quality);
 if(!img)return errorResponse('This thumbnail quality is not available for the video.',404);
 return new NextResponse(Uint8Array.from(img.bytes),{
  status:200,
  headers:{
   ...common,'Content-Type':'image/jpeg',
   'Content-Disposition':'inline; filename="toolnexa-'+id+'-'+quality+'.jpg"',
   'X-Thumbnail-Width':String(img.width),'X-Thumbnail-Height':String(img.height),
   'Cross-Origin-Resource-Policy':'same-origin'
  }
 });
}
