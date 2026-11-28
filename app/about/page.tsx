import Link from 'next/link';
import {SupportEmail} from '@/components/support-email';
import type {Metadata} from 'next';

export const metadata:Metadata={
 title:'About ToolNexa AI — Online Tools & Creator Studio',
 description:'Learn about ToolNexa AI: 60 online utilities, 12 Creator Studio workspaces, browser-based processing and daily usage limits.',
 alternates:{canonical:'/about'}
};

export default function AboutPage(){
 return <article className="legal-page">
  <header className="legal-hero">
   <p className="legal-kicker">ABOUT THE WORKSPACE</p>
   <h1>About ToolNexa AI</h1>
   <p>A practical online workspace for everyday file, image, text and developer tasks.</p>
  </header>
  <div className="legal-content">
   <section><h2>What is ToolNexa AI?</h2><p>ToolNexa AI brings together 60 utilities and 12 Creator Studio workspaces. Format JSON, generate QR codes, convert images, edit PDFs, resize photos, trace images into editable SVG vectors and prepare ZIP archives without installing desktop software for many common tasks.</p><p>Explore the <Link href="/tools">online tools directory</Link> or browse the <Link href="/studio">Creator Studio workspaces</Link>.</p></section>
   <section><h2>File and image tools</h2><p>The utilities cover text, developer, business, image, PDF and creator categories. Studio workspaces include enhancement and upscaling, background cleanup, vector tracing, SVG editing, photo retouching, passport and social sizing, and ZIP creation. Supported formats, quality options and file-size limits vary by tool and browser.</p><p>For example, the <Link href="/tools/youtube-thumbnail-downloader">YouTube Thumbnail Downloader</Link> previews publicly available thumbnails, while the <Link href="/studio/zip-maker">ZIP Maker</Link> assembles archives in the browser.</p></section>
   <section><h2>Free access and subscriptions</h2><p>The Free plan has 3 shared daily runs across utility tools and Studio tools, tracked for the same browser using a site cookie and server counter. Signing in or out in that browser does not restart the Free allowance. Paid Starter, Pro, Premium and Max plans have larger account-based daily limits and unlock eligible downloads; exact features and prices appear on the <Link href="/pricing">Pricing page</Link>. There is no unlimited plan.</p></section>
   <section><h2>Privacy and limitations</h2><p>Many operations happen inside your browser. Some features use optional third-party models or server-side processing. ToolNexa AI cannot guarantee flawless output for every file or device; review important documents and photos. For details, read the <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Use</Link>.</p></section>
   <section><h2>Questions, billing or feedback?</h2><p>Email <SupportEmail/> for business inquiries or assistance, or visit <Link href="/contact">Contact Us</Link>. See <Link href="/support">Help &amp; Support</Link> for troubleshooting and non-sensitive bug reports. For recurring charges and cancellation information, visit <Link href="/billing">Billing &amp; Cancellation</Link>. Avoid posting passwords, personal files or payment details in public issues.</p></section>
  </div>
  <div className="legal-end">Ready to get started? <Link href="/tools">Browse all 60 tools</Link></div>
 </article>;
}
