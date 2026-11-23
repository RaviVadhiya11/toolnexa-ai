import type {Metadata} from 'next';
import {StudioWorkspace} from '@/components/studio-workspace';
export const metadata:Metadata={title:'Real Vector Studio',description:'Create SVG vector artwork with editable shapes, palettes and Pro HD PNG export.'};
export default function VectorPage(){return <StudioWorkspace mode="vector"/>}
