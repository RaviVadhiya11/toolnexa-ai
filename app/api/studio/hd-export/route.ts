import {NextRequest,NextResponse} from 'next/server';
import sharp from 'sharp';
import {adminDb} from '@/lib/admin';
import {dailyLimits} from '@/lib/usage-limits';
import {verifyHdMember} from '@/lib/studio-membership';

export const runtime='nodejs';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers});
export async function POST(request:NextRequest){
 if(request.headers.get('origin')!==request.nextUrl.origin)return reply('Invalid request origin',403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reply('Expected JSON',415);
 const size=Number(request.headers.get('content-length')||0);
 if(size>3900000)return reply('Image payload too large',413);
 const member=await verifyHdMember();
 if('error' in member)return reply(member.error,member.status);
 let body:unknown;
 try{body=await request.json()}catch{return reply('Invalid JSON',400)}
 const value=body&&typeof body==='object'?body as Record<string,unknown>:null;
 const width=value?.width,height=value?.height,scale=value?.scale,data=value?.pixels,kind=value?.kind;
 if(typeof width!=='number'||typeof height!=='number'||
  !Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width>1024||height>1024||
  width*height>700000||(scale!==2&&scale!==4)||
  width*height*scale*scale>12000000||!['image','vector'].includes(String(kind))||
  typeof data!=='string'||data.length>3900000||!/^[A-Za-z0-9+/]*={0,2}$/.test(data))
  return reply('Invalid dimensions, format or export resolution',400);
 const pixels=Buffer.from(data,'base64');
 if(pixels.length!==width*height*4)return reply('Invalid pixel data',400);
 const db=adminDb();
 if(!db)return reply('Quota database unavailable',503);
 const {data:used,error:quotaError}=await db.rpc('consume_daily_tool_usage',{
  p_user_id:member.userId,p_limit:dailyLimits[member.plan]
 });
 if(quotaError)return reply('Unable to verify daily account limit',503);
 if(used===null)return reply('Your daily tool allowance has been reached',429);
 if(typeof used!=='number'||used<1||used>dailyLimits[member.plan])
  return reply('Invalid daily quota response',503);
 let output:Buffer;
 let format:'image/png'|'image/jpeg'='image/png';
 try{
  const resize=()=>sharp(pixels,{raw:{width,height,channels:4}})
   .resize({width:width*scale,height:height*scale,kernel:'lanczos3',fit:'fill'})
   .sharpen({sigma:0.65});
  if(kind==='vector'){
   output=await resize().png({compressionLevel:9}).toBuffer();
  }else{
   format='image/jpeg';
   // Bound output to Vercel's normal 4.5MB response limit.
   output=Buffer.alloc(0);
   for(const quality of [90,82,74,66,58]){
    output=await resize().flatten({background:'#ffffff'}).jpeg({quality,mozjpeg:true}).toBuffer();
    if(output.length<=3900000)break;
   }
  }
 }catch{return reply('HD rendering failed. Try a smaller image',500)}
 if(output.length>3900000)return reply('Output is too large. Choose 2x or a simpler image',413);
 const filename=kind==='vector'?'toolnexa-vector-hd.png':'toolnexa-enhanced-hd.jpg';
 return new NextResponse(new Uint8Array(output),{
  status:200,headers:{...headers,'Content-Type':format,
   'Content-Disposition':'attachment; filename="'+filename+'"'}
 });
}
