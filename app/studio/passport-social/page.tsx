import type {Metadata} from 'next';
import {PassportSocialStudio} from '@/components/passport-social-studio';
export const metadata:Metadata={
 title:'AI Passport & Social Size Studio',
 description:'Prepare passport and social photos with real crop controls, common photo sizes, 4x6 print sheet, local AI background cutout, and verified Pro exports. Country photo requirements must be checked independently.'
};
export default function PassportSocialPage(){return <PassportSocialStudio/>;}
