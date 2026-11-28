import Link from 'next/link';
import {toolSeo} from '@/lib/tool-seo-data';
import {SeoJsonLd} from '@/components/seo-json-ld';
import {CANONICAL_SITE_URL} from '@/lib/site-url';
export function ToolSearchGuide({seoKey,studio=false}:{seoKey:string;studio?:boolean}){
 const seo=toolSeo[seoKey];if(!seo)return null;
 const path=seoKey.startsWith('studio/')?'/'+seoKey:'/tools/'+seoKey;
 const related=seo.related.filter(key=>!!toolSeo[key]);
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:CANONICAL_SITE_URL},{'@type':'ListItem',position:2,name:'Studio',item:CANONICAL_SITE_URL+'/studio'},{'@type':'ListItem',position:3,name:seo.title,item:CANONICAL_SITE_URL+path}]},
  {'@type':'WebApplication',name:seo.title,url:CANONICAL_SITE_URL+path,description:seo.description,applicationCategory:'UtilitiesApplication',operatingSystem:'Web browser'}
 ]};
 return <section className="tool-detail-info tool-search-guide" aria-label="Tool guide">
 {studio&&<SeoJsonLd data={schema}/>}
 <h2>About {seo.title.split(' – ')[0]}</h2><p>{seo.description}</p>
 <h3 className="mt-4 font-semibold">Tips for better results</h3><p>{seo.guide}</p>
 <p className="small-note mt-4">Preview and usage depend on the tool. File downloads require an eligible active subscription; see <Link href="/pricing">plans and daily allowances</Link> for details.</p>
 {related.length>0&&<><h3 className="mt-4 font-semibold">Related tools</h3><div className="tool-related-grid">{related.map(key=><Link key={key} className="tool-related-card" href={key.startsWith('studio/')?'/'+key:'/tools/'+key}><strong>{toolSeo[key].title.split(' – ')[0]}</strong></Link>)}</div></>}
 </section>
}
