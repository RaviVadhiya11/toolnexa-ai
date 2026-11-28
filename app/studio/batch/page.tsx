import type {Metadata} from 'next';
import {toolMetadata} from '@/lib/tool-seo';
import {ToolSearchGuide} from '@/components/tool-search-guide';
import {StudioBatchProcessor} from '@/components/studio-batch-processor';
export const metadata:Metadata={...toolMetadata('studio/batch','/studio/batch'),alternates:{canonical:'/studio/batch'}};
export default function BatchPage(){return <><StudioBatchProcessor/><ToolSearchGuide seoKey="studio/batch" studio/></>}
