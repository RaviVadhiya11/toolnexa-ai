import type {Metadata} from 'next';
import Link from 'next/link';
import {PassportSocialStudio} from '@/components/passport-social-studio';
export const metadata:Metadata={
 title:'Verified Premium Passport & Social Studio — ToolNexa AI',
 description:'Verified Pro passport 600-PPI print PDF, HD social photo downloads, AI cutout and advanced 4K/8K image upscaling.',
 alternates:{canonical:'/studio/passport-social'},robots:{index:false,follow:false}
};
export default function PassportSocialPremiumPage(){return <>
 <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
  <Link href="/studio/passport-social" className="text-sm text-cyan-400 hover:text-cyan-200">← Original photo studio design</Link>
 </div>
 <PassportSocialStudio/>
 </>;}
