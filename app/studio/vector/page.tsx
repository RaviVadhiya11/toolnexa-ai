import type {Metadata} from 'next';
import {ImageToVector} from '@/components/image-to-vector';
import {StudioWorkspace} from '@/components/studio-workspace';
export const metadata:Metadata={
 title:'Image to Real SVG Vector Converter',
 description:'Upload a PNG, JPG or WebP image to trace actual editable SVG vector paths, preview before-and-after and export SVG for free with Pro HD PNG downloads.'
};
export default function VectorPage(){return <>
 <ImageToVector/>
 <details className="vectorize-templates">
  <summary>Optional: create SVG logos from preset shapes instead</summary>
  <StudioWorkspace mode="vector"/>
 </details>
</>}
