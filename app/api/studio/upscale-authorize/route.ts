import {NextRequest,NextResponse} from 'next/server';
import {verifyStudioMember} from '@/lib/studio-membership';

export const runtime='nodejs';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reject=(error:string,status:number)=>NextResponse.json({error},{status,headers});
const formats=['2x','4x','4k','8k'] as const;

// This endpoint gates DOWNLOAD, not the free upscaling preview.
// The preview operation has already consumed one shared daily tool run.
// Do not charge another run just for verifying a download entitlement.
export async function POST(request:NextRequest){
 if(request.headers.get('origin')!==request.nextUrl.origin)return reject('Invalid request origin',403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return reject('Expected JSON',415);
 let payload:unknown;
 try{payload=await request.json()}catch{return reject('Invalid JSON',400)}
 const body=payload&&typeof payload==='object'?payload as Record<string,unknown>:null;
 if(body?.purpose!=='download')return reject('Only paid download authorization is supported',400);
 const resolution=body?.resolution;
 if(typeof resolution!=='string'||!formats.some(x=>x===resolution))return reject('Invalid output resolution',400);
 const member=await verifyStudioMember();
 if('error' in member)return reject(member.error,member.status);
 if(resolution==='8k'&&!['Premium','Max'].includes(member.plan))
  return reject('8K download requires Premium or Max',403);
 if(['4x','4k'].includes(resolution)&&member.plan==='Starter')
  return reject('4× / 4K download requires Pro, Premium or Max',403);
 return NextResponse.json({authorized:true,plan:member.plan,resolution},{headers});
}
