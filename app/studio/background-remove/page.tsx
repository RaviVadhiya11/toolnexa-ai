import type {Metadata} from 'next';
import {toolMetadata} from '@/lib/tool-seo';
import {ToolSearchGuide} from '@/components/tool-search-guide';
import {StudioImageSuite} from '@/components/studio-image-suite';
export const metadata:Metadata={...toolMetadata('studio/background-remove','/studio/background-remove'),alternates:{canonical:'/studio/background-remove'}};
export default function Page(){return <><StudioImageSuite mode="background"/><ToolSearchGuide seoKey="studio/background-remove" studio/></>}
