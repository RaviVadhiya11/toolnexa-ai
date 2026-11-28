import Link from 'next/link';
import type {Metadata} from 'next';
import {toolMetadata} from '@/lib/tool-seo';
import {ToolSearchGuide} from '@/components/tool-search-guide';
import {BillMaker} from '@/components/bill-maker';
export const metadata:Metadata={
 ...toolMetadata('invoice-generator','/tools/invoice-generator'),
 alternates:{canonical:'/tools/invoice-generator'}
};
export default function BillMakerStudio(){return <main className="studio-home suite-home"><Link href="/studio" className="button outline">← All Studio tools</Link><BillMaker/><ToolSearchGuide seoKey="invoice-generator"/></main>}
