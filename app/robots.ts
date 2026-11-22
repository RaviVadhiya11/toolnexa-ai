import type {MetadataRoute} from 'next';

export default function robots():MetadataRoute.Robots {
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
