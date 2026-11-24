import type {Metadata} from 'next';
import {StudioBatchProcessor} from '@/components/studio-batch-processor';
export const metadata:Metadata={title:'Batch Image Enhancer & ZIP Export',description:'Process up to eight local images into a ZIP with real Premium/Max subscription verification and daily usage limits.',
 alternates:{canonical:'/studio/batch'}
};
export default function BatchPage(){return <StudioBatchProcessor/>;}
