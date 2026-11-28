import type {Metadata} from 'next';
import {toolSeo} from '@/lib/tool-seo-data';
import {CANONICAL_SITE_URL} from '@/lib/site-url';
export function toolMetadata(key:string,path:string):Metadata{
 const seo=toolSeo[key];if(!seo)throw Error('Missing SEO for '+key);
 const title=seo.title,description=seo.description,url=CANONICAL_SITE_URL+path;
 return {title,description,alternates:{canonical:path},openGraph:{title:title+' | ToolNexa AI',description,url,type:'website',siteName:'ToolNexa AI'},twitter:{card:'summary',title:title+' | ToolNexa AI',description}};
}
