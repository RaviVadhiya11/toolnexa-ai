import type {Metadata} from 'next';
import {toolMetadata} from '@/lib/tool-seo';
import {ToolSearchGuide} from '@/components/tool-search-guide';
import {StudioVectorFormats} from '@/components/studio-vector-formats';
export const metadata:Metadata={...toolMetadata('studio/convert','/studio/convert'),alternates:{canonical:'/studio/convert'}};
export default function Page(){return <><StudioVectorFormats mode="convert"/><ToolSearchGuide seoKey="studio/convert" studio/></>}
