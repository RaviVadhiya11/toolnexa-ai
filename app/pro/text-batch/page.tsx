'use client';
import {useState} from 'react';
type Result={item:number;characters:number;words:number;sentences:number;lines:number;readingMinutes:number};
export default function ProTextPage(){
 const [input,setInput]=useState('');const [results,setResults]=useState<Result[]>([]);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function analyze(){
  setError('');setResults([]);setBusy(true);
  try{
   const texts=input.split(/\n---\n/u).map(s=>s.trim()).filter(Boolean);
   const response=await fetch('/api/pro/text-batch',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({texts})});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||'Unable to analyze text');
   setResults(data.results);
  }catch(e){setError(e instanceof Error?e.message:'Unable to analyze text')}finally{setBusy(false)}
 }
 return <><h1 className="text-3xl font-extrabold">Pro Batch Text Analyzer</h1><p className="muted mt-2 mb-6">Analyze up to 20 texts at once. Separate entries with a line containing only three hyphens (---). Available to signed-in members with an active Pro subscription.</p><div className="panel"><label htmlFor="pro-text-input" className="font-bold">Your texts</label><textarea id="pro-text-input" value={input} onChange={e=>setInput(e.target.value)} rows={12} maxLength={420000} style={{display:'block',width:'100%',marginTop:12,padding:12,borderRadius:10,border:'1px solid #aaa',background:'transparent'}} placeholder={'First text here\n---\nSecond text here'}/><button className="button mt-5" onClick={analyze} disabled={busy}>{busy?'Analyzing…':'Analyze texts'}</button>{error&&<p role="alert" className="muted mt-3">{error}</p>}</div>{results.length>0&&<div className="panel mt-6"><h2 className="text-xl font-bold mb-4">Analysis</h2><div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><thead><tr>{['Text','Words','Characters','Sentences','Lines','Read time (min)'].map(x=><th key={x} style={{padding:8}}>{x}</th>)}</tr></thead><tbody>{results.map(x=><tr key={x.item}>{[x.item,x.words,x.characters,x.sentences,x.lines,x.readingMinutes].map((v,i)=><td key={i} style={{padding:8}}>{v}</td>)}</tr>)}</tbody></table></div></div>}</>;
}
