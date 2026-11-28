import type {Metadata} from 'next';
import {toolMetadata} from '@/lib/tool-seo';
import {ToolSearchGuide} from '@/components/tool-search-guide';
import {PassportSocialExactExperience} from '@/components/passport-social-exact-experience';
export const metadata:Metadata={...toolMetadata('studio/passport-social','/studio/passport-social'),alternates:{canonical:'/studio/passport-social'}};
export default function PassportSocialPage(){return <><PassportSocialExactExperience/><ToolSearchGuide seoKey="studio/passport-social" studio/></>}
