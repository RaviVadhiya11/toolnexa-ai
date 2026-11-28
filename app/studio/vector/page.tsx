import type {Metadata} from 'next';
import {toolMetadata} from '@/lib/tool-seo';
import {ToolSearchGuide} from '@/components/tool-search-guide';
import {ImageToVector} from '@/components/image-to-vector';
import {StudioWorkspace} from '@/components/studio-workspace';
export const metadata:Metadata={...toolMetadata('studio/vector','/studio/vector'),alternates:{canonical:'/studio/vector'}};
export default function VectorPage(){return <>
 <ImageToVector/>
 <details className="vectorize-templates">
  <summary>Optional: create SVG logos from preset shapes instead</summary>
  <StudioWorkspace mode="vector"/>
 </details>
 <ToolSearchGuide seoKey="studio/vector" studio/>
</>}
