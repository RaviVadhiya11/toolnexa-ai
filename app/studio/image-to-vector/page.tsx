import type {Metadata} from 'next';
import {toolMetadata} from '@/lib/tool-seo';
import {ToolSearchGuide} from '@/components/tool-search-guide';
import {ImageToVector} from '@/components/image-to-vector';
export const metadata:Metadata={...toolMetadata('studio/image-to-vector','/studio/image-to-vector'),alternates:{canonical:'/studio/image-to-vector'}};
export default function Page(){return <><ImageToVector/><ToolSearchGuide seoKey="studio/image-to-vector" studio/></>}
