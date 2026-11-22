import {NextRequest,NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';

export async function GET(req:NextRequest){
 const code=req.nextUrl.searchParams.get('code');
 const base=req.nextUrl.origin;
 // Allow only a known internal destination; never redirect to an arbitrary URL.
 const destination=req.nextUrl.searchParams.get('next')==='pricing'?'/pricing':'/dashboard';
 const supabase=await serverSupabase();
 if(code&&supabase){
  const {error}=await supabase.auth.exchangeCodeForSession(code);
  if(!error)return NextResponse.redirect(new URL(destination,base));
 }
 const fallback=destination==='/pricing'?'/login?next=pricing&error=confirmation':'/login?error=confirmation';
 return NextResponse.redirect(new URL(fallback,base));
}
