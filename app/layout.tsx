import type {Metadata,Viewport} from 'next';
import './globals.css';
import './neon-glass-3d.css';
import {Shell} from '@/components/shell';

const site='https://toolnexa-ai.vercel.app';
export const metadata:Metadata={
 metadataBase:new URL(site),
 title:{default:'ToolNexa AI | 60 Utility Tools + 11 Creator Studio Workspaces',template:'%s | ToolNexa AI'},
 description:'ToolNexa AI includes 60 browser utility tools and 11 specialist Creator Studio workspaces for images, PDF, ZIP, text and development with verified premium exports.',
 applicationName:'ToolNexa AI',
 // Search engine indexing is opt-in only after domain, support contact and payments are ready.
 robots:{index:process.env.SITE_PUBLIC_LAUNCH_ENABLED==='true',follow:process.env.SITE_PUBLIC_LAUNCH_ENABLED==='true'},
 openGraph:{
  type:'website',siteName:'ToolNexa AI',url:site,
  title:'ToolNexa AI — 60 Utility Tools + 11 Studio Workspaces',
  description:'PDF, Image, Text, Developer and Business tools in one premium workspace.'
 },
 twitter:{card:'summary',title:'ToolNexa AI — 60 Utility Tools + 11 Studio Workspaces',description:'Fast, browser-based PDF, Image, Text and Developer utilities.'}
};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#05060a'};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en" suppressHydrationWarning><body><Shell>{children}</Shell></body></html>;
}
