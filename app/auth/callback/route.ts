import {NextRequest,NextResponse} from 'next/server';
import {serverSupabase} from '@/lib/supabase/server';

export async function GET(req:NextRequest){
 const params=req.nextUrl.searchParams;
 const base=req.nextUrl.origin;
 const next=params.get('next');
 const tokenHash=params.get('token_hash');
 const type=params.get('type');
 const code=params.get('code');
 const isRecovery=next==='reset'||type==='recovery';
 // Only allow known destinations (avoid untrusted open redirects).
 const destination=isRecovery?'/reset-password?verified=1':next==='pricing'?'/pricing':'/dashboard';
 const supabase=await serverSupabase();
 if(supabase){
  // PKCE links: code is exchanged on the server to create the session cookie.
  if(code){
   const {error}=await supabase.auth.exchangeCodeForSession(code);
   if(!error)return NextResponse.redirect(new URL(destination,base));
  }
  // Email template token-hash links: verify only supported recovery tokens here.
  if(tokenHash&&type==='recovery'){
   const {error}=await supabase.auth.verifyOtp({token_hash:tokenHash,type:'recovery'});
   if(!error)return NextResponse.redirect(new URL('/reset-password?verified=1',base));
  }
 }
 // Invalid, expired or already used recovery links must never silently sign the user in.
 if(isRecovery)return NextResponse.redirect(new URL('/reset-password?error=invalid-link',base));
 const fallback=next==='pricing'?'/login?next=pricing&error=confirmation':'/login?error=confirmation';
 return NextResponse.redirect(new URL(fallback,base));
}
