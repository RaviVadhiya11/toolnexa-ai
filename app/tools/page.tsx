import Link from 'next/link';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'All 60 Free Online Tools',description:'Find free browser-based PDF, image, text, developer and business utilities. Browse all 60 ToolNexa AI tools.',alternates:{canonical:'/tools'}};
import {Suspense} from 'react';
import {ToolList} from '@/components/tool-list';
import {Sparkles,Layers3} from 'lucide-react';
export default function ToolsPage(){return <div className="premium-tools-page">
 <header className="premium-tools-header"><div><span className="premium-tools-eyebrow"><Sparkles size={14}/> 60 ONLINE UTILITIES · NEON GLASS 3D</span><h1>Discover <span>60 Powerful Tools</span></h1><p>Find the right tool for text, images, PDFs, development and business tasks. Start with 3 shared free runs daily; subscribe for higher limits.</p></div><div className="premium-tools-mark" aria-hidden="true"><Layers3 size={56}/></div></header>
 <section className="tools-studio-spotlight" aria-labelledby="tools-studio-spotlight-title">
  <div className="tools-studio-spotlight-top">
   <span className="tools-studio-spotlight-kicker"><Sparkles size={15} aria-hidden="true"/> CREATOR WORKSPACES</span>
   <span className="tools-studio-spotlight-count">12 Studios</span>
  </div>
  <div className="tools-studio-spotlight-content">
   <h2 id="tools-studio-spotlight-title">Create more with <span>ToolNexa Studio</span></h2>
   <p>Enhance images, make vectors, resize passport photos, create invoices and ZIP files—all in one workspace.</p>
  </div>
  <div className="tools-studio-spotlight-tags" aria-label="Featured Studio capabilities">
   <span>✦ Image &amp; Vector</span><span>✦ Passport &amp; Social</span><span>✦ ZIP &amp; PDF</span>
  </div>
  <div className="tools-studio-spotlight-actions">
   <Link className="tools-studio-primary" href="/studio">Explore All Studios <Sparkles size={17} aria-hidden="true"/></Link>
   <nav className="tools-studio-shortcuts" aria-label="Popular Studio tools">
    <Link href="/studio/image-to-vector">Image to Vector <span aria-hidden="true">↗</span></Link>
    <Link href="/studio/passport-social">Passport Photos <span aria-hidden="true">↗</span></Link>
    <Link href="/studio/bill-maker">Bill &amp; Invoice <span aria-hidden="true">↗</span></Link>
    <Link href="/studio/zip-maker">ZIP Maker <span aria-hidden="true">↗</span></Link>
   </nav>
  </div>
 </section>
 <Suspense fallback={<div className="panel mt-5">Loading tools…</div>}><ToolList/></Suspense>
 </div>}
