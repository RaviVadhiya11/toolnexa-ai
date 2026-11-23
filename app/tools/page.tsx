import Link from 'next/link';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'All 60 Free Online Tools',description:'Find free browser-based PDF, image, text, developer and business utilities. Browse all 60 ToolNexa AI tools.',alternates:{canonical:'/tools'}};
import {Suspense} from 'react';
import {ToolList} from '@/components/tool-list';
import {Sparkles,Layers3} from 'lucide-react';
export default function ToolsPage(){return <div className="premium-tools-page">
 <header className="premium-tools-header"><div><span className="premium-tools-eyebrow"><Sparkles size={14}/> 60 FREE ONLINE TOOLS</span><h1>Explore Powerful <span>Smart Tools</span></h1><p>Find the right tool for text, images, PDFs, development and business tasks. Start with 3 shared free runs daily; subscribe for higher limits.</p></div><div className="premium-tools-mark" aria-hidden="true"><Layers3 size={56}/></div></header>
 <section className="panel mt-5" aria-label="New design studio"><strong>NEW: 8 Image &amp; Vector Studio Tools</strong><p>Image-to-Vector, SVG editing, PDF/EPS/DXF conversion, AI background cleanup, retouching, photo restoration and HD export.</p><div className="flex flex-wrap gap-3 mt-3"><Link className="button" href="/studio">Explore 8 Tools</Link><Link className="button outline" href="/studio/image-to-vector">Image to Vector</Link></div></section>
 <Suspense fallback={<div className="panel mt-5">Loading tools…</div>}><ToolList/></Suspense>
 </div>}
