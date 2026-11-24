import type {MetadataRoute} from 'next';
import {CANONICAL_SITE_URL} from '@/lib/site-url';

export default function robots():MetadataRoute.Robots {
 if(process.env.SITE_PUBLIC_LAUNCH_ENABLED!=='true')return {rules:[{userAgent:'*',disallow:'/'}]};
 return {
  rules:[{
   userAgent:'*',
   allow:'/',
   disallow:[
    '/api/',
    '/admin',
    '/dashboard',
    '/login',
    '/reset-password',
    '/signup',
    '/subscribe/',
    '/pro/'
   ]
  }],
  sitemap:CANONICAL_SITE_URL+'/sitemap.xml',
  host:CANONICAL_SITE_URL
 };
}
