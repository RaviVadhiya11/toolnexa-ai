'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {AccountStatus} from '@/components/account-status';
import {ManageSubscription} from '@/components/manage-subscription';
import {browserSupabase} from '@/lib/supabase/client';
export default function Dashboard(){
 const [recent,setRecent]=useState<string[]>([]);
 const [plan,setPlan]=useState('Checking…');
 useEffect(()=>{try{setRecent(JSON.parse(localStorage.getItem('toolnexa-recent')||'[]'))}catch{setRecent([])}},[]);
 useEffect(()=>{
  let active=true;
  const refresh=async()=>{
   if(!active)return;
   try{const response=await fetch('/api/pro/status',{cache:'no-store'});const data=await response.json();if(active)setPlan(response.ok&&typeof data.plan==='string'?data.plan:'Unavailable')}
   catch{if(active)setPlan('Unavailable')}
  };
  void refresh();
  const client=browserSupabase();
  const subscription=client?.auth.onAuthStateChange(()=>{setPlan('Checking…');void refresh()}).data.subscription;
  const onFocus=()=>void refresh();
  window.addEventListener('focus',onFocus);
  window.addEventListener('toolnexa-subscription-changed',onFocus);
  return()=>{active=false;subscription?.unsubscribe();window.removeEventListener('focus',onFocus);window.removeEventListener('toolnexa-subscription-changed',onFocus)};
 },[]);
 return <><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-extrabold">Your Dashboard 👋</h1><AccountStatus/></div><p className="muted mt-2">View tools used on this device. Local activity stays on this device; account-based sync is planned.</p><div className="stats"><div className="stat"><strong>{recent.length}</strong><span className="muted text-sm">Recent Tools</span></div><div className="stat"><strong>20</strong><span className="muted text-sm">Free Tools</span></div><div className="stat"><strong>{plan}</strong><span className="muted text-sm">Current Plan</span></div></div><div className="panel"><h2 className="font-bold text-xl">Recent Activity</h2>{recent.length?recent.map((slug,i)=><p key={slug+i} className="mt-4"><Link style={{color:'var(--accent)'}} href={'/tools/'+slug}>{slug.replaceAll('-',' ')}</Link></p>):<p className="muted mt-4">No recent tools yet. Try a tool to see it here.</p>}<button className="button outline mt-5" onClick={()=>{localStorage.removeItem('toolnexa-recent');setRecent([])}}>Clear history</button></div><ManageSubscription/><div className="panel mt-5"><b>AI Credits — Coming Soon</b><p className="muted mt-2 text-sm">AI credits are not available yet. Pro access is verified on the server for eligible premium tools.</p><div className="progress mt-4"><div style={{width:'0%'}}/></div></div></>
}
