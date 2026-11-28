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
   applicationCategory:'UtilitiesApplication',operatingSystem:'Web browser'}
 ]
};
export const metadata:Metadata={
 metadataBase:new URL(site),
 title:{default:'ToolNexa AI – Online PDF, Image, Invoice & AI Tools',template:'%s | ToolNexa AI'},
 description:'Merge PDFs, resize photos, create GST invoices, remove backgrounds and convert files with 60 online utilities and 12 Studio workspaces. Paid file exports.',
 applicationName:'ToolNexa AI',
 ...(process.env.GOOGLE_SITE_VERIFICATION?{verification:{google:process.env.GOOGLE_SITE_VERIFICATION}}:{}),
 // Public indexing remains explicit and enabled only in the launched Production environment.
 robots:{index:process.env.SITE_PUBLIC_LAUNCH_ENABLED==='true',follow:process.env.SITE_PUBLIC_LAUNCH_ENABLED==='true'},
 openGraph:{
  type:'website',siteName:'ToolNexa AI',url:site,locale:'en_US',
  title:'ToolNexa AI — 60 Utility Tools + 12 Studio Workspaces',
  description:'PDF, Image, Text, Developer and Business tools in one premium workspace.'
 },
 twitter:{card:'summary',title:'ToolNexa AI — 60 Utility Tools + 12 Studio Workspaces',description:'Fast, browser-based PDF, Image, Text and Developer utilities.'}
};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#05060a'};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en" suppressHydrationWarning><body><SeoJsonLd data={siteSchema}/><Shell>{children}</Shell></body></html>;
}
