'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {ChevronDown,LogOut,UserRound,LayoutDashboard,CreditCard} from 'lucide-react';
import {browserSupabase} from '@/lib/supabase/client';

/** Compact auth menu: avoid full-width Sign out button in the mobile navbar.
 * Auth remains Supabase-controlled; this component only changes presentation. */
export function AccountStatus(){
 const [email,setEmail]=useState<string|null>(null);
 const [ready,setReady]=useState(false);
 const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const root=useRef<HTMLDivElement|null>(null);
 const trigger=useRef<HTMLButtonElement|null>(null);
 const router=useRouter();
 useEffect(()=>{
  const client=browserSupabase();
  if(!client){setReady(true);return}
  let mounted=true;
  void client.auth.getUser().then(({data})=>{
   if(mounted){setEmail(data.user?.email??null);setReady(true)}
  }).catch(()=>{if(mounted)setReady(true)});
  const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{
   if(mounted){setEmail(session?.user.email??null);setReady(true);setOpen(false)}
  });
  return()=>{mounted=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
  if(!open)return;
  function outside(event:PointerEvent){
   if(root.current&&!root.current.contains(event.target as Node))setOpen(false);
  }
  function escape(event:KeyboardEvent){
   if(event.key==='Escape'){setOpen(false);trigger.current?.focus()}
  }
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)};
 },[open]);
 async function signOut(){
  if(busy)return;
  setBusy(true);setError('');
  try{
   const client=browserSupabase();
   if(!client)throw Error('Sign out is temporarily unavailable.');
   const {error:authError}=await client.auth.signOut();
   if(authError)throw authError;
   setEmail(null);setOpen(false);
   router.push('/');router.refresh();
  }catch(err){setError(err instanceof Error?err.message:'Unable to sign out. Please retry.')}
  finally{setBusy(false)}
 }
 if(!ready)return <span className="flagship-account-skeleton" aria-label="Checking account session"><UserRound size={18}/></span>;
 if(!email)return <Link className="flagship-account-trigger flagship-signin" href="/login" aria-label="Sign in to ToolNexa AI">
  <UserRound size={19}/><span>Sign in</span>
 </Link>;
 return <div className="flagship-account" ref={root}>
  <button type="button" className="flagship-account-trigger" ref={trigger}
   aria-label="Open account menu" aria-haspopup="dialog" aria-expanded={open}
   onClick={()=>{setOpen(v=>!v);setError('')}} title={email}>
   <span className="flagship-account-avatar">{email.slice(0,1).toUpperCase()}</span>
   <span className="flagship-account-text">Account</span><ChevronDown className="flagship-account-chevron" size={13}/>
  </button>
  {open&&<div className="flagship-account-popover" role="dialog" aria-label="Your account options">
   <p className="flagship-account-kicker">SIGNED IN AS</p>
   <p className="flagship-account-email" title={email}>{email}</p>
   <Link href="/dashboard" onClick={()=>setOpen(false)}><LayoutDashboard size={17}/> My dashboard</Link>
   <Link href="/billing" onClick={()=>setOpen(false)}><CreditCard size={17}/> Billing & subscriptions</Link>
   <button type="button" className="flagship-account-logout" disabled={busy} onClick={()=>void signOut()}>
    <LogOut size={17}/>{busy?'Signing out…':'Sign out'}
   </button>
   {error&&<p role="alert" className="flagship-account-error">{error}</p>}
  </div>}
 </div>;
}
