import Link from 'next/link';
import type {Metadata} from 'next';
import {CircleHelp,ShieldCheck,FileText,Wallet,ExternalLink} from 'lucide-react';
export const metadata:Metadata={title:'Help & Support',description:'Get help using ToolNexa AI free tools, logging in, and managing PayPal monthly or yearly subscriptions.',alternates:{canonical:'/support'}};
const topics=[
 {icon:FileText,title:'PDF & image tools',text:'Use supported files (up to 25 MB per file). Password-protected PDFs are not supported. For failed downloads, try a current browser and check storage permissions.'},
 {icon:ShieldCheck,title:'Sign in and account',text:'If email confirmation is enabled, open the verification link in your inbox. Google login requires the configured Supabase provider.'},
 {icon:Wallet,title:'Subscriptions & billing',text:'The Dashboard shows server-verified membership and cancellation. If a cancellation is pending or checkout fails, confirm status in PayPal before trying again.'}
];
export default function SupportPage(){return <div className="support-page">
 <header className="legal-hero"><p className="legal-kicker">WE ARE HERE TO GUIDE YOU</p><h1>Help &amp; Support</h1><p>Find answers for tools, accounts and monthly or yearly subscriptions.</p></header>
 <div className="support-grid">{topics.map(({icon:Icon,title,text})=><section className="support-card" key={title}><Icon size={23}/><h2>{title}</h2><p>{text}</p></section>)}</div>
 <section className="legal-content">
  <h2>Quick answers</h2>
  <details><summary>Are all 20 tools free?</summary><p>All 20 browser utilities are available on the Free plan, with 10 successful runs per day shared across the tools on this browser. Active Starter, Pro and Premium subscriptions increase the daily allowance to 500, 1,000 and 1,500 runs respectively and unlock higher-capacity Batch Text Analyzer requests, whether billed monthly or yearly. Unlimited, when activated, includes no fixed daily run cap subject to fair-use throttling of 60 runs per minute and up to 300 texts per Batch Text Analyzer request. Other plans reset at 00:00 UTC. Signed-out users have a browser-local limit. Signed-in accounts can have a cross-device Supabase limit once account-wide usage tracking is enabled; locally processed tools still cannot prevent a determined user from bypassing the browser UI.</p></details>
  <details><summary>Can I pay yearly instead of monthly?</summary><p>Yes. Choose Yearly on the <Link href="/pricing">Pricing page</Link> to compare prices, including the upfront annual total. Yearly PayPal checkout becomes available only after its distinct recurring annual billing plans are configured and verified. It renews every 12 months unless cancelled. Unlimited monthly/yearly checkout launches only after its separate PayPal plans and fair-use account counter have been configured and verified.</p></details>
  <details><summary>Are files uploaded to ToolNexa AI?</summary><p>The free PDF and image processing tools run locally in your browser; their file inputs are not sent through a website upload API. Tool usage counts may still be recorded separately.</p></details>
  <details><summary>What if my payment doesn't activate Premium access?</summary><p>First check PayPal's subscription status and your ToolNexa AI Dashboard. Subscription verification may be temporarily unavailable. A checkout screen alone does not confirm an active membership.</p></details>
  <details><summary>How can I stop recurring billing?</summary><p>Go to Dashboard → Manage Subscription, or manage automatic payments through PayPal. See <Link href="/billing">Billing & Cancellation</Link>.</p></details>
 </section>
 <section className="support-contact"><CircleHelp size={28}/><div><h2>Report a technical issue</h2><p>Use the project's GitHub Issues page for non-sensitive bug reports. Describe the tool, browser and error without sharing passwords, personal files, email addresses, payment IDs or financial details. For private payment issues, use your PayPal account's support options.</p><a className="button" href="https://github.com/RaviVadhiya11/toolnexa-ai/issues" target="_blank" rel="noopener noreferrer">Open GitHub Issues <ExternalLink size={16}/></a></div></section>
 </div>}
