'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';

export default function SubscriptionReturn(){
 const [message,setMessage]=useState('Verifying PayPal approval…');
 const [successful,setSuccessful]=useState(false);
 useEffect(()=>{
  let active=true;
  async function finish(){
   const params=new URLSearchParams(window.location.search);
   const subscriptionID=params.get('subscription_id');
   if(!subscriptionID||!/^I-[A-Z0-9]+$/i.test(subscriptionID)){
    if(active)setMessage('PayPal did not return a valid subscription ID. If you approved a subscription, contact support.');
    return;
   }
   try{
    const response=await fetch('/api/paypal/verify',{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({subscriptionID}),credentials:'same-origin',cache:'no-store'
    });
    const result=await response.json();
    if(!response.ok)throw new Error('The PayPal subscription has not been verified yet. Please contact support if it does not appear in your dashboard.');
    if(active){
     setSuccessful(true);
     setMessage(result.status==='ACTIVE'
      ?'Your subscription is active. Your paid tools are now available.'
      :'PayPal has approved your subscription. Paid access begins after activation.');
    }
   }catch(error){if(active)setMessage(error instanceof Error?error.message:'Unable to verify subscription')}
  }
  void finish();
  return()=>{active=false};
 },[]);
 return <main className="auth-wrap">
  <section className="panel" aria-live="polite">
   <h1 className="text-2xl font-extrabold">PayPal subscription</h1>
   <p className="muted mt-4">{message}</p>
   <div className="mt-6 flex gap-3 flex-wrap">
    <Link className="button" href={successful?'/dashboard':'/pricing'}>{successful?'Go to dashboard':'Back to pricing'}</Link>
   </div>
  </section>
 </main>;
}
