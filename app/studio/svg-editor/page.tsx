import type {Metadata} from 'next';
import {toolMetadata} from '@/lib/tool-seo';
import {ToolSearchGuide} from '@/components/tool-search-guide';
import {StudioVectorFormats} from '@/components/studio-vector-formats';
export const metadata:Metadata={...toolMetadata('studio/svg-editor','/studio/svg-editor'),alternates:{canonical:'/studio/svg-editor'}};
export default function Page(){return <><StudioVectorFormats mode="edit"/><ToolSearchGuide seoKey="studio/svg-editor" studio/></>}
