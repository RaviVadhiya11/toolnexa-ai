'use client';
import {useEffect,useRef,useState} from 'react';
import type {FormEvent} from 'react';
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

export function PayPalSubscribe({clientId,planId}:{clientId:string;planId:string}){
 const root=useRef<HTMLDivElement>(null);
 const [userId,setUserId]=useState<string|null>(null);
 const [checking,setChecking]=useState(true);
 const [message,setMessage]=useState('');
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
  if(!userId||!planId)return;
  let cancelled=false;
  let script:HTMLScriptElement|null=null;
  const render=()=>{
   if(cancelled||!root.current||!window.paypal)return;
   root.current.replaceChildren();
   void window.paypal.Buttons({
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
      setMessage(result.status==='ACTIVE'?'Subscription verified. Your Pro access is active.':'PayPal approved your subscription. Pro access will start once PayPal activates it.');
     }catch{setMessage('PayPal approval received. Verification pending; contact support if this persists.')}
    },
    onError:()=>setMessage('PayPal checkout failed. Please try again.')
   }).render(root.current);
  };
  if(window.paypal)render();
  else{
   script=document.createElement('script');
   script.src='https://www.paypal.com/sdk/js?client-id='+encodeURIComponent(clientId)+'&vault=true&intent=subscription';
   script.onload=render;
   script.onerror=()=>setMessage('PayPal unavailable');
   document.body.appendChild(script);
  }
  return()=>{cancelled=true;if(script)script.remove()};
 },[clientId,planId,userId]);
 if(checking)return <p className="muted mt-7" role="status">Checking your account…</p>;
 if(!userId)return <SubscriptionAuth/>;
 return <div className="mt-7"><div ref={root}/>{message&&<p className="muted mt-3" role="status">{message}</p>}</div>;
}
