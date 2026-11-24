import type {MetadataRoute} from 'next';
import {tools} from '@/lib/tools';
import {CANONICAL_SITE_URL} from '@/lib/site-url';

const site=CANONICAL_SITE_URL;

export default function sitemap():MetadataRoute.Sitemap {
 if(process.env.SITE_PUBLIC_LAUNCH_ENABLED!=='true')return [];
 const publicPages=['','/tools','/pricing','/privacy','/terms','/billing','/support'];
 const pages=publicPages.map(path=>({
  url:site+path,changeFrequency:'weekly' as const,priority:path===''?1:path==='/tools'?.9:.7
 }));
 const toolPages=tools.map(tool=>({
  url:site+'/tools/'+tool.slug,
  changeFrequency:'monthly' as const,
  priority:.7
 }));
 return [...pages,...toolPages];
}
