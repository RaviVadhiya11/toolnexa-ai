import type {Metadata,Viewport} from 'next';
import './globals.css';
import {Shell} from '@/components/shell';

const site='https://toolnexa-ai.vercel.app';
export const metadata:Metadata={
 metadataBase:new URL(site),
 title:{default:'ToolNexa AI | 60 Utility Tools + 9 Creator Studio Workspaces',template:'%s | ToolNexa AI'},
 description:'Use 60 browser utility tools and 9 specialized image and vector studio workflows for PDF, images, text, developers and business. Fast, private, browser-based utilities, plus optional premium batch text analysis.',
 applicationName:'ToolNexa AI',
 // Search engine indexing is opt-in only after domain, support contact and payments are ready.
 robots:{index:process.env.SITE_PUBLIC_LAUNCH_ENABLED==='true',follow:process.env.SITE_PUBLIC_LAUNCH_ENABLED==='true'},
 openGraph:{
  type:'website',siteName:'ToolNexa AI',url:site,
  title:'ToolNexa AI — 60 Utility Tools + 9 Studio Workspaces',
  description:'PDF, Image, Text, Developer and Business tools in one premium workspace.'
 },
 twitter:{card:'summary',title:'ToolNexa AI — 60 Utility Tools + 9 Studio Workspaces',description:'Fast, browser-based PDF, Image, Text and Developer utilities.'}
};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#05060a'};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en" suppressHydrationWarning><body><Shell>{children}</Shell></body></html>;
}
