import type {Metadata} from 'next';
import {toolMetadata} from '@/lib/tool-seo';
import {ToolSearchGuide} from '@/components/tool-search-guide';
import {ZipMakerExperience} from '@/components/zip-maker-experience';
export const metadata:Metadata={...toolMetadata('studio/zip-maker','/studio/zip-maker'),alternates:{canonical:'/studio/zip-maker'}};
export default function ZipMakerPage(){return <><ZipMakerExperience/><ToolSearchGuide seoKey="studio/zip-maker" studio/></>}
