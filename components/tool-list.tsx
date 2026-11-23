'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {categories,tools} from '@/lib/tools';

export function ToolList({compact=false}:{compact?:boolean}){
 const params=useSearchParams();
 const [category,setCategory]=useState<string|null>(null);
 const [search,setSearch]=useState<string|null>(null);
 const [sort,setSort]=useState<'default'|'az'>('default');
 // Sync URL-driven search/category navigation (sidebar links and browser history).
 const urlCategory=params.get('category');
 const urlSearch=params.get('q');
 useEffect(()=>{setCategory(urlCategory);setSearch(urlSearch);},[urlCategory,urlSearch]);
 const cat=category??params.get('category')??'All';
 const q=search??params.get('q')??'';
 const term=q.trim().toLowerCase();
 const matching=tools.filter(t=>(cat==='All'||t.category===cat)&&
  (`${t.title} ${t.description} ${t.category}`).toLowerCase().includes(term));
 const list=sort==='az'?[...matching].sort((a,b)=>a.title.localeCompare(b.title)):matching;
 const shown=compact?list.slice(0,6):list;
 function clearFilters(){setCategory('All');setSearch('');setSort('default')}
 return <section className="tool-catalogue" aria-label="Browse free tools">
  {!compact&&<div className="tool-discovery-bar">
   <div className="tool-discovery-input"><span aria-hidden="true">⌕</span><input value={q} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, category or task…" aria-label="Search all tools"/></div>
   <select className="tool-sort" value={sort} onChange={e=>setSort(e.target.value as 'default'|'az')} aria-label="Sort tools">
    <option value="default">Featured order</option><option value="az">Name A–Z</option>
   </select>
  </div>}
  <div className="tool-category-tabs" role="group" aria-label="Filter by category">
   {categories.map(c=><button type="button" key={c} className={'chip '+(cat===c?'active':'')}
     onClick={()=>setCategory(c)} aria-pressed={cat===c}>{c}{!compact&&<span className="tool-category-count">{c==='All'?tools.length:tools.filter(t=>t.category===c).length}</span>}</button>)}
  </div>
  {!compact&&<div className="tool-catalogue-meta"><span>{list.length} tool{list.length===1?'':'s'} found</span>{(term||cat!=='All')&&<button type="button" onClick={clearFilters}>Clear filters</button>}</div>}
  <div className="tools-grid">
   {shown.map(t=><Link className="tool-card tool-catalogue-card" key={t.slug} href={'/tools/'+t.slug}>
    <div className="tool-catalogue-card-top"><span className="tool-icon">{t.icon}</span><span className="tool-card-free">FREE</span></div>
    <span className="tool-card-category">{t.category} TOOL</span><strong>{t.title}</strong><p>{t.description}</p>
    <span className="tool-card-action">Open tool <span aria-hidden="true">→</span></span>
   </Link>)}
  </div>
  {list.length===0&&<div className="panel tool-empty-catalogue"><strong>No matching tools found</strong><p>Try another keyword or browse all 60 tools.</p><button type="button" className="button outline" onClick={clearFilters}>Show all tools</button></div>}
 </section>;
}
