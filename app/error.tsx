'use client';
import {useEffect} from 'react';
import Link from 'next/link';
import {AlertTriangle,RotateCcw,House} from 'lucide-react';

export default function ErrorPage({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
 useEffect(()=>{
  // Keep error details out of the public UI. Error monitoring can be added later.
  if(process.env.NODE_ENV==='development')console.error(error);
 },[error]);
 return <section className="site-feedback-page" role="alert" aria-labelledby="error-title">
  <div className="site-feedback-icon"><AlertTriangle size={32}/></div>
  <p className="site-feedback-eyebrow">SOMETHING WENT WRONG</p>
  <h1 id="error-title">This page couldn't load</h1>
  <p>Your account and subscription have not been changed. Retry the page, or go back home.</p>
  <div className="site-feedback-actions"><button className="button" type="button" onClick={reset}><RotateCcw size={17}/> Try again</button><Link className="button outline" href="/"><House size={17}/> Back home</Link></div>
 </section>;
}
