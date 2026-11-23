import type {Metadata} from 'next';
import {StudioVectorFormats} from '@/components/studio-vector-formats';
export const metadata:Metadata={title:'SVG Vector Editor',description:'Edit SVG vector fill, stroke, shapes and size, then download editable SVG files.'};
export default function Page(){return <StudioVectorFormats mode="edit"/>}
