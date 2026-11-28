import type {Metadata} from 'next';
import {toolMetadata} from '@/lib/tool-seo';
import {ToolSearchGuide} from '@/components/tool-search-guide';
import {StudioImageSuite} from '@/components/studio-image-suite';
export const metadata:Metadata={...toolMetadata('studio/restore','/studio/restore'),alternates:{canonical:'/studio/restore'}};
export default function Page(){return <><StudioImageSuite mode="restore"/><ToolSearchGuide seoKey="studio/restore" studio/></>}
