import type {Metadata} from 'next';
import {StudioImageSuite} from '@/components/studio-image-suite';
export const metadata:Metadata={title:"AI Background Remover HD",description:"Remove photo backgrounds automatically with U2Net on-device AI or a solid-background mode."};
export default function Page(){return <StudioImageSuite mode="background"/>}
