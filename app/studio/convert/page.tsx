import type {Metadata} from 'next';
import {StudioVectorFormats} from '@/components/studio-vector-formats';
export const metadata:Metadata={title:'SVG to PDF, EPS & DXF Vector Converter',description:'Export real SVG vector geometry to SVG, PDF, EPS and CAD DXF outlines. Native AI and CDR require desktop converters.'};
export default function Page(){return <StudioVectorFormats mode="convert"/>}
