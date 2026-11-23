import type {MetadataRoute} from 'next';

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
  sitemap:'https://toolnexa-ai.vercel.app/sitemap.xml',
  host:'https://toolnexa-ai.vercel.app'
 };
}
