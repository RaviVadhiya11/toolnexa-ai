'use client';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {useEffect,useState} from 'react';
import {AccountStatus} from '@/components/account-status';
import {tools} from '@/lib/tools';
import {ShieldCheck,Home,LayoutGrid,LayoutDashboard,Crown,Moon,Sun,Search,FileText,Image as ImageIcon,Code2,Briefcase,Type,Menu,X,Sparkles,ArrowUpRight,LifeBuoy,CreditCard} from 'lucide-react';
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
   <footer className="premium-footer editorial-footer">
    <div className="editorial-footer-main">
     <section className="editorial-footer-about" aria-labelledby="footer-about-title">
      <Link href="/" className="brand premium-brand editorial-footer-brand"><span className="brand-icon"><Sparkles size={23}/></span><span>ToolNexa <em>AI</em></span></Link>
      <h2 id="footer-about-title">ABOUT TOOLNEXA AI</h2>
      <p>All your everyday PDF, image, text, developer and business tools in one smart workspace.</p>
      <p className="editorial-footer-caption">20 browser-based free tools. Optional premium batch text analysis.</p>
      <a href="https://github.com/RaviVadhiya11/toolnexa-ai/issues" className="editorial-footer-contact" target="_blank" rel="noopener noreferrer"><span className="editorial-footer-contact-icon"><Briefcase size={17}/></span>Report a technical issue <ArrowUpRight size={17}/></a>
     </section>
     <nav className="editorial-footer-column" aria-labelledby="footer-categories-title">
      <h2 id="footer-categories-title">POPULAR CATEGORIES</h2>
      {groups.map(group=><Link href={'/tools?category='+group.name} key={group.name}><group.icon size={17}/>{group.name} Tools</Link>)}
     </nav>
     <nav className="editorial-footer-column" aria-labelledby="footer-links-title">
      <h2 id="footer-links-title">QUICK LINKS</h2>
      <Link href="/">Home</Link>
      <Link href="/tools">All Tools</Link>
      <Link href="/pricing">Premium Pricing</Link>
      <Link href="/dashboard">My Dashboard</Link>
      <Link href="/support">Help &amp; Support</Link>
     </nav>
    </div>
    <section className="editorial-footer-contact-section" aria-labelledby="footer-contact-heading">
      <div className="editorial-contact-copy">
       <span className="editorial-contact-badge"><LifeBuoy size={19}/></span>
       <div><h2 id="footer-contact-heading">CONTACT US &amp; SUPPORT</h2><p>Need help with tools or your subscription? Find the right support option below.</p></div>
      </div>
      <div className="editorial-contact-actions">
       <Link href="/support" className="editorial-contact-button"><LifeBuoy size={17}/> Help Center</Link>
       <a href="https://github.com/RaviVadhiya11/toolnexa-ai/issues" target="_blank" rel="noopener noreferrer" className="editorial-contact-button"><Briefcase size={17}/> Report an Issue <ArrowUpRight size={15}/></a>
       <Link href="/billing" className="editorial-contact-button"><CreditCard size={17}/> Billing Help</Link>
      </div>
     </section>
    <div className="editorial-footer-bottom">
     <nav className="editorial-footer-legal" aria-label="Legal and help links">
      <Link href="/privacy">Privacy Policy</Link>
      <Link href="/terms">Terms &amp; Conditions</Link>
      <Link href="/billing">Billing &amp; Cancellation</Link>
      <Link href="/support">Contact &amp; Support</Link>
     </nav>
     <p>© {new Date().getFullYear()} ToolNexa AI. All rights reserved.</p>
    </div>
   </footer>
  </main>
  <nav className="mobile-nav premium-mobile-nav" aria-label="Bottom navigation">{nav.map(item=><Link href={item.href} key={item.href} className={path===item.href||item.href==='/tools'&&path.startsWith('/tools/')?'active':''} aria-current={path===item.href||item.href==='/tools'&&path.startsWith('/tools/')?'page':undefined}><item.icon size={21}/><span>{item.label}</span></Link>)}</nav>
 </div>;
}
