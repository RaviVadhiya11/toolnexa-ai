import type {Metadata,Viewport} from 'next';
import {CANONICAL_SITE_URL} from '@/lib/site-url';
import './globals.css';
import './neon-glass-3d.css';
import {Shell} from '@/components/shell';
import {SeoJsonLd} from '@/components/seo-json-ld';

const site=CANONICAL_SITE_URL;
const siteSchema={
 '@context':'https://schema.org',
 '@graph':[
  {'@type':'Organization','@id':site+'#organization',name:'ToolNexa AI',url:site},
  {'@type':'WebSite','@id':site+'#website',name:'ToolNexa AI',url:site,
   publisher:{'@id':site+'#organization'},inLanguage:'en'},
  {'@type':'WebApplication','@id':site+'#application',name:'ToolNexa AI',url:site,
   description:'60 browser utilities and 12 Creator Studio workspaces for PDF, image, text, vector, ZIP and developer tasks.',
   applicationCategory:'UtilitiesApplication',operatingSystem:'Web browser',isAccessibleForFree:true}
 ]
};
export const metadata:Metadata={
 metadataBase:new URL(site),
 title:{default:'ToolNexa AI | 60 Utility Tools + 12 Creator Studio Workspaces',template:'%s | ToolNexa AI'},
 description:'ToolNexa AI includes 60 browser utility tools and 12 specialist Creator Studio workspaces for images, PDF, ZIP, text and development with verified premium exports.',
 applicationName:'ToolNexa AI',
 ...(process.env.GOOGLE_SITE_VERIFICATION?{verification:{google:process.env.GOOGLE_SITE_VERIFICATION}}:{}),
 // Public indexing remains explicit and enabled only in the launched Production environment.
 robots:{index:process.env.SITE_PUBLIC_LAUNCH_ENABLED==='true',follow:process.env.SITE_PUBLIC_LAUNCH_ENABLED==='true'},
 openGraph:{
  type:'website',siteName:'ToolNexa AI',url:site,
  title:'ToolNexa AI — 60 Utility Tools + 12 Studio Workspaces',
  description:'PDF, Image, Text, Developer and Business tools in one premium workspace.'
 },
 twitter:{card:'summary',title:'ToolNexa AI — 60 Utility Tools + 12 Studio Workspaces',description:'Fast, browser-based PDF, Image, Text and Developer utilities.'}
};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#05060a'};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en" suppressHydrationWarning><body><SeoJsonLd data={siteSchema}/><Shell>{children}</Shell></body></html>;
}
