import type {Metadata} from 'next';
import {ZipMakerExperience} from '@/components/zip-maker-experience';
export const metadata:Metadata={
 title:'Advanced ZIP Maker Studio — Compress Files & Folders',
 description:'Create a secure ZIP archive in your browser. Add files and folders, preserve nested paths and choose Fast, Smart or Maximum compression. Verified Starter to Max subscriptions.',
 alternates:{canonical:'/studio/zip-maker'}
};
export default function ZipMakerPage(){return <ZipMakerExperience/>}
