import type {Metadata} from 'next';
import {ImageToVector} from '@/components/image-to-vector';
import {StudioWorkspace} from '@/components/studio-workspace';
export const metadata:Metadata={
 title:'Vector Logo & Image-to-SVG Studio',
 description:'Trace PNG and JPG images into editable SVG vector paths, or create simple logos using preset shapes and local export tools.'
,
 alternates:{canonical:'/studio/vector'}
};
export default function VectorPage(){return <>
 <ImageToVector/>
 <details className="vectorize-templates">
  <summary>Optional: create SVG logos from preset shapes instead</summary>
  <StudioWorkspace mode="vector"/>
 </details>
</>}
