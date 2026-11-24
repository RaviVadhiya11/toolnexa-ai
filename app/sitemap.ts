import type {MetadataRoute} from 'next';
import {tools} from '@/lib/tools';
import {CANONICAL_SITE_URL} from '@/lib/site-url';

const mainPages=['','/about','/tools','/studio','/pricing','/privacy','/terms','/billing','/support'] as const;
const studioPages=[
 '/studio/enhance','/studio/background-remove','/studio/batch',
 '/studio/convert','/studio/image-to-vector','/studio/restore',
 '/studio/retouch','/studio/svg-editor','/studio/vector',
 '/studio/passport-social','/studio/zip-maker'
] as const;

/** Canonical public pages only. Never include account, admin or checkout routes. */
export default function sitemap():MetadataRoute.Sitemap{
 if(process.env.SITE_PUBLIC_LAUNCH_ENABLED!=='true')return [];
 const pages:MetadataRoute.Sitemap=[...mainPages,...studioPages].map(path=>({
  url:CANONICAL_SITE_URL+path,
  changeFrequency:'weekly',
  priority:path===''?1:path==='/tools'||path==='/studio'?.9:.7
 }));
 const toolPages:MetadataRoute.Sitemap=tools.map(tool=>({
  url:CANONICAL_SITE_URL+'/tools/'+tool.slug,
  changeFrequency:'monthly',
  priority:.7
 }));
 return [...pages,...toolPages];
}
