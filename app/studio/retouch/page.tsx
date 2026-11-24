import type {Metadata} from 'next';
import {StudioImageSuite} from '@/components/studio-image-suite';
export const metadata:Metadata={title:"Object Remover & Retouch",description:"Paint unwanted small objects and remove them using browser-based inpainting.",
 alternates:{canonical:'/studio/retouch'}
};
export default function Page(){return <StudioImageSuite mode="retouch"/>}
