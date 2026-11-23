import type {Metadata} from 'next';
import {StudioWorkspace} from '@/components/studio-workspace';
export const metadata:Metadata={title:'Image Enhancer and HD Upscaler',description:'Improve image color and contrast locally, with Pro-only HD 2x/4x JPEG export.'};
export default function EnhancePage(){return <StudioWorkspace mode="image"/>}
