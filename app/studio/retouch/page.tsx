import type {Metadata} from 'next';
import {toolMetadata} from '@/lib/tool-seo';
import {ToolSearchGuide} from '@/components/tool-search-guide';
import {StudioImageSuite} from '@/components/studio-image-suite';
export const metadata:Metadata={...toolMetadata('studio/retouch','/studio/retouch'),alternates:{canonical:'/studio/retouch'}};
export default function Page(){return <><StudioImageSuite mode="retouch"/><ToolSearchGuide seoKey="studio/retouch" studio/></>}
