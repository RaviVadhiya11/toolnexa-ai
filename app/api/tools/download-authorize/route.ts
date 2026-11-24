import {NextRequest,NextResponse} from 'next/server';
import {tools} from '@/lib/tools';
import {studioRunSlugs} from '@/lib/studio-run-slugs';
import {verifyStudioMember} from '@/lib/studio-membership';

export const runtime='nodejs';
const accepted=new Set<string>([...tools.map(t=>t.slug),...studioRunSlugs]);
const noStore={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(data:object,status=200)=>NextResponse.json(data,{status,headers:noStore});

// One source of truth for downloadable files in every utility/Creator tool.
// User identity and actual PayPal ACTIVE status are verified on the server;
// never trust a plan name, localStorage flag or client-supplied entitlement.
export async function POST(request:NextRequest){
 if(request.headers.get('origin')!==request.nextUrl.origin)
  return reply({authorized:false,error:'Invalid request origin'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))
  return reply({authorized:false,error:'Expected JSON'},415);
 let json:unknown;
 try{json=await request.json()}catch{return reply({authorized:false,error:'Invalid JSON'},400)}
 const body=json&&typeof json==='object'?json as Record<string,unknown>:null;
 const slug=body?.slug;
 if(typeof slug!=='string'||!accepted.has(slug))
  return reply({authorized:false,error:'Unknown tool'},400);
 const required=body?.requiredTier;
 if(required!==undefined&&!['Starter','Pro','Premium','Max'].includes(String(required)))
  return reply({authorized:false,error:'Unknown export tier'},400);
 const requested=required==='Max'?'8k':required==='Premium'?'8k':required==='Pro'?'4k':'2x';
 const member=await verifyStudioMember();
 if('error' in member)return reply({authorized:false,error:member.error,requiredTier:required||'Starter'},member.status);
 const ranks={Starter:1,Pro:2,Premium:3,Max:4};
 const needed=required==='Max'?4:required==='Premium'?3:required==='Pro'?2:1;
 if(ranks[member.plan]<needed)
  return reply({authorized:false,error:'Upgrade to '+(required||'Starter')+' or higher to download this file.',requiredTier:required||'Starter',plan:member.plan},403);
 return reply({authorized:true,plan:member.plan,slug,requested});
}
