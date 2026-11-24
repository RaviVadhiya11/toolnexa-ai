'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {FlagshipCommandPalette} from '@/components/flagship-command-palette';
import {useEffect,useState} from 'react';
import {AccountStatus} from '@/components/account-status';
import {tools} from '@/lib/tools';
import {ShieldCheck,Home,LayoutGrid,LayoutDashboard,Crown,Moon,Sun,Search,FileText,Image as ImageIcon,Code2,Briefcase,Type,Menu,X,Sparkles,ArrowUpRight,LifeBuoy,CreditCard,Clapperboard} from 'lucide-react';
const nav=[{href:'/',label:'Home',icon:Home},{href:'/tools',label:'All Tools',icon:LayoutGrid},{href:'/studio',label:'Creator Studio V4',icon:Sparkles},{href:'/dashboard',label:'Dashboard',icon:LayoutDashboard},{href:'/pricing',label:'Pricing',icon:Crown},{href:'/admin',label:'Admin',icon:ShieldCheck}];
const groups=[{name:'Text',icon:Type},{name:'Image',icon:ImageIcon},{name:'PDF',icon:FileText},{name:'Developer',icon:Code2},{name:'Business',icon:Briefcase},{name:'Creator',icon:Clapperboard}] as const;
export function Shell({children}:{children:React.ReactNode}){
 const path=usePathname();
 const [dark,setDark]=useState(true),[menuOpen,setMenuOpen]=useState(false);
 useEffect(()=>{
  const useDark=localStorage.getItem('toolnexa-theme')!=='light';
  setDark(useDark);
  document.documentElement.classList.toggle('dark',useDark);
  document.documentElement.classList.toggle('light',!useDark);
 },[]);
 useEffect(()=>{setMenuOpen(false)},[path]);
 function toggle(){const value=!dark;setDark(value);document.documentElement.classList.toggle('dark',value);document.documentElement.classList.toggle('light',!value);localStorage.setItem('toolnexa-theme',value?'dark':'light')}
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
    <p>HD vector and image downloads from Pro, plus higher batch limits. Plans from $3.99/month.</p>
    <Link href="/pricing" className="premium-sidebar-cta">Explore plans <ArrowUpRight size={17}/></Link>
   </div>
  </aside>
  {menuOpen&&<button className="premium-menu-backdrop" aria-label="Close menu overlay" onClick={()=>setMenuOpen(false)} type="button"/>}
  <main id="main-content" className="main premium-main" tabIndex={-1}>
   <header className="top premium-top flagship-top" aria-label="ToolNexa flagship navigation">
    <div className="flagship-nav-brand">
     <button type="button" className="flagship-nav-menu" onClick={()=>setMenuOpen(true)} aria-label="Open full navigation"><Menu size={20}/></button>
     <Link href="/" className="flagship-brand-link"><span className="brand-icon"><Sparkles size={21}/></span><span>ToolNexa <b>AI</b></span></Link>
     <Link className="flagship-proplus-badge" href="/pricing" title="See available subscription plans">PRO+</Link>
    </div>
    <nav className="flagship-nav-links" aria-label="Main product navigation">
     {[{href:'/',name:'Home'},{href:'/studio',name:'AI Studio'},{href:'/tools',name:'60+ Tools'},{href:'/pricing',name:'Pricing'}].map(item=>
      <Link href={item.href} key={item.href} className={path===item.href||(item.href==='/tools'&&path.startsWith('/tools/'))?'active':''}
        aria-current={path===item.href?'page':undefined}>{item.name}</Link>)}
    </nav>
    <div className="flagship-nav-actions">
     <button type="button" className="flagship-search-trigger" onClick={()=>window.dispatchEvent(new Event('toolnexa-open-command'))}
       aria-label="Search all 69 tools"><Search size={18}/><span>Search</span><kbd>⌘K</kbd></button>
     <Link className="flagship-workspace-link" href="/dashboard"><LayoutDashboard size={17}/><span>Workspace</span></Link>
     <button className="flagship-theme-toggle" onClick={toggle} type="button" aria-label={dark?'Switch to light mode':'Switch to dark mode'}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
     <AccountStatus/>
     <Link href="/pricing" className="flagship-gold-cta"><Crown size={17}/> Upgrade <span>Pro+</span></Link>
    </div>
   </header>
   {children}
   <footer className="premium-footer editorial-footer">
    <div className="editorial-footer-main">
     <section className="editorial-footer-about" aria-labelledby="footer-about-title">
      <Link href="/" className="brand premium-brand editorial-footer-brand"><span className="brand-icon"><Sparkles size={23}/></span><span>ToolNexa <em>AI</em></span></Link>
      <h2 id="footer-about-title">ABOUT TOOLNEXA AI</h2>
      <p>All your everyday PDF, image, text, developer, business and creator tools in one smart workspace.</p>
      <p className="editorial-footer-caption">60 practical utility tools. Optional premium batch text analysis.</p>
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
  <FlagshipCommandPalette/>
  <nav className="mobile-nav premium-mobile-nav" aria-label="Bottom navigation">{nav.map(item=><Link href={item.href} key={item.href} className={path===item.href||item.href==='/tools'&&path.startsWith('/tools/')?'active':''} aria-current={path===item.href||item.href==='/tools'&&path.startsWith('/tools/')?'page':undefined}><item.icon size={21}/><span>{item.label}</span></Link>)}</nav>
 </div>;
}
