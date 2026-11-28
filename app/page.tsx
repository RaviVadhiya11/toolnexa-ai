import Link from 'next/link';
import type {Metadata} from 'next';

export const metadata:Metadata={alternates:{canonical:'/'},description:'Online PDF tools, image converters, GST invoice maker, background remover and more. Explore ToolNexa AI tools with browser previews and eligible paid exports.'};
import {Suspense} from 'react';
import {ToolList} from '@/components/tool-list';
import {FlagshipHomeExperience} from '@/components/flagship-home-experience';
import {NeonGlassHeroArt} from '@/components/neon-glass-hero-art';
import {subscriptionPrices} from '@/lib/subscription-pricing';
import {ArrowRight,Sparkles,ShieldCheck,Zap,Layers3,FileText,Image as ImageIcon,Code2,Check,ChevronRight,Crown,Lock,PenTool,Scissors,WandSparkles,Workflow,Palette,SlidersHorizontal,ScanText,FileArchive} from 'lucide-react';

const studioItems=[
 {href:'/studio/bill-maker',title:'Bill & Invoice Maker Studio',desc:'Professional GST invoices, business logo, signature, A4 preview and PDF export',tag:'NEW · Billing',icon:FileText},
 {href:'/studio/enhance',title:'AI Photo Enhancer & Upscale',desc:'Local tone, neural 2× detail option and up to 8K export',tag:'8K · Premium+',icon:WandSparkles},
 {href:'/studio/image-to-vector',title:'Image to Real SVG Vector',desc:'Trace raster artwork into editable SVG paths',tag:'Real SVG',icon:PenTool},
 {href:'/studio/background-remove',title:'Background Remover',desc:'AI cutout or precise solid-color cleanup',tag:'AI / Local',icon:Scissors},
 {href:'/studio/vector',title:'Logo & Vector Studio',desc:'Design editable vector logos and marks',tag:'SVG Studio',icon:Palette},
 {href:'/studio/convert',title:'Vector Format Converter',desc:'SVG, vector PDF, EPS and DXF outline exports',tag:'4 formats',icon:Workflow},
 {href:'/studio/svg-editor',title:'SVG Shape & Color Editor',desc:'Edit SVG colors, geometry and paths',tag:'Editable',icon:SlidersHorizontal},
 {href:'/studio/retouch',title:'Object Remover & Retouch',desc:'Paint over small unwanted marks and heal',tag:'Local retouch',icon:ScanText},
 {href:'/studio/restore',title:'Photo Restore & Colorizer',desc:'Sharpen, denoise and regrade older photos',tag:'Photo tools',icon:ImageIcon},
 {href:'/studio/batch',title:'Batch Pro+ ZIP Engine',desc:'Premium/Max sequential image jobs and one ZIP export',tag:'Premium / Max',icon:Layers3},
 {href:'/studio/passport-social',title:'AI Passport & Social Size Studio',desc:'Passport/ID and social presets, local cutout, real print sheets and Pro photo exports',tag:'Pro Print',icon:ImageIcon},
 {href:'/studio/zip-maker',title:'Advanced ZIP Maker Studio',desc:'Build ZIP archives with local compression, folder support and plan-based limits up to 1 GB',tag:'ZIP · 1 GB Max',icon:FileArchive}
] as const;
const pricing=[
 {name:'Free',price:'0',detail:'3 shared tool runs per day',features:['All 60 utilities','Studio previews','No paid export access'],href:'/tools'},
 {name:'Starter',price:subscriptionPrices.Starter.monthly,detail:'500 shared tool runs per day',features:['60 utilities + Studio previews','Up to 2× paid image export','Monthly subscription'],href:'/pricing?plan=Starter'},
 {name:'Pro',price:subscriptionPrices.Pro.monthly,detail:'1,000 shared tool runs per day',features:['4× HD and 4K image export','Pro HD backgrounds and vectors','Monthly subscription'],href:'/pricing?plan=Pro'},
 {name:'Premium',price:subscriptionPrices.Premium.monthly,detail:'1,500 shared tool runs per day',features:['Up to 8K eligible export','Premium Studio tools','Monthly subscription'],href:'/pricing?plan=Premium'},
 {name:'Max',price:subscriptionPrices.Max.monthly,detail:'3,000 shared tool runs per day',features:['Up to 8K eligible export','Highest daily usage allowance','Monthly subscription'],href:'/pricing?plan=Max'}
] as const;
export default function Home(){return <div className="premium-home flagship-home">
 <section className="flagship-hero premium-home-hero">
  <div className="flagship-hero-copy">
   <span className="flagship-hero-eyebrow"><span/> <Crown size={15}/> ALL-IN-ONE TOOLS · NEON GLASS 3D</span>
   <h1>60+ AI &amp; Utility Tools <span>for Creators, Students &amp; Professionals.</span></h1>
   <p>Edit, convert, compress and create with 60 practical utility tools and 12 Creator Studio workspaces—all in one responsive platform.</p>
   <div className="flagship-hero-actions">
    <Link className="button" href="/tools"><Layers3 size={18}/> Explore All Tools <ArrowRight size={16}/></Link>
    <Link className="button outline" href="/studio"><Sparkles size={17}/> Open AI Studio</Link>
   </div>
   <FlagshipHomeExperience mode="upload"/>
   <div className="flagship-hero-points"><span><ShieldCheck size={16}/> Browser-first processing</span>
    <span><Zap size={16}/> Real working editors</span><span><Lock size={16}/> Secure paid downloads</span></div>
  </div>
  <NeonGlassHeroArt/>
 </section>
 <nav className="flagship-classic-shortcuts" aria-label="Quick access to the original tool categories and editors">
  <span>QUICK ACCESS</span>
  <Link href="/studio/bill-maker"><FileText size={16}/> Bill &amp; Invoice Maker</Link>
  <Link href="/studio/zip-maker"><FileArchive size={16}/> ZIP Maker</Link>
  <Link href="/studio/enhance"><Sparkles size={16}/> Enhance Image</Link>
  <Link href="/studio/passport-social"><ImageIcon size={16}/> Passport / Social</Link>
  <Link href="/studio/background-remove"><ImageIcon size={16}/> Remove BG</Link>
  <Link href="/studio/image-to-vector"><PenTool size={16}/> Image to SVG</Link>
  <Link href="/tools?category=PDF"><FileText size={16}/> PDF Tools</Link>
  <Link href="/tools?category=Developer"><Code2 size={16}/> Developer Tools</Link>
  <Link href="/dashboard"><Crown size={16}/> My Workspace</Link>
 </nav>
 <section className="flagship-metrics" aria-label="ToolNexa product features">
  <div><strong>60 + 12</strong><span>Utilities + Studio workspaces</span></div>
  <div><strong>Up to 8K</strong><span>Plan-gated export resolution</span></div>
  <div><strong>3 / day</strong><span>Shared Free tool runs</span></div>
  <div><strong>PayPal</strong><span>Verified subscription checkout</span></div>
 </section>
 <section className="ng-compare-section" aria-labelledby="ng-compare-title">
  <div className="ng-compare-copy">
   <span className="flagship-kicker">TRY THE INTERACTIVE EDITOR</span>
   <h2 id="ng-compare-title">See the difference before exporting</h2>
   <p>Drag the comparison slider to preview a local filter example, then open the editor to work with your photo. This is illustrative, not a promised AI-generated result.</p>
   <Link className="ng-compare-link" href="/studio/enhance">Open Photo Enhancer <ArrowRight size={16}/></Link>
  </div><FlagshipHomeExperience mode="compare"/>
 </section>
 <section className="flagship-section" aria-labelledby="flagship-studio-title">
  <div className="flagship-section-head"><div><span className="flagship-kicker gold">CREATOR STUDIO</span>
    <h2 id="flagship-studio-title">12 premium-style Creator Studio workspaces</h2>
    <p>Open a real editor, not a simulated demo screen. See original and processed results in the same stage.</p></div>
   <Link href="/studio">All Studio tools <ArrowRight size={16}/></Link></div>
  <div className="flagship-studio-bento">
   {studioItems.map((item,i)=><Link key={item.href} href={item.href}
     className={'flagship-bento-card '+(i<2?'featured':'')}>
    <div className="flagship-bento-top"><span className="flagship-bento-icon"><item.icon size={i<2?29:23}/></span>
     <span className={'flagship-bento-tag '+(i===0?'gold':'')}>{item.tag}</span></div>
    <div><h3>{item.title}</h3><p>{item.desc}</p><span className="flagship-bento-link">Open workspace <ArrowRight size={15}/></span></div>
   </Link>)}
  </div>
 </section>
 <section className="flagship-section flagship-utils-section">
  <div className="flagship-section-head"><div><span className="flagship-kicker">ALL YOUR DAILY TOOLS</span>
   <h2>Find and run 60 smart utilities</h2><p>PDF, images, developers, text, business and creator workflows with shared usage limits.</p></div>
   <Link href="/tools">Browse full directory <ArrowRight size={16}/></Link></div>
  <div className="flagship-utilities">
   <Suspense fallback={<div className="panel">Loading tools…</div>}><ToolList compact/></Suspense>
  </div>
 </section>
 <section className="flagship-section" aria-labelledby="popular-online-tools"><div className="flagship-section-head"><div><h2 id="popular-online-tools">Popular online tools for everyday work</h2><p>Open a tool directly to edit documents, resize photos or make a business invoice.</p></div><Link href="/tools">All tools <ArrowRight size={16}/></Link></div><div className="tool-related-grid">{[{href:'/tools/invoice-generator',title:'GST Invoice & Bill Maker'},{href:'/tools/merge-pdf',title:'Merge PDF Files'},{href:'/tools/image-to-pdf',title:'Image to PDF Converter'},{href:'/tools/image-resizer',title:'Online Image Resizer'},{href:'/tools/gst-calculator',title:'GST Calculator India'},{href:'/tools/youtube-thumbnail-downloader',title:'YouTube Thumbnail Downloader'}].map(t=><Link className="tool-related-card" key={t.href} href={t.href}><strong>{t.title}</strong></Link>)}</div></section>
 <section className="flagship-section flagship-compare-section" aria-labelledby="flagship-compare-title">
  <div className="flagship-section-head"><div><span className="flagship-kicker">ONE WORKSPACE, LESS TAB SWITCHING</span>
   <h2 id="flagship-compare-title">Bring your creative toolkit together</h2>
   <p>One interface for essential workflows. Capabilities and plan requirements are shown without exaggerated savings claims.</p></div></div>
  <div className="flagship-compare-table-wrap"><table><thead><tr><th>Workflow</th><th>ToolNexa AI feature</th><th>Access</th></tr></thead>
   <tbody>
    <tr><td>Image enhancement</td><td>Before/after editor, real local filters, optional neural detail</td><td>Preview with daily allowance</td></tr>
    <tr><td>High-resolution exports</td><td>2×, 4×, 4K and 8K where device resources allow</td><td>Starter / Pro / Premium+</td></tr>
    <tr><td>Vector graphics</td><td>Editable SVG, EPS, vector PDF and DXF outline conversion</td><td>Standard tools / paid HD options</td></tr>
    <tr><td>PDF and daily tools</td><td>60 browser-first utility workflows</td><td>3 Free runs daily; more on paid plans</td></tr>
   </tbody></table></div>
 </section>
 <section className="flagship-section" id="flagship-plans">
  <div className="flagship-section-head"><div><span className="flagship-kicker gold">FLEXIBLE SUBSCRIPTIONS</span>
   <h2>Clear plans, real access</h2><p>Actual USD PayPal recurring plan prices. Choose monthly or yearly billing on the pricing page.</p></div>
   <Link href="/pricing">See all billing options <ArrowRight size={16}/></Link></div>
  <div className="flagship-plan-grid">
   {pricing.map(p=><div className={'flagship-plan-card '+(p.name==='Pro'?'popular':'')} key={p.name}>
    <div className="flagship-plan-head"><strong>{p.name}</strong>{p.name==='Pro'&&<span>POPULAR</span>}{p.name==='Max'&&<span>HIGHEST LIMIT</span>}</div>
    <p className="flagship-plan-price">${p.price}<small>/mo</small></p><p className="flagship-plan-sub">{p.detail}</p>
    <ul>{p.features.map(f=><li key={f}><Check size={14}/>{f}</li>)}</ul>
    <Link href={p.href} className={p.name==='Max'?'flagship-plan-cta gold':'flagship-plan-cta'}>
     {p.name==='Free'?'Explore Free Tools':'View '+p.name+' Plan'} <ChevronRight size={16}/></Link>
   </div>)}
  </div>
 </section>
 <section className="premium-home-trust flagship-trust"><div className="premium-trust-icon"><ShieldCheck size={26}/></div>
  <div><h2>Creative features with transparent limits</h2><p>Images and most documents are processed locally where the tool permits. AI Detail uses a limited on-device model; 8K output enlarges pixels and cannot guarantee reconstruction of missing details. Premium download access is checked on the server with an active PayPal subscription.</p></div>
  <Link href="/studio/enhance">Explore Studio <ArrowRight size={16}/></Link></section>
 </div>;}
