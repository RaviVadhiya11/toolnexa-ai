'use client';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {useEffect,useState} from 'react';
import {AccountStatus} from '@/components/account-status';
import {tools} from '@/lib/tools';
import {ShieldCheck,Home,LayoutGrid,LayoutDashboard,Crown,Moon,Sun,Search,FileText,Image as ImageIcon,Code2,Briefcase,Type,Menu,X,Sparkles,ArrowUpRight} from 'lucide-react';
const nav=[{href:'/',label:'Home',icon:Home},{href:'/tools',label:'All Tools',icon:LayoutGrid},{href:'/dashboard',label:'Dashboard',icon:LayoutDashboard},{href:'/pricing',label:'Pricing',icon:Crown},{href:'/admin',label:'Admin',icon:ShieldCheck}];
const groups=[{name:'Text',icon:Type},{name:'Image',icon:ImageIcon},{name:'PDF',icon:FileText},{name:'Developer',icon:Code2},{name:'Business',icon:Briefcase}] as const;
export function Shell({children}:{children:React.ReactNode}){
 const path=usePathname(),router=useRouter();
 const [dark,setDark]=useState(true),[q,setQ]=useState(''),[menuOpen,setMenuOpen]=useState(false);
 useEffect(()=>{
  const useDark=localStorage.getItem('toolnexa-theme')!=='light';
  setDark(useDark);
  document.documentElement.classList.toggle('dark',useDark);
  document.documentElement.classList.toggle('light',!useDark);
 },[]);
 useEffect(()=>{setMenuOpen(false)},[path]);
 function toggle(){const value=!dark;setDark(value);document.documentElement.classList.toggle('dark',value);document.documentElement.classList.toggle('light',!value);localStorage.setItem('toolnexa-theme',value?'dark':'light')}
 function findTools(e:React.FormEvent<HTMLFormElement>){e.preventDefault();router.push('/tools?q='+encodeURIComponent(q.trim()))}
 const toolsIndex=path==='/tools';
 const searchBox=<form className="shell-search-form" onSubmit={findTools} role="search">
  <input className="search" placeholder="Search 20 smart tools…" aria-label="Search tools" value={q} onChange={e=>setQ(e.target.value)}/>
  <button className="button outline shell-search-button" type="submit" aria-label="Search tools"><Search size={19}/></button>
 </form>;
 return <div className="shell premium-shell">
  <a className="site-skip-link" href="#main-content">Skip to main content</a>
  <aside className={'sidebar premium-sidebar '+(menuOpen?'sidebar-open':'')} aria-label="Main menu">
   <div className="premium-sidebar-head">
    <Link href="/" className="brand premium-brand"><span className="brand-icon"><Sparkles size={22}/></span><span>ToolNexa <em>AI</em></span></Link>
    <button type="button" className="mobile-sidebar-close" aria-label="Close menu" onClick={()=>setMenuOpen(false)}><X size={20}/></button>
   </div>
   <p className="premium-sidebar-label">WORKSPACE</p>
   <nav aria-label="Main pages">{nav.map(item=><Link key={item.href} className={'nav '+(path===item.href||item.href==='/tools'&&path.startsWith('/tools/')?'active':'')} href={item.href} aria-current={path===item.href||item.href==='/tools'&&path.startsWith('/tools/')?'page':undefined}>
    <item.icon size={19}/><span>{item.label}</span>{item.href==='/tools'&&<small>{tools.length}</small>}
   </Link>)}</nav>
   <p className="premium-sidebar-label premium-sidebar-categories">TOOL CATEGORIES</p>
   <nav aria-label="Tool categories">{groups.map(group=><Link className="nav premium-category-link" href={'/tools?category='+group.name} key={group.name}>
    <group.icon size={18}/><span>{group.name} Tools</span><small>{tools.filter(tool=>tool.category===group.name).length}</small>
   </Link>)}</nav>
   <div className="premium-sidebar-upgrade">
    <span className="premium-upgrade-icon"><Crown size={20}/></span>
    <strong>ToolNexa Pro</strong>
    <p>More power for batch text analysis. Plans from $3.99/month.</p>
    <Link href="/pricing" className="premium-sidebar-cta">Explore plans <ArrowUpRight size={17}/></Link>
   </div>
  </aside>
  {menuOpen&&<button className="premium-menu-backdrop" aria-label="Close menu overlay" onClick={()=>setMenuOpen(false)} type="button"/>}
  <main id="main-content" className="main premium-main" tabIndex={-1}>
   <div className="premium-mobile-brand-row">
    <button type="button" className="premium-menu-button" onClick={()=>setMenuOpen(true)} aria-label="Open menu"><Menu size={21}/></button>
    <Link href="/" className="brand premium-brand"><span className="brand-icon"><Sparkles size={18}/></span><span>ToolNexa <em>AI</em></span></Link>
    <Link href="/pricing" className="premium-mobile-pro"><Crown size={16}/> Pro</Link>
   </div>
   <div className="top premium-top">
    {!toolsIndex&&searchBox}
    {toolsIndex&&<div className="premium-context-title"><LayoutGrid size={18}/><span>Tools workspace</span></div>}
    <button className="button outline shell-theme-toggle" onClick={toggle} type="button" aria-label={dark?'Switch to light mode':'Switch to dark mode'}>{dark?<Sun size={20}/>:<Moon size={20}/>}</button>
    <AccountStatus/>
    <Link href="/pricing" className="button shell-pro-link"><Crown size={17}/> Pro</Link>
   </div>
   {children}
   <footer className="premium-footer"><div>© {new Date().getFullYear()} ToolNexa AI · Built for productivity</div><nav className="premium-footer-links" aria-label="Website policies and help"><Link href="/tools">All Tools</Link><Link href="/pricing">Pricing</Link><Link href="/support">Support</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/billing">Billing &amp; Cancellation</Link></nav></footer>
  </main>
  <nav className="mobile-nav premium-mobile-nav" aria-label="Bottom navigation">{nav.map(item=><Link href={item.href} key={item.href} className={path===item.href||item.href==='/tools'&&path.startsWith('/tools/')?'active':''} aria-current={path===item.href||item.href==='/tools'&&path.startsWith('/tools/')?'page':undefined}><item.icon size={21}/><span>{item.label}</span></Link>)}</nav>
 </div>;
}
