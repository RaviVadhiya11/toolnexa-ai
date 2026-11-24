'use client';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {FlagshipCommandPalette} from '@/components/flagship-command-palette';
import {useEffect,useRef,useState} from 'react';
import {AccountStatus} from '@/components/account-status';
import {tools} from '@/lib/tools';
import {ShieldCheck,Home,LayoutGrid,LayoutDashboard,Crown,Moon,Sun,Search,FileText,Image as ImageIcon,Code2,Briefcase,Type,Menu,X,Sparkles,ArrowUpRight,LifeBuoy,CreditCard,Clapperboard} from 'lucide-react';
const nav=[{href:'/',label:'Home',icon:Home},{href:'/tools',label:'All Tools',icon:LayoutGrid},{href:'/studio',label:'Creator Studio',icon:Sparkles},{href:'/dashboard',label:'Dashboard',icon:LayoutDashboard},{href:'/pricing',label:'Pricing',icon:Crown},{href:'/admin',label:'Admin',icon:ShieldCheck}];
const mobileNav=[{href:'/',label:'Home',icon:Home},{href:'/tools',label:'Tools',icon:LayoutGrid},{href:'/studio',label:'Studio',icon:Sparkles},{href:'/dashboard',label:'Dashboard',icon:LayoutDashboard},{href:'/pricing',label:'Plans',icon:Crown}];
const groups=[{name:'Text',icon:Type},{name:'Image',icon:ImageIcon},{name:'PDF',icon:FileText},{name:'Developer',icon:Code2},{name:'Business',icon:Briefcase},{name:'Creator',icon:Clapperboard}] as const;
export function Shell({children}:{children:React.ReactNode}){
 const path=usePathname(),router=useRouter();
 const isPassportEditor=path==='/studio/passport-social';
 const [dark,setDark]=useState(true),[menuOpen,setMenuOpen]=useState(false);
 const [drawerSearch,setDrawerSearch]=useState('');
 const drawerClose=useRef<HTMLButtonElement|null>(null);
 useEffect(()=>{
  const useDark=localStorage.getItem('toolnexa-theme')!=='light';
  setDark(useDark);
  document.documentElement.classList.toggle('dark',useDark);
  document.documentElement.classList.toggle('light',!useDark);
 },[]);
 useEffect(()=>{setMenuOpen(false)},[path]);
 useEffect(()=>{
  if(!menuOpen)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const originalOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  drawerClose.current?.focus();
  const dismiss=(event:KeyboardEvent)=>{if(event.key==='Escape')setMenuOpen(false)};
  window.addEventListener('keydown',dismiss);
  return()=>{
   window.removeEventListener('keydown',dismiss);
   document.body.style.overflow=originalOverflow;
   previous?.focus();
  };
 },[menuOpen]);
 function findTools(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  router.push('/tools?q='+encodeURIComponent(drawerSearch.trim()));
  setMenuOpen(false);
 }
 function toggle(){const value=!dark;setDark(value);document.documentElement.classList.toggle('dark',value);document.documentElement.classList.toggle('light',!value);localStorage.setItem('toolnexa-theme',value?'dark':'light')}
 return <div className={"shell premium-shell "+(menuOpen?"has-open-drawer":"")}>
  <a className="site-skip-link" href="#main-content">Skip to main content</a>
  <aside id="flagship-workspace-drawer" className={'sidebar premium-sidebar flagship-workspace-drawer '+(menuOpen?'sidebar-open':'')}
   aria-label="Classic workspace navigation and tool categories" aria-hidden={!menuOpen}>
   <div className="premium-sidebar-head">
    <Link href="/" className="brand premium-brand"><span className="brand-icon"><Sparkles size={22}/></span><span>ToolNexa <em>AI</em></span></Link>
    <button ref={drawerClose} type="button" className="mobile-sidebar-close" aria-label="Close workspace menu" onClick={()=>setMenuOpen(false)}><X size={20}/></button>
   </div>
   <p className="premium-sidebar-label">WORKSPACE · CLASSIC NAVIGATION</p>
   <form className="flagship-drawer-search" role="search" onSubmit={findTools}>
    <label htmlFor="flagship-drawer-query">Find a tool</label>
    <div><input id="flagship-drawer-query" className="search" type="search" value={drawerSearch}
      onChange={event=>setDrawerSearch(event.target.value)}
      placeholder="Search PDF, Image, JSON…" aria-label="Find a utility tool by name"/>
     <button type="submit" aria-label="Search all utility tools"><Search size={19}/></button></div>
   </form>
   <nav aria-label="Main pages">{nav.map(item=><Link key={item.href} className={'nav '+(path===item.href||item.href==='/tools'&&path.startsWith('/tools/')?'active':'')} href={item.href} aria-current={path===item.href||item.href==='/tools'&&path.startsWith('/tools/')?'page':undefined}>
    <item.icon size={19}/><span>{item.label}</span>{item.href==='/tools'&&<small>{tools.length}</small>}
   </Link>)}</nav>
   <p className="premium-sidebar-label premium-sidebar-categories">TOOL CATEGORIES</p>
   <nav aria-label="Tool categories">{groups.map(group=><Link className="nav premium-category-link" href={'/tools?category='+group.name} key={group.name}>
    <group.icon size={18}/><span>{group.name} Tools</span><small>{tools.filter(tool=>tool.category===group.name).length}</small>
   </Link>)}</nav>
   <div className="flagship-drawer-shortcuts" aria-label="Popular creative workflows">
    <p className="premium-sidebar-label">QUICK CREATOR ACCESS</p>
    <Link href="/studio/enhance"><Sparkles size={18}/> Enhance &amp; Upscale</Link>
    <Link href="/studio/background-remove"><ImageIcon size={18}/> Remove Background</Link>
    <Link href="/studio/image-to-vector"><LayoutGrid size={18}/> Image to Vector</Link>
    <Link href="/studio/batch"><Crown size={18}/> Batch Pro+ ZIP</Link>
    <Link href="/studio/passport-social"><ImageIcon size={18}/> Passport &amp; Social Sizes</Link>
   </div>
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
     <button type="button" className="flagship-nav-menu" aria-expanded={menuOpen}
      aria-controls="flagship-workspace-drawer" onClick={()=>setMenuOpen(v=>!v)}
      aria-label={menuOpen?'Close classic workspace navigation':'Open classic workspace navigation'}><Menu size={20}/></button>
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
     <Link href="/pricing" className="flagship-gold-cta" aria-label="Upgrade to ToolNexa Pro+ subscription plans">
      <Crown size={17}/><span className="flagship-upgrade-label">Upgrade</span><span className="flagship-upgrade-tier">Pro+</span>
     </Link>
    </div>
   </header>
   {children}
   {!isPassportEditor&&<footer className="premium-footer editorial-footer">
    <div className="editorial-footer-main">
     <section className="editorial-footer-about" aria-labelledby="footer-about-title">
      <Link href="/" className="brand premium-brand editorial-footer-brand"><span className="brand-icon"><Sparkles size={23}/></span><span>ToolNexa <em>AI</em></span></Link>
      <h2 id="footer-about-title">ABOUT TOOLNEXA AI</h2>
      <p>All your everyday PDF, image, text, developer, business and creator tools in one smart workspace.</p>
      <p className="editorial-footer-caption">60 practical utility tools. Optional premium batch text analysis.</p>
      <Link href="/support" className="editorial-footer-contact"><span className="editorial-footer-contact-icon"><Briefcase size={17}/></span>Report a technical issue <ArrowUpRight size={17}/></Link>
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
       <Link href="/support" className="editorial-contact-button"><Briefcase size={17}/> Report an Issue <ArrowUpRight size={15}/></Link>
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
   </footer>}
  </main>
  <FlagshipCommandPalette/>
  <nav className="mobile-nav premium-mobile-nav" aria-label="Mobile quick navigation">
   {mobileNav.map(item=>{
    const active=path===item.href||
      (item.href==='/tools'&&path.startsWith('/tools/'))||
      (item.href==='/studio'&&path.startsWith('/studio/'));
    return <Link href={item.href} key={item.href} className={active?'active':''}
      aria-current={active?'page':undefined}><item.icon size={20}/><span>{item.label}</span></Link>;
   })}
  </nav>
 </div>;
}
