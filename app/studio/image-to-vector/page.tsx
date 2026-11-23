import type {Metadata} from 'next';
import {ImageToVector} from '@/components/image-to-vector';
export const metadata:Metadata={title:'Image to Vector Pro — JPG/PNG to SVG',description:'Upload images, trace editable SVG paths, compare original versus vector and export real SVG.'};
export default function Page(){return <ImageToVector/>}
