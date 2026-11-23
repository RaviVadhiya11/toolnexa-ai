'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {browserSupabase} from '@/lib/supabase/client';
import {LockKeyhole,MailCheck} from 'lucide-react';

export default function ResetPasswordPage(){
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [confirm,setConfirm]=useState('');
 const [recovery,setRecovery]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [success,setSuccess]=useState(false);
 useEffect(()=>{
  const client=browserSupabase();
  if(!client)return;
  let active=true;
  // Only a verified recovery callback should switch from requesting an email to updating a password.
  // An ordinary signed-in session must not silently turn this page into a password change form.
  const search=new URLSearchParams(window.location.search);
  if(search.get('error')==='invalid-link')setMessage('This reset link is invalid, expired, or already used. Enter your email below to request a new link.');
  const verified=search.get('verified')==='1';
  if(verified)void client.auth.getUser().then(({data,error})=>{
   if(!active)return;
   if(!error&&data.user)setRecovery(true);
   else setMessage('Recovery link is invalid or has expired. Request a new password reset email.');
  });
  return()=>{active=false};
 },[]);
 async function submit(event:React.FormEvent){
  event.preventDefault();const client=browserSupabase();
  if(!client){setMessage('Account recovery is not configured.');return}
  if(recovery&&(password.length<8||password!==confirm)){
   setMessage(password!==confirm?'Passwords do not match.':'Use a password of at least 8 characters.');return;
  }
  setBusy(true);setMessage('');
  try{
   if(recovery){
    const {error}=await client.auth.updateUser({password});if(error)throw error;
    setSuccess(true);setMessage('Password updated successfully. You can now sign in with your new password.');
    await client.auth.signOut();
   }else{
    const {error}=await client.auth.resetPasswordForEmail(email.trim(),{
     redirectTo:window.location.origin+'/auth/callback?next=reset'
    });
    if(error)throw error;
    setSuccess(true);setMessage('If this email has an account, a new reset link will arrive. Use the newest email and open it in the same browser where you requested it. Check Spam if needed.');
   }
  }catch(error){setMessage(error instanceof Error?error.message:'Unable to complete password recovery.')}
  finally{setBusy(false)}
 }
 return <section className="auth-wrap"><div className="panel">
  <div className="tool-icon">{success?<MailCheck size={27}/>:<LockKeyhole size={27}/>}</div>
  <h1 className="text-3xl font-extrabold">{recovery?'Choose a new password':'Reset your password'}</h1>
  <p className="muted text-sm mt-2 mb-6">{recovery?'Set a secure password for your ToolNexa AI account.':'Enter your account email. We will send a secure recovery link if an account exists.'}</p>
  {!success&&<form onSubmit={e=>void submit(e)}>
   {recovery?<><label htmlFor="reset-new" className="text-sm font-semibold">New password</label><input id="reset-new" className="field" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/><label htmlFor="reset-confirm" className="text-sm font-semibold">Confirm password</label><input id="reset-confirm" className="field" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></>:<><label htmlFor="reset-email" className="text-sm font-semibold">Email address</label><input id="reset-email" className="field" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></>}
   <button type="submit" className="button w-full" disabled={busy}>{busy?'Processing…':recovery?'Save new password':'Send reset link'}</button>
  </form>}
  {message&&<p role={success?'status':'alert'} className="small-note mt-4">{message}</p>}
  <p className="text-sm muted mt-6"><Link href="/login" style={{color:'var(--accent)'}}>Back to Sign in</Link></p>
 </div></section>;
}
