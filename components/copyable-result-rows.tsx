'use client';
import {useState} from 'react';
import {extractCopyableRows} from '@/lib/copyable-output';

/** Only appears when the result contains several independent readable items. */
export function CopyableResultRows({text,slug}:{text:string;slug:string}){
 const [copied,setCopied]=useState<number|null>(null);
 const [error,setError]=useState('');
 const items=extractCopyableRows(text,slug);
 if(!items.length)return null;
 async function copy(value:string,index:number){
  try{
   await navigator.clipboard.writeText(value);
   setCopied(index);setError('');
  }catch{
   setCopied(null);
   setError('Clipboard unavailable. Select and copy the text manually.');
  }
 }
 return <section className="copy-lines-panel" aria-label="Copy individual result items">
  <div className="social-section-head"><h4>Copy individual items</h4><span className="small-note">{items.length} items</span></div>
  <div className="copy-lines-list">{items.map((item,index)=><div className="social-title-row" key={index}>
   <span className="social-title-text">{item.display}</span>
   <button type="button" className="social-copy-btn" aria-label={'Copy item '+(index+1)}
    onClick={()=>void copy(item.copyValue,index)}>{copied===index?'Copied!':'Copy'}</button>
  </div>)}</div>
  <p role="status" aria-live="polite" className="social-copy-feedback">{error||copied!==null?'':null}{error||(copied!==null?'Copied to clipboard.':'')}</p>
 </section>;
}
