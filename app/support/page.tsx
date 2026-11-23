import Link from 'next/link';
import type {Metadata} from 'next';
import {CircleHelp,ShieldCheck,FileText,Wallet,ExternalLink} from 'lucide-react';
export const metadata:Metadata={title:'Help & Support',description:'Get help using ToolNexa AI free tools, logging in, and managing PayPal monthly or yearly subscriptions.',alternates:{canonical:'/support'}};
const topics=[
 {icon:FileText,title:'PDF & image tools',text:'Use supported files (up to 25 MB per file). Most editing tools cannot open an already encrypted PDF, but Protect PDF can create a password-protected AES-256 file. For failed downloads, try a current browser and check storage permissions.'},
 {icon:ShieldCheck,title:'Sign in and account',text:'If email confirmation is enabled, open the verification link in your inbox. Google login requires the configured Supabase provider.'},
 {icon:Wallet,title:'Subscriptions & billing',text:'The Dashboard shows server-verified membership and cancellation. If a cancellation is pending or checkout fails, confirm status in PayPal before trying again.'}
];
export default function SupportPage(){return <div className="support-page">
 <header className="legal-hero"><p className="legal-kicker">WE ARE HERE TO GUIDE YOU</p><h1>Help &amp; Support</h1><p>Find answers for tools, accounts and monthly or yearly subscriptions.</p></header>
 <div className="support-grid">{topics.map(({icon:Icon,title,text})=><section className="support-card" key={title}><Icon size={23}/><h2>{title}</h2><p>{text}</p></section>)}</div>
 <section className="legal-content">
  <h2>Quick answers</h2>
  <details><summary>Are all 56 tools free?</summary><p>All 56 utility tools are available on the Free plan with 10 browser-local successful runs per UTC day. Signed-in paid Starter, Pro, Premium and Max plans have account-scoped daily limits of 500, 1,000, 1,500 and 3,000 tool runs respectively. Batch Text Analyzer handles up to 20, 60, 150 or 300 texts per request according to plan. There is no uncapped plan. All account limits reset at 00:00 UTC; local tool execution cannot be made entirely tamper-proof outside the official interface.</p></details>
  <details><summary>Does Max include unlimited Gemini AI?</summary><p>No. Gemini AI is currently a separate limited preview, available to signed-in users with up to 3 generations per day each and 30 for the whole website. It is not part of a paid subscription entitlement. Offline Smart Mode is available without an AI request.</p></details>
  <details><summary>Can I pay yearly instead of monthly?</summary><p>Yes. Choose Yearly on the <Link href="/pricing">Pricing page</Link>. Each recurring annual subscription is billed upfront and renews every 12 months until cancelled. All Max checkouts remain disabled until new distinct PayPal Live Max plan IDs, payment verification and account quota checks have been completed.</p></details>
  <details><summary>Are files uploaded to ToolNexa AI?</summary><p>The free PDF and image processing tools run locally in your browser; their file inputs are not sent through a website upload API. Tool usage counts may still be recorded separately.</p></details>
  <details><summary>What if my payment doesn't activate Premium access?</summary><p>First check PayPal's subscription status and your ToolNexa AI Dashboard. Subscription verification may be temporarily unavailable. A checkout screen alone does not confirm an active membership.</p></details>
  <details><summary>How can I stop recurring billing?</summary><p>Go to Dashboard → Manage Subscription, or manage automatic payments through PayPal. See <Link href="/billing">Billing & Cancellation</Link>.</p></details>
 </section>
 <section className="support-contact"><CircleHelp size={28}/><div><h2>Report a technical issue</h2><p>Use the project's GitHub Issues page for non-sensitive bug reports. Describe the tool, browser and error without sharing passwords, personal files, email addresses, payment IDs or financial details. For private payment issues, use your PayPal account's support options.</p><a className="button" href="https://github.com/RaviVadhiya11/toolnexa-ai/issues" target="_blank" rel="noopener noreferrer">Open GitHub Issues <ExternalLink size={16}/></a></div></section>
 </div>}
