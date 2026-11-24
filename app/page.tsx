import Link from 'next/link';
import {Suspense} from 'react';
import {ToolList} from '@/components/tool-list';
import {ArrowRight,Sparkles,ShieldCheck,Zap,Layers3,FileText,Image as ImageIcon,Code2} from 'lucide-react';
export default function Home(){return <div className="premium-home">
 <section className="premium-home-hero">
  <div className="premium-home-hero-copy">
   <span className="premium-home-pill"><Sparkles size={15}/> 60 FREE ONLINE TOOLS</span>
   <h1>Explore Powerful <span>Smart Tools</span></h1>
   <p>Everything you need for PDF, images, social media, text, development and everyday business tasks. All in one beautifully simple workspace.</p>
   <div className="premium-home-hero-actions"><Link href="/tools" className="button">Explore all tools <ArrowRight size={17}/></Link><Link href="/pricing" className="button outline">Compare plans</Link></div>
   <div className="premium-home-points"><span><ShieldCheck size={16}/> Browser-first tools</span><span><Zap size={16}/> Quick workflows</span><span><Layers3 size={16}/> 6 categories</span></div>
  </div>
  <div className="premium-home-hero-art" aria-hidden="true"><div className="premium-orbit orbit-one"/><div className="premium-orbit orbit-two"/><div className="premium-floating-tile tile-main"><Layers3 size={69}/></div><div className="premium-floating-tile tile-left"><FileText size={30}/></div><div className="premium-floating-tile tile-right"><ImageIcon size={30}/></div><div className="premium-floating-tile tile-bottom"><Code2 size={30}/></div></div>
 </section>
 <div className="stats premium-stats"><div className="stat"><strong>60</strong><span className="muted text-sm">Free utilities</span></div><div className="stat"><strong>6</strong><span className="muted text-sm">Tool categories</span></div><div className="stat"><strong>Free</strong><span className="muted text-sm">Browser-based tools</span></div></div>
 <div className="section-head premium-section-head"><div><p className="premium-section-kicker">YOUR PRODUCTIVITY TOOLKIT</p><h2>Featured tools</h2></div><Link href="/tools" className="premium-view-all">Browse all <ArrowRight size={16}/></Link></div>
 <Suspense fallback={<div className="panel">Loading tools…</div>}><ToolList compact/></Suspense>
 <section className="premium-home-trust"><div className="premium-trust-icon"><ShieldCheck size={26}/></div><div><h2>Built for practical workflows</h2><p>These 60 tools primarily process files and text locally in your browser. Free users receive 3 shared daily runs; verified subscribers automatically receive larger daily allowances and higher Batch Text Analyzer limits.</p></div><Link href="/pricing">View premium plans <ArrowRight size={16}/></Link></section>
 </div>}
