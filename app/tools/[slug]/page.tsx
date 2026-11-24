import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {tools} from '@/lib/tools';
import {ToolRunner} from '@/components/tool-runner';
import {AdvancedToolRunner} from '@/components/advanced-tool-runner';
import {YouTubeThumbnailDownloader} from '@/components/youtube-thumbnail-downloader';
import {SeoJsonLd} from '@/components/seo-json-ld';
import {CANONICAL_SITE_URL} from '@/lib/site-url';
export function generateStaticParams(){return tools.map(t=>({slug:t.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;const tool=tools.find(item=>item.slug===slug);
 if(!tool)return {title:'Tool not found',robots:{index:false,follow:false}};
 const description=`Use ${tool.title} online. ${tool.description}. Preview results on ToolNexa AI; downloads and daily runs depend on your plan.`.slice(0,160);
 const url='/tools/'+tool.slug;
 return {title:`${tool.title} Online`,description,alternates:{canonical:url},openGraph:{title:`${tool.title} Online | ToolNexa AI`,description,url,type:'website'}};
}

export default async function ToolPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const tool=tools.find(t=>t.slug===slug);
 if(!tool)notFound();
 const related=tools.filter(t=>t.category===tool.category&&t.slug!==tool.slug).slice(0,3);
 const path='/tools/'+tool.slug;
 const schema={
  '@context':'https://schema.org',
  '@graph':[
   {'@type':'BreadcrumbList',itemListElement:[
    {'@type':'ListItem',position:1,name:'Home',item:CANONICAL_SITE_URL},
    {'@type':'ListItem',position:2,name:'All Tools',item:CANONICAL_SITE_URL+'/tools'},
    {'@type':'ListItem',position:3,name:tool.title,item:CANONICAL_SITE_URL+path}
   ]},
   {'@type':'WebApplication',name:tool.title,url:CANONICAL_SITE_URL+path,
    description:tool.description,applicationCategory:'UtilitiesApplication',
    operatingSystem:'Web browser',isAccessibleForFree:true}
  ]
 };
 return <div className="tool-detail-page"><SeoJsonLd data={schema}/>
  <nav className="tool-breadcrumb" aria-label="Breadcrumb"><Link href="/tools">All Tools</Link><span>›</span><span>{tool.category}</span><span>›</span><strong>{tool.title}</strong></nav>
  <header className="tool-detail-hero"><div className="tool-detail-hero-icon">{tool.icon}</div><div className="tool-detail-hero-main"><span className="tool-detail-category">{tool.category} TOOL · FREE DAILY ALLOWANCE</span><h1>{tool.title}</h1><p>{tool.description}. Easy to use with a shared daily allowance and optional higher subscriber limits.</p></div></header>
  {slug==='youtube-thumbnail-downloader'?<YouTubeThumbnailDownloader/>:tools.findIndex(t=>t.slug===slug)<20?<ToolRunner key={slug} tool={tool}/>:<AdvancedToolRunner key={slug} tool={tool}/>}
  <section className="tool-detail-info">
   <h2>How to use this tool</h2>
   {slug==='youtube-thumbnail-downloader'?<div className="tool-info-steps">
    <div><span>01</span><strong>Paste a YouTube link</strong><p>The tool automatically detects video, Shorts, live or youtu.be links.</p></div>
    <div><span>02</span><strong>Preview every available size</strong><p>Only real thumbnails are displayed; missing maximum-resolution images are omitted.</p></div>
    <div><span>03</span><strong>Choose quality &amp; download</strong><p>Preview freely, then download the selected original JPG with a verified subscription.</p></div>
   </div>:<>
   <div className="tool-info-steps">
    <div><span>01</span><strong>Enter your input</strong><p>Paste text, set the options or select local files as needed.</p></div>
    <div><span>02</span><strong>Run the tool</strong><p>Review the input and start processing with one click.</p></div>
    <div><span>03</span><strong>Save your result</strong><p>Copy a text result or download the generated file when available.</p></div>
   </div>
   </>}
   <p className="small-note mt-4">Most tools process inputs in your browser. Some advanced tools use open public thumbnail images or optional configured third-party services. Browser capabilities and file formats may limit processing. PDF compressor performs structural optimization rather than image downsampling; background color removal works best on solid backgrounds. The AI title tool supports optional Gemini-generated suggestions and offline alternatives; only Gemini Mode sends the topic to Google. Existing PDF tools cannot open password-protected files.</p>
  </section>
  {related.length>0&&<section className="tool-related"><div className="tool-section-heading"><h2>More {tool.category.toLowerCase()} tools</h2><Link href={'/tools?category='+tool.category}>View category →</Link></div><div className="tool-related-grid">{related.map(t=><Link href={'/tools/'+t.slug} key={t.slug} className="tool-related-card"><span>{t.icon}</span><strong>{t.title}</strong><small>{t.description}</small></Link>)}</div></section>}
 </div>;
}
