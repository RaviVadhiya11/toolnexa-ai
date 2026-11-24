import {NextRequest,NextResponse} from 'next/server';
import {createServerClient} from '@supabase/ssr';
import {CANONICAL_SITE_URL,LEGACY_SITE_HOST,shouldRedirectLegacyPage} from '@/lib/site-url';

export async function middleware(request:NextRequest){
 const path=request.nextUrl.pathname;
 const host=(request.headers.get('host')||request.nextUrl.hostname).split(':')[0].toLowerCase();

 // One branded site for visitors and search engines. Keep old PayPal webhooks,
 // API paths, and previously issued Supabase callback links functional.
 // The incoming path and query string are preserved across the permanent redirect.
 if(host===LEGACY_SITE_HOST&&shouldRedirectLegacyPage(path,request.method)){
  const destination=new URL(CANONICAL_SITE_URL);
  destination.pathname=path;
  destination.search=request.nextUrl.search;
  return NextResponse.redirect(destination,308);
 }

 // Preserve the previous Supabase session refresh behavior on account routes,
 // without contacting Supabase for every public page or static file.
 const needsAuth=path==='/login'||path==='/signup'||
  /^(?:\/dashboard|\/admin|\/auth)(?:\/|$)/.test(path);
 if(!needsAuth)return NextResponse.next({request});

 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.next({request});
 let response=NextResponse.next({request});
 const client=createServerClient(url,key,{
  cookies:{
   getAll(){return request.cookies.getAll()},
   setAll(items:{name:string;value:string;options?:Record<string,unknown>}[]){
    items.forEach(({name,value})=>request.cookies.set(name,value));
    response=NextResponse.next({request});
    items.forEach(({name,value,options})=>response.cookies.set(name,value,options));
   }
  }
 });
 await client.auth.getUser();
 return response;
}

export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
