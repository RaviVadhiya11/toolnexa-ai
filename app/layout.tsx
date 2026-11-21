import type { Metadata } from 'next';import './globals.css';import {Shell} from '@/components/shell';
export const metadata:Metadata={title:{default:'ToolNexa AI | Free Smart Online Tools',template:'%s | ToolNexa AI'},description:'All-in-one PDF, image, text, developer and business tools. Fast, responsive and privacy-focused.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body><Shell>{children}</Shell></body></html>}
