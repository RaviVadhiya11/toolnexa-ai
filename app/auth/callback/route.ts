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
 const requestedTier=params.get('plan'),requestedBilling=params.get('billing');
 const pricingUrl=new URL('/pricing',base);
 if(requestedTier&&['Starter','Pro','Premium','Max'].includes(requestedTier))pricingUrl.searchParams.set('plan',requestedTier);
 if(requestedBilling==='monthly'||requestedBilling==='yearly')pricingUrl.searchParams.set('billing',requestedBilling);
 const destination=isRecovery?'/reset-password?verified=1':next==='pricing'?pricingUrl.pathname+pricingUrl.search:'/dashboard';
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
 const loginUrl=new URL('/login',base);
 loginUrl.searchParams.set('error','confirmation');
 if(next==='pricing'){
  loginUrl.searchParams.set('next','pricing');
  if(pricingUrl.searchParams.has('plan'))loginUrl.searchParams.set('plan',pricingUrl.searchParams.get('plan')!);
  if(pricingUrl.searchParams.has('billing'))loginUrl.searchParams.set('billing',pricingUrl.searchParams.get('billing')!);
 }
 const fallback=loginUrl.pathname+loginUrl.search;
 return NextResponse.redirect(new URL(fallback,base));
}
