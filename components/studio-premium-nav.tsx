'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
const tools=[
 {path:'/studio/vector',name:'Logo Studio',icon:'✦'},
 {path:'/studio/image-to-vector',name:'Vectorize',icon:'◇'},
 {path:'/studio/convert',name:'Convert',icon:'⇄'},
 {path:'/studio/svg-editor',name:'SVG Editor',icon:'⌘'},
 {path:'/studio/enhance',name:'Enhance',icon:'✺'},
 {path:'/studio/background-remove',name:'Remove BG',icon:'▣'},
 {path:'/studio/retouch',name:'Retouch',icon:'◉'},
 {path:'/studio/restore',name:'Restore',icon:'☀'},
 {path:'/studio/batch',name:'Batch Pro+',icon:'⚡'},
 {path:'/studio/passport-social',name:'Passport / Social',icon:'▧'}
] as const;
export function StudioTopbar(){
 const pathname=usePathname();
 // The uploaded Passport editor has its own mode navigation; prevent a second
 // sticky toolbar from covering its mobile controls.
 if(pathname==='/studio/passport-social')return null;
 return <nav className="studio-premium-nav" aria-label="Creator Studio tools">
  <div className="studio-premium-brand">
   <Link href="/studio"><span className="studio-premium-brand-icon">✦</span>
    <span>ToolNexa <strong>CREATOR STUDIO</strong></span></Link>
   <span className="studio-premium-version">V4</span>
  </div>
  <div className="studio-premium-nav-links">
   {tools.map(tool=><Link href={tool.path} key={tool.path}
    aria-current={pathname===tool.path?'page':undefined}
    className={pathname===tool.path?'selected':''}>
    <span aria-hidden="true">{tool.icon}</span>{tool.name}
   </Link>)}
  </div>
  <Link className="studio-premium-nav-plan" href="/pricing">✧ Plans</Link>
 </nav>;
}
