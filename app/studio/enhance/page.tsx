import type {Metadata} from 'next';
import {toolMetadata} from '@/lib/tool-seo';
import {ToolSearchGuide} from '@/components/tool-search-guide';
import {ProfessionalImageEnhancer} from '@/components/professional-image-enhancer';
export const metadata:Metadata={...toolMetadata('studio/enhance','/studio/enhance'),alternates:{canonical:'/studio/enhance'}};
export default function EnhancePage(){return <><ProfessionalImageEnhancer/><ToolSearchGuide seoKey="studio/enhance" studio/></>}
