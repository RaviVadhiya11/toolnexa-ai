'use client';
import {useEffect,useState} from 'react';
import type {FormEvent} from 'react';
import type {PaidTier,BillingPeriod} from '@/lib/subscription-pricing';
import {browserSupabase} from '@/lib/supabase/client';

function SubscriptionAuth(){
 const [mode,setMode]=useState<'login'|'signup'>('signup');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const supabase=browserSupabase();
  if(!supabase){setMessage('Sign in is temporarily unavailable.');return}
  setBusy(true);setMessage('');
  try{
   if(mode==='signup'){
    const {data,error}=await supabase.auth.signUp({
     email,password,options:{emailRedirectTo:window.location.origin+'/auth/callback?next=pricing'}
    });
    if(error)throw error;
    if(!data.session)setMessage('Check your email for a confirmation link, then return here to subscribe.');
    // A signup with an immediate session triggers the auth listener in PayPalSubscribe.
   }else{
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error)throw error;
    // The auth listener replaces this form with the PayPal button.
   }
  }catch(error){setMessage(error instanceof Error?error.message:'Unable to sign in')}
  finally{setBusy(false)}
 }
 async function google(){
  const supabase=browserSupabase();
  if(!supabase){setMessage('Sign in is temporarily unavailable.');return}
  setBusy(true);setMessage('');
  const {error}=await supabase.auth.signInWithOAuth({
   provider:'google',options:{redirectTo:window.location.origin+'/auth/callback?next=pricing'}
  });
  if(error){setMessage(error.message);setBusy(false)}
 }
 return <div className="mt-7">
  <p className="font-semibold mb-3">Create an account or sign in to subscribe</p>
  <div className="flex gap-2 mb-4">
   <button type="button" className={mode==='signup'?'button':'button outline'} onClick={()=>{setMode('signup');setMessage('')}}>Sign up</button>
   <button type="button" className={mode==='login'?'button':'button outline'} onClick={()=>{setMode('login');setMessage('')}}>Log in</button>
  </div>
  <form onSubmit={submit}>
   <label className="text-sm font-semibold" htmlFor="pro-auth-email">Email address</label>
   <input id="pro-auth-email" className="field" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
   <label className="text-sm font-semibold" htmlFor="pro-auth-password">Password</label>
   <input id="pro-auth-password" className="field" type="password" minLength={6} autoComplete={mode==='login'?'current-password':'new-password'} required value={password} onChange={e=>setPassword(e.target.value)}/>
   <button type="submit" className="button w-full mt-3" disabled={busy}>{busy?'Please wait…':mode==='login'?'Log in and continue':'Create account and continue'}</button>
  </form>
  <button type="button" className="button outline w-full mt-3" disabled={busy} onClick={()=>void google()}>Continue with Google</button>
  {message&&<p className="muted mt-3" role="status">{message}</p>}
  <p className="muted text-sm mt-3">Your PayPal payment starts only after you approve the subscription.</p>
 </div>
}

export function PayPalSubscribe({planId,tier,billingPeriod}:{clientId?:string;planId:string;tier:PaidTier;billingPeriod:BillingPeriod}){
 const [signedIn,setSignedIn]=useState(false);
 const [checking,setChecking]=useState(true);
 const [redirecting,setRedirecting]=useState(false);
 const [message,setMessage]=useState('');
 useEffect(()=>{
  const supabase=browserSupabase();
  if(!supabase){setChecking(false);return}
  let active=true;
  void supabase.auth.getUser().then(({data})=>{
   if(active){setSignedIn(!!data.user);setChecking(false)}
  }).catch(()=>{if(active){setSignedIn(false);setChecking(false)}});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
   if(active){setSignedIn(!!session?.user);setChecking(false)}
  });
  return()=>{active=false;subscription.unsubscribe()};
 },[]);
 async function hostedCheckout(){
  setRedirecting(true);setMessage('');
  try{
   const response=await fetch('/api/paypal/start',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({tier,billingPeriod}),credentials:'same-origin',cache:'no-store'
   });
   const data=await response.json() as {approvalUrl?:unknown;error?:unknown};
   if(!response.ok||typeof data.approvalUrl!=='string')
    throw new Error(typeof data.error==='string'?data.error:'Unable to open PayPal checkout');
   const url=new URL(data.approvalUrl);
   if(url.protocol!=='https:'||!(url.hostname==='paypal.com'||url.hostname.endsWith('.paypal.com')))
    throw new Error('Invalid PayPal approval link');
   window.location.assign(url.toString());
  }catch(error){
   setRedirecting(false);
   setMessage(error instanceof Error?error.message:'Unable to start PayPal checkout');
  }
 }
 if(checking)return <p className="muted mt-7" role="status">Checking your account…</p>;
 if(!signedIn)return <SubscriptionAuth/>;
 return <div className="mt-7">
  <p className="muted text-sm mb-3">Your {tier} plan renews {billingPeriod==='yearly'?'every 12 months':'monthly'}.
   The full {billingPeriod==='yearly'?'annual':'monthly'} amount will be shown on PayPal before approval.
   An existing active subscription must be managed before starting another.</p>
  <button type="button" className="button w-full" disabled={redirecting||!planId}
   onClick={()=>void hostedCheckout()}>{redirecting?'Opening PayPal…':`Continue securely to PayPal — ${billingPeriod==='yearly'?'Yearly':'Monthly'}`}</button>
  {message&&<p className="muted mt-3" role="alert">{message}</p>}
 </div>;
}
