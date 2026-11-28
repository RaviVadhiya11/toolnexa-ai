import Link from 'next/link';
import type {Metadata} from 'next';
import {BillMaker} from '@/components/bill-maker';
export const metadata:Metadata={
 title:'Bill & Invoice Maker Studio',
 description:'Create professional GST or non-GST invoices with custom business branding, signature, live A4 preview and verified PDF export.',
 alternates:{canonical:'/tools/invoice-generator'}
};
export default function BillMakerStudio(){return <main className="studio-home suite-home"><Link href="/studio" className="button outline">← All Studio tools</Link><BillMaker/></main>}
