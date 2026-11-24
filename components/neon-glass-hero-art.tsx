import Link from 'next/link';
import {ArrowUpRight,FileArchive,FileText,Image as ImageIcon,Sparkles,WandSparkles,ShieldCheck} from 'lucide-react';

/* CSS-built 3D glass artwork: no remote images, accounts or fake usage metrics. */
const tiles=[
 {href:'/studio/enhance',name:'AI Enhance',icon:WandSparkles,tone:'violet'},
 {href:'/studio/zip-maker',name:'ZIP Maker',icon:FileArchive,tone:'cyan'},
 {href:'/studio/passport-social',name:'Photo Studio',icon:ImageIcon,tone:'pink'},
 {href:'/tools?category=PDF',name:'PDF Tools',icon:FileText,tone:'red'}
] as const;

export function NeonGlassHeroArt(){
 return <div className="ng-hero-art" aria-label="Interactive 3D-inspired links to ToolNexa AI tools">
  <div className="ng-hero-orbit ng-orbit-one" aria-hidden="true"/>
  <div className="ng-hero-orbit ng-orbit-two" aria-hidden="true"/>
  <div className="ng-hero-glow" aria-hidden="true"/>
  <div className="ng-device ng-glass-panel">
   <div className="ng-device-top"><span className="ng-device-dots"><i/><i/><i/></span><span className="ng-device-url"><ShieldCheck size={12}/> toolnexa.ai</span><span className="ng-device-spark"><Sparkles size={15}/></span></div>
   <div className="ng-device-content">
    <span className="ng-device-kicker">YOUR CREATIVE WORKSPACE</span>
    <span className="ng-device-wordmark"><span className="ng-device-logo"><Sparkles size={25}/></span> ToolNexa <em>AI</em></span>
    <span className="ng-device-sub">Create · Convert · Enhance · Export</span>
    <div className="ng-device-grid">
     {tiles.map(t=><Link href={t.href} key={t.name} className={'ng-device-tile tone-'+t.tone}
       aria-label={'Open '+t.name}>
      <t.icon size={23} strokeWidth={1.9}/><span>{t.name}</span>
     </Link>)}
    </div>
    <Link className="ng-device-link" href="/studio">Explore Creator Studio <ArrowUpRight size={15}/></Link>
   </div>
  </div>
  <Link href="/studio/enhance" className="ng-float-cube ng-cube-one" aria-label="Open AI enhancer"><WandSparkles size={25}/><span>AI</span></Link>
  <Link href="/studio/zip-maker" className="ng-float-cube ng-cube-two" aria-label="Open ZIP Maker"><FileArchive size={26}/><span>ZIP</span></Link>
  <Link href="/studio/passport-social" className="ng-float-cube ng-cube-three" aria-label="Open Passport Photo Studio"><ImageIcon size={25}/><span>PHOTO</span></Link>
  <span className="ng-hero-floor" aria-hidden="true"/>
 </div>;
}
