'use client';
import {useEffect,useRef,useState} from 'react';
import type {FormEvent} from 'react';
import type {PaidTier,BillingPeriod} from '@/lib/subscription-pricing';
import {browserSupabase} from '@/lib/supabase/client';

declare global {
 interface Window {
  paypal?: {Buttons:(options:Record<string,unknown>)=>{render:(element:HTMLElement)=>Promise<void>}};
 }
}

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

export function PayPalSubscribe({clientId,planId,tier,billingPeriod}:{clientId:string;planId:string;tier:PaidTier;billingPeriod:BillingPeriod}){
 const root=useRef<HTMLDivElement>(null);
 const [userId,setUserId]=useState<string|null>(null);
 const [checking,setChecking]=useState(true);
 const [message,setMessage]=useState('');
 const [sdkError,setSdkError]=useState(false);
 const [retry,setRetry]=useState(0);
 const [redirecting,setRedirecting]=useState(false);
 useEffect(()=>{
  const supabase=browserSupabase();
  if(!supabase){setChecking(false);return}
  let active=true;
  void supabase.auth.getUser().then(({data})=>{if(active){setUserId(data.user?.id??null);setChecking(false)}})
   .catch(()=>{if(active){setUserId(null);setChecking(false)}});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
   if(active){setUserId(session?.user?.id??null);setChecking(false)}
  });
  return()=>{active=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
  if(!userId||!planId||billingPeriod==='yearly')return;
  let cancelled=false;
  let script:HTMLScriptElement|null=null;
  setSdkError(false);
  setMessage('');
  const fail=(detail:string)=>{
   if(cancelled)return;
   setSdkError(true);
   setMessage(detail);
  };
  const render=async()=>{
   if(cancelled||!root.current)return;
   if(!window.paypal?.Buttons){
    fail('PayPal checkout could not initialize. Please retry, or use a browser without content blockers.');
    return;
   }
   root.current.replaceChildren();
   try{
    await window.paypal.Buttons({
     style:{layout:'vertical',color:'blue',shape:'rect',label:'subscribe'},
     createSubscription:(_data:unknown,actions:any)=>actions.subscription.create({plan_id:planId,custom_id:userId}),
     onApprove:async(data:any)=>{
      try{
       const response=await fetch('/api/paypal/verify',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({subscriptionID:data.subscriptionID})
       });
       if(!response.ok)throw Error();
       const result=await response.json();
       if(!cancelled)setMessage(result.status==='ACTIVE'?'Subscription verified. Your '+tier+' access is active.':'PayPal approved your subscription. '+tier+' access will start once PayPal activates it.');
      }catch{
       if(!cancelled)setMessage('PayPal approval received. Verification pending; contact support if this persists.');
      }
     },
     onError:()=>{if(!cancelled)setMessage('PayPal could not complete checkout. No subscription was confirmed on this page.');}
    }).render(root.current);
   }catch{
    fail('PayPal checkout buttons could not be displayed. Please retry.');
   }
  };
  if(window.paypal?.Buttons){void render()}
  else{
   // Remove a previously failed SDK script before retrying; never reuse a broken load.
   document.querySelectorAll('script[data-toolnexa-paypal-sdk]').forEach(el=>el.remove());
   script=document.createElement('script');
   script.dataset.toolnexaPaypalSdk='true';
   script.src='https://www.paypal.com/sdk/js?client-id='+encodeURIComponent(clientId)+'&components=buttons&currency=USD&vault=true&intent=subscription';
   script.async=true;
   script.onload=()=>{void render()};
   script.onerror=()=>fail('PayPal checkout failed to load. Check your connection or browser content blockers, then retry.');
   document.body.appendChild(script);
  }
  return()=>{cancelled=true;if(script){script.onload=null;script.onerror=null;script.remove()}};
 },[clientId,planId,userId,retry,tier,billingPeriod]);
 async function hostedCheckout(){
  setRedirecting(true);
  setMessage('');
  try{
   const response=await fetch('/api/paypal/start',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({tier,billingPeriod})
   });
   const data=await response.json();
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
 if(!userId)return <SubscriptionAuth/>;
 if(billingPeriod==='yearly')return <div className="mt-7">
  <p className="muted text-sm mb-3">Annual checkout uses PayPal's hosted approval page, so your existing subscriptions are checked before a new 12-month subscription begins. Review the yearly price and renewal details on PayPal.</p>
  <button type="button" className="button w-full" disabled={redirecting} onClick={()=>void hostedCheckout()}>{redirecting?'Opening PayPal…':'Continue securely to PayPal — Yearly'}</button>
  {message&&<p className="muted mt-3" role="status">{message}</p>}
 </div>;
 return <div className="mt-7">
  <div ref={root}/>
  {message&&<p className="muted mt-3" role="status">{message}</p>}
  {sdkError&&<div className="mt-3">
   <button type="button" className="button w-full" disabled={redirecting}
    onClick={()=>void hostedCheckout()}>{redirecting?'Opening PayPal…':'Continue securely on PayPal'}</button>
   <p className="muted text-sm mt-2">You will review and approve the {billingPeriod==='yearly'?'annual':'monthly'} subscription on PayPal before it can be activated.</p>
   <button type="button" className="button outline mt-3" disabled={redirecting}
    onClick={()=>{setMessage('');setRetry(n=>n+1)}}>Retry PayPal checkout button</button>
  </div>}
 </div>;
}
