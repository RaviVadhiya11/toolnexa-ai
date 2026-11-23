import {NextRequest,NextResponse} from 'next/server';
import {deflateSync} from 'node:zlib';
import {adminDb} from '@/lib/admin';
import {dailyLimits} from '@/lib/usage-limits';
import {verifyHdMember} from '@/lib/studio-membership';

export const runtime='nodejs';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(error:string,status:number)=>NextResponse.json({error},{status,headers});

const crcTable=Array.from({length:256},(_,i)=>{
 let n=i;for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;
 return n>>>0;
});
function crc(buffer:Buffer){
 let value=0xffffffff;
 for(const byte of buffer)value=crcTable[(value^byte)&255]^(value>>>8);
 return (value^0xffffffff)>>>0;
}
function pngChunk(name:string,data:Buffer){
 const nameBytes=Buffer.from(name,'ascii'),length=Buffer.alloc(4),checksum=Buffer.alloc(4);
 length.writeUInt32BE(data.length,0);
 checksum.writeUInt32BE(crc(Buffer.concat([nameBytes,data])),0);
 return Buffer.concat([length,nameBytes,data,checksum]);
}
function pngFromRGBA(rgba:Buffer,width:number,height:number){
 const header=Buffer.alloc(13);
 header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);
 header[8]=8;header[9]=6; // 8-bit RGBA
 const stride=width*4,scanlines=Buffer.allocUnsafe(height*(stride+1));
 for(let y=0;y<height;y++){
  const offset=y*(stride+1);scanlines[offset]=0;
  rgba.copy(scanlines,offset+1,y*stride,(y+1)*stride);
 }
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  pngChunk('IHDR',header),pngChunk('IDAT',deflateSync(scanlines,{level:6})),pngChunk('IEND',Buffer.alloc(0))]);
}
function bilinear(src:Buffer,width:number,height:number,factor:number){
 const w=width*factor,h=height*factor,output=Buffer.allocUnsafe(w*h*4);
 for(let y=0;y<h;y++){
  const sy=Math.max(0,Math.min(height-1,(y+.5)/factor-.5));
  const y0=Math.floor(sy),y1=Math.min(height-1,y0+1),fy=sy-y0;
  for(let x=0;x<w;x++){
   const sx=Math.max(0,Math.min(width-1,(x+.5)/factor-.5));
   const x0=Math.floor(sx),x1=Math.min(width-1,x0+1),fx=sx-x0;
   const a=(y0*width+x0)*4,b=(y0*width+x1)*4,c=(y1*width+x0)*4,d=(y1*width+x1)*4;
   const dest=(y*w+x)*4;
   for(let channel=0;channel<4;channel++){
    const top=src[a+channel]*(1-fx)+src[b+channel]*fx;
    const bottom=src[c+channel]*(1-fx)+src[d+channel]*fx;
    output[dest+channel]=Math.round(top*(1-fy)+bottom*fy);
   }
  }
 }
 return output;
}
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
  typeof data!=='string'||data.length>3900000||!/^[-A-Za-z0-9+/]*={0,2}$/.test(data))
  return reply('Invalid dimensions, format or export resolution',400);
 const bytes=Buffer.from(data,'base64');
 if(bytes.length!==width*height*4)return reply('Invalid pixel data',400);
 const db=adminDb();
 if(!db)return reply('Quota database unavailable',503);
 const {data:used,error:quotaError}=await db.rpc('consume_daily_tool_usage',{
  p_user_id:member.userId,p_limit:dailyLimits[member.plan]
 });
 if(quotaError)return reply('Unable to verify daily account limit',503);
 if(used===null)return reply('Your daily tool allowance has been reached',429);
 if(typeof used!=='number'||used<1||used>dailyLimits[member.plan])
  return reply('Invalid daily quota response',503);
 const output=bilinear(bytes,width,height,scale);
 const png=pngFromRGBA(output,width*scale,height*scale);
 return new NextResponse(new Uint8Array(png),{
  status:200,headers:{...headers,
   'Content-Type':'image/png',
   'Content-Disposition':'attachment; filename="toolnexa-'+(kind==='vector'?'vector':'enhanced')+'-hd.png"'}
 });
}
