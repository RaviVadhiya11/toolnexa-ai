'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {browserSupabase} from '@/lib/supabase/client';

type Subscription={id:string;tier:string;status:string;nextBillingTime:string|null};
type Result={subscriptions?:Subscription[];error?:string;ok?:boolean;status?:string};
const prices:Record<string,string>={Starter:'$3.99',Pro:'$5.99',Premium:'$9.99'};
export function ManageSubscription(){
 const [subscriptions,setSubscriptions]=useState<Subscription[]>([]);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [cancelId,setCancelId]=useState<string|null>(null);
 const refresh=useCallback(async()=>{
  setLoading(true);setError('');
  try{
   const response=await fetch('/api/paypal/manage',{cache:'no-store'});
   const result=await response.json() as Result;
   if(!response.ok)throw new Error(result.error||'Could not load subscriptions');
   setSubscriptions(result.subscriptions??[]);
  }catch(e){setError(e instanceof Error?e.message:'Unable to load subscriptions')}
  finally{setLoading(false)}
 },[]);
 useEffect(()=>{
  void refresh();
  const client=browserSupabase();
  const subscription=client?.auth.onAuthStateChange(()=>{setCancelId(null);void refresh()}).data.subscription;
  return()=>subscription?.unsubscribe();
 },[refresh]);
 async function cancel(id:string){
  setBusy(true);setError('');setNotice('');
  try{
   const response=await fetch('/api/paypal/manage',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action:'cancel',subscriptionId:id,confirmation:true})
   });
   const result=await response.json() as Result;
   if(!response.ok){
    if(response.status===202){
     setNotice(result.error||'PayPal cancellation is processing. Refresh for its current status.');
     setCancelId(null);await refresh();return;
    }
    throw new Error(result.error||'Unable to cancel subscription');
   }
   setCancelId(null);
   setNotice('Subscription cancelled through PayPal. Premium access is no longer active.');
   await refresh();
   window.dispatchEvent(new Event('toolnexa-subscription-changed'));
  }catch(e){setError(e instanceof Error?e.message:'Unable to cancel subscription')}
  finally{setBusy(false)}
 }
 const pending=subscriptions.filter(x=>['ACTIVE','APPROVED','SUSPENDED'].includes(x.status));
 const history=subscriptions.filter(x=>!['ACTIVE','APPROVED','SUSPENDED'].includes(x.status));
 return <section className="panel mt-5" aria-label="Manage your subscription">
  <div className="flex items-center justify-between gap-3 flex-wrap">
   <div><h2 className="font-bold text-xl">Manage Subscription</h2><p className="muted text-sm mt-1">Review your monthly plan and manage billing.</p></div>
   <button type="button" className="button outline" onClick={()=>void refresh()} disabled={loading||busy}>Refresh</button>
  </div>
  {loading?<p className="muted mt-4">Loading subscriptions…</p>:null}
  {error&&<p className="mt-4" role="alert">{error}</p>}
  {notice&&<p className="mt-4" role="status">{notice}</p>}
  {!loading&&!error&&subscriptions.length===0&&<div className="mt-5"><p className="muted">No subscription linked to this account yet.</p><Link className="button mt-4" href="/pricing">Explore premium plans</Link></div>}
  {!loading&&pending.map(item=><div key={item.id} className="mt-5" style={{padding:16,border:'1px solid var(--border)',borderRadius:14}}>
   <div className="flex justify-between items-center flex-wrap gap-2">
    <strong>{item.tier} — {prices[item.tier]??'Monthly plan'}/month</strong>
    <span className="badge">{item.status}</span>
   </div>
   {item.nextBillingTime&&<p className="muted text-sm mt-2">Next billing: {new Date(item.nextBillingTime).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}</p>}
   <p className="muted text-sm mt-2">Subscription: {item.id}</p>
   {cancelId===item.id?
    <div className="mt-4" role="group" aria-label="Confirm subscription cancellation">
     <p className="font-semibold">Cancel this subscription immediately?</p>
     <p className="muted text-sm mt-2">This stops future recurring billing. Premium access may end immediately. This action cannot be undone.</p>
     <div className="flex gap-2 flex-wrap mt-3">
      <button type="button" className="button" disabled={busy} onClick={()=>void cancel(item.id)}>{busy?'Cancelling…':'Yes, cancel subscription'}</button>
      <button type="button" className="button outline" disabled={busy} onClick={()=>setCancelId(null)}>Keep my plan</button>
     </div>
    </div>:
    <button type="button" className="button outline mt-4" disabled={busy}
     onClick={()=>{setNotice('');setCancelId(item.id)}}>Cancel Subscription</button>}
  </div>)}
  {!loading&&history.length>0&&<div className="mt-5">
   <h3 className="font-semibold">Subscription history</h3>
   {history.map(item=><p className="muted mt-2 text-sm" key={item.id}>{item.tier} — {item.status}</p>)}
  </div>}
  <p className="muted text-sm mt-5">You can also review billing in your <a href="https://www.paypal.com/myaccount/autopay/" target="_blank" rel="noopener noreferrer" style={{color:'var(--accent)'}}>PayPal account</a>. Cancellation here is immediate, not scheduled for the end of a billing period.</p>
 </section>;
}
