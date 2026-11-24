import type {Metadata} from 'next';
import {PassportSocialExactExperience} from '@/components/passport-social-exact-experience';
export const metadata:Metadata={
 title:'Passport & Social Photo Studio',
 description:'Premium glassmorphism photo workspace with ID crops, social frames, 300 PPI 4x6 and A4 sheets, file-size optimization, and verified subscription exports.'
,
 alternates:{canonical:'/studio/passport-social'}
};
export default function PassportSocialPage(){return <PassportSocialExactExperience/>;}
