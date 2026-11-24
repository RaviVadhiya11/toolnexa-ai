import {NextRequest,NextResponse} from 'next/server';
import {verifyStudioMember} from '@/lib/studio-membership';
import {zipPlans,zipRequiredTier,zipPlanAllows,type ZipCompression} from '@/lib/zip-plan-limits';
export const runtime='nodejs';
const h={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const result=(obj:object,status=200)=>NextResponse.json(obj,{status,headers:h});
export async function POST(request:NextRequest){
 if(request.headers.get('origin')!==request.nextUrl.origin)
  return result({authorized:false,error:'Invalid request origin'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))
  return result({authorized:false,error:'Invalid content type'},415);
 let body:unknown;
 try{body=await request.json()}catch{return result({authorized:false,error:'Invalid JSON'},400)}
 const input=body&&typeof body==='object'?body as Record<string,unknown>:null;
 if(!input||!['fast','smart','maximum'].includes(String(input.mode)))
  return result({authorized:false,error:'Invalid compression strategy'},400);
 const {count,bytes}=input;
 const mode=input.mode as ZipCompression;
 if(typeof count!=='number'||typeof bytes!=='number')
  return result({authorized:false,error:'Invalid archive content summary'},400);
 const required=zipRequiredTier(count,bytes,mode);
 if(!required){
  return result({authorized:false,error:'ZIP Maker supports up to 300 files and 300 MB per archive. Use smaller files or split your archive.'},413);
 }
 const member=await verifyStudioMember();
 if('error' in member){
  return result({authorized:false,requiredTier:required,plan:'Free',error:member.error},member.status);
 }
 if(!zipPlanAllows(member.plan,required)){
  return result({authorized:false,plan:member.plan,requiredTier:required,
   error:'Your ZIP needs '+required+' or higher ('+count+' files, '+Math.ceil(bytes/1048576)+' MB, '+mode+' mode). Upgrade to download.'},403);
 }
 return result({authorized:true,plan:member.plan,requiredTier:required,
  limits:zipPlans[member.plan]});
}
