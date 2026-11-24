'use client';
import Link from 'next/link';
import {useEffect,useMemo,useRef,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {Search,X,ArrowUp,ArrowDown,CornerDownLeft,Sparkles,LayoutGrid} from 'lucide-react';
import {tools} from '@/lib/tools';

const studio=[
 {href:'/studio/enhance',name:'AI Detail Enhancer & 8K Upscale',detail:'Image · enhance · 2× / 4× / 4K / 8K',icon:'✦'},
 {href:'/studio/image-to-vector',name:'Image to Vector',detail:'Trace raster art into editable SVG paths',icon:'◇'},
 {href:'/studio/vector',name:'Logo & Vector Studio',detail:'Create logos and vector graphics',icon:'✧'},
 {href:'/studio/background-remove',name:'Background Remover',detail:'AI subject cutout or offline solid colors',icon:'▣'},
 {href:'/studio/convert',name:'Vector Converter',detail:'SVG, vector PDF, EPS, outline DXF',icon:'⇄'},
 {href:'/studio/svg-editor',name:'SVG Editor',detail:'Edit colors and shapes',icon:'⌘'},
 {href:'/studio/retouch',name:'Object Remover & Retouch',detail:'Heal selected small spots',icon:'◉'},
 {href:'/studio/restore',name:'Photo Restore & Colorizer',detail:'Clean, sharpen and recolor faded photos',icon:'☀'},
 {href:'/studio/batch',name:'Batch Pro+ ZIP Engine',detail:'Real Premium / Max multi-image processing',icon:'⚡'},
] as const;

export function FlagshipCommandPalette(){
 const [open,setOpen]=useState(false);
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState(0);
 const inputRef=useRef<HTMLInputElement|null>(null);
 const router=useRouter(),pathname=usePathname();
 const results=useMemo(()=>{
  const q=query.trim().toLowerCase();
  const suites=studio.filter(item=>(item.name+' '+item.detail).toLowerCase().includes(q));
  const utilities=tools.filter(item=>(item.title+' '+item.description+' '+item.category).toLowerCase().includes(q))
   .map(t=>({href:'/tools/'+t.slug,name:t.title,detail:t.category+' · '+t.description,icon:t.icon}));
  return [...suites,...utilities].slice(0,15);
 },[query]);
 useEffect(()=>{
  const onKey=(e:KeyboardEvent)=>{
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setOpen(v=>!v)}
   if(e.key==='Escape')setOpen(false);
  };
  const onShow=()=>setOpen(true);
  window.addEventListener('keydown',onKey);
  window.addEventListener('toolnexa-open-command',onShow);
  return()=>{window.removeEventListener('keydown',onKey);window.removeEventListener('toolnexa-open-command',onShow)};
 },[]);
 useEffect(()=>{setOpen(false);setQuery('');setSelected(0)},[pathname]);
 useEffect(()=>{if(open){inputRef.current?.focus();setSelected(0)}},[open]);
 useEffect(()=>{setSelected(0)},[query]);
 function navigate(href:string){setOpen(false);router.push(href)}
 function handleKey(e:React.KeyboardEvent<HTMLInputElement>){
  if(e.key==='ArrowDown'){e.preventDefault();setSelected(v=>(v+1)%Math.max(1,results.length))}
  else if(e.key==='ArrowUp'){e.preventDefault();setSelected(v=>(v+Math.max(1,results.length)-1)%Math.max(1,results.length))}
  else if(e.key==='Enter'&&results[selected]){e.preventDefault();navigate(results[selected].href)}
 }
 if(!open)return null;
 return <div className="flagship-command-overlay" onMouseDown={e=>{if(e.currentTarget===e.target)setOpen(false)}}>
  <section className="flagship-command-panel" role="dialog" aria-modal="true" aria-label="Find Studio and utility tools">
   <div className="flagship-command-search">
    <Search size={21} aria-hidden="true"/>
    <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={handleKey}
      aria-label="Search all 68 tools" placeholder="Search Studio tools, PDF, images, text, developers…"/>
    <button type="button" onClick={()=>setOpen(false)} aria-label="Close search"><X size={20}/></button>
   </div>
   <div className="flagship-command-meta"><Sparkles size={15}/> 9 Studio workspaces · 60 working utilities</div>
   <div className="flagship-command-results" role="listbox" aria-label="Tools matching your search">
    {results.length?results.map((item,index)=><button key={item.href} type="button" role="option"
      aria-selected={index===selected} className={index===selected?'active':''}
      onMouseEnter={()=>setSelected(index)} onClick={()=>navigate(item.href)}>
       <span className="flagship-command-tool-icon">{item.icon}</span>
       <span><strong>{item.name}</strong><small>{item.detail}</small></span><CornerDownLeft size={14}/>
      </button>):<div className="flagship-command-empty">No results. Try “PDF”, “background”, “JSON” or “upscale”.</div>}
   </div>
   <footer className="flagship-command-footer"><span><ArrowUp size={13}/><ArrowDown size={13}/> Navigate</span>
    <span><CornerDownLeft size={13}/> Open</span><span>Esc Close</span>
    <Link href="/tools" onClick={()=>setOpen(false)}><LayoutGrid size={14}/> Browse all tools</Link>
   </footer>
  </section>
 </div>;
}
