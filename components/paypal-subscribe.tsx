'use client';
import {useEffect,useRef,useState} from 'react';
import {browserSupabase} from '@/lib/supabase/client';
declare global {interface Window {paypal?:{Buttons:(options:Record<string,unknown>)=>{render:(element:HTMLElement)=>Promise<void>}}}}
export function PayPalSubscribe({clientId,planId}:{clientId:string;planId:string}){
 const root=useRef<HTMLDivElement>(null);const [message,setMessage]=useState('');
 useEffect(()=>{
  let cancelled=false;let script:HTMLScriptElement|null=null;
  const start=async()=>{
   const supabase=browserSupabase();const {data:{user}}=supabase?await supabase.auth.getUser():{data:{user:null}};
   if(!user){setMessage('Sign in before subscribing.');return}
   if(!root.current||cancelled)return;
   const render=()=>{if(cancelled||!root.current||!window.paypal)return;
    window.paypal.Buttons({style:{layout:'vertical',color:'blue',shape:'rect',label:'subscribe'},
     createSubscription:(_data:unknown,actions:any)=>actions.subscription.create({plan_id:planId,custom_id:user.id}),
     onApprove:async(data:any)=>{try{const response=await fetch('/api/paypal/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscriptionID:data.subscriptionID})});if(!response.ok)throw Error();const result=await response.json();setMessage(result.status==='ACTIVE'?'Subscription verified. Your Pro access is active.':'PayPal approved your subscription. Pro access will start once PayPal activates it.')}catch{setMessage('PayPal approval received. Verification pending; contact support if this persists.')}},
     onError:()=>setMessage('PayPal checkout failed. Please try again.')
    }).render(root.current)};
   if(window.paypal){render();return}
   script=document.createElement('script');script.src='https://www.paypal.com/sdk/js?client-id='+encodeURIComponent(clientId)+'&vault=true&intent=subscription';script.onload=render;script.onerror=()=>setMessage('PayPal unavailable');document.body.appendChild(script);
  };void start();return()=>{cancelled=true;if(script)script.remove()};
 },[clientId,planId]);
 return <div><div ref={root}/>{message&&<p className="muted mt-3" role="status">{message}</p>}</div>;
}
