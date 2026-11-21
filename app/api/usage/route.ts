import {NextRequest,NextResponse} from 'next/server';
import {adminDb} from '@/lib/admin';
import {tools} from '@/lib/tools';
export const runtime='nodejs';
const allowed=new Set(tools.map(t=>t.slug));
export async function POST(request:NextRequest){
  const origin=request.headers.get('origin');
  if(!origin||new URL(origin).host!==request.nextUrl.host)return NextResponse.json({error:'Invalid origin'},{status:403});
  const type=request.headers.get('content-type')||'';
  if(!type.startsWith('application/json'))return NextResponse.json({error:'Invalid content type'},{status:415});
  let body:unknown;
  try{body=await request.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
  const slug=body&&typeof body==='object'&&'slug' in body?(body as {slug:unknown}).slug:null;
  if(typeof slug!=='string'||!allowed.has(slug))return NextResponse.json({error:'Unknown tool'},{status:400});
  const db=adminDb();
  if(!db)return NextResponse.json({error:'Analytics not configured'},{status:503});
  const {error}=await db.rpc('increment_tool_usage',{p_slug:slug});
  if(error){console.error('Usage recording failed',error.code);return NextResponse.json({error:'Analytics unavailable'},{status:503})}
  return NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}
