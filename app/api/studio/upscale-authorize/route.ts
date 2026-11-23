import {NextRequest,NextResponse} from 'next/server';
import {adminDb} from '@/lib/admin';
import {dailyLimits} from '@/lib/usage-limits';
import {verifyStudioMember} from '@/lib/studio-membership';

export const runtime='nodejs';
const noStore={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const fail=(error:string,status:number)=>NextResponse.json({error},{status,headers:noStore});
const allowed=['2x','4x','4k','8k'] as const;
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return fail('Invalid origin',403);
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return fail('Expected JSON',415);
 let data:unknown;
 try{data=await req.json()}catch{return fail('Invalid JSON',400)}
 const resolution=data&&typeof data==='object'&&'resolution' in data?(data as {resolution:unknown}).resolution:null;
 if(typeof resolution!=='string'||!allowed.some(x=>x===resolution))return fail('Unknown resolution',400);
 const member=await verifyStudioMember();
 if('error' in member)return fail(member.error,member.status);
 if(resolution==='8k'&&!['Premium','Max'].includes(member.plan))return fail('8K requires Premium or Max',403);
 if(['4x','4k'].includes(resolution)&&member.plan==='Starter')return fail('4× / 4K require Pro or higher',403);
 const db=adminDb();if(!db)return fail('Quota database unavailable',503);
 const {data:used,error}=await db.rpc('consume_daily_tool_usage',{
  p_user_id:member.userId,p_limit:dailyLimits[member.plan]});
 if(error)return fail('Unable to reserve an upscale run',503);
 if(used===null)return fail('Daily quota reached. Upgrade for more runs.',429);
 if(typeof used!=='number'||used<1||used>dailyLimits[member.plan])return fail('Invalid quota response',503);
 return NextResponse.json({authorized:true,plan:member.plan,resolution,used},{headers:noStore});
}
