import Link from 'next/link';
import {notFound} from 'next/navigation';
import {tools} from '@/lib/tools';
import {ToolRunner} from '@/components/tool-runner';
export function generateStaticParams(){return tools.map(t=>({slug:t.slug}))}
export default async function ToolPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const tool=tools.find(t=>t.slug===slug);
 if(!tool)notFound();
 const related=tools.filter(t=>t.category===tool.category&&t.slug!==tool.slug).slice(0,3);
 return <div className="tool-detail-page">
  <nav className="tool-breadcrumb" aria-label="Breadcrumb"><Link href="/tools">All Tools</Link><span>›</span><span>{tool.category}</span><span>›</span><strong>{tool.title}</strong></nav>
  <header className="tool-detail-hero"><div className="tool-detail-hero-icon">{tool.icon}</div><div className="tool-detail-hero-main"><span className="tool-detail-category">{tool.category} TOOL · FREE TO USE</span><h1>{tool.title}</h1><p>{tool.description}. Easy to use, with browser-based processing and quick results.</p></div></header>
  <ToolRunner key={slug} tool={tool}/>
  <section className="tool-detail-info">
   <h2>How to use this tool</h2>
   <div className="tool-info-steps">
    <div><span>01</span><strong>Enter your input</strong><p>Paste text, set the options or select local files as needed.</p></div>
    <div><span>02</span><strong>Run the tool</strong><p>Review the input and start processing with one click.</p></div>
    <div><span>03</span><strong>Save your result</strong><p>Copy a text result or download the generated file when available.</p></div>
   </div>
   <p className="small-note mt-4">Tools run in your browser. Browser capabilities and file formats may limit processing. The Text to PDF starter tool replaces unsupported non-Latin characters.</p>
  </section>
  {related.length>0&&<section className="tool-related"><div className="tool-section-heading"><h2>More {tool.category.toLowerCase()} tools</h2><Link href={'/tools?category='+tool.category}>View category →</Link></div><div className="tool-related-grid">{related.map(t=><Link href={'/tools/'+t.slug} key={t.slug} className="tool-related-card"><span>{t.icon}</span><strong>{t.title}</strong><small>{t.description}</small></Link>)}</div></section>}
 </div>;
}
