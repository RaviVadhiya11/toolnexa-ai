import type {Metadata} from 'next';
import {StudioImageSuite} from '@/components/studio-image-suite';
export const metadata:Metadata={title:"Photo Restore & Colorizer",description:"Denoise, sharpen and colour-grade old photographs with classic photo processing.",
 alternates:{canonical:'/studio/restore'}
};
export default function Page(){return <StudioImageSuite mode="restore"/>}
