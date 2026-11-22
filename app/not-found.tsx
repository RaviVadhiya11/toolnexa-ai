import Link from 'next/link';
import {SearchX,House,LayoutGrid} from 'lucide-react';

export default function NotFound(){
 return <section className="site-feedback-page" aria-labelledby="not-found-title">
  <div className="site-feedback-icon"><SearchX size={32}/></div>
  <p className="site-feedback-eyebrow">404 · PAGE NOT FOUND</p>
  <h1 id="not-found-title">This page is unavailable</h1>
  <p>The address might be incorrect, or the page may have moved. Explore our 20 free tools or return home.</p>
  <div className="site-feedback-actions"><Link className="button" href="/tools"><LayoutGrid size={17}/> Browse all tools</Link><Link className="button outline" href="/"><House size={17}/> Back home</Link></div>
 </section>;
}
