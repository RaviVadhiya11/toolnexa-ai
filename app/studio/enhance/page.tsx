import type {Metadata} from 'next';
import {ProfessionalImageEnhancer} from '@/components/professional-image-enhancer';
export const metadata:Metadata={
 title:'AI Detail Image Enhancer & Upscaler — HD, 4K, 8K',
 description:'Upload a JPG, PNG or WebP photo and enhance sharpness, colours and noise. Optional neural AI Detail, before/after comparison and upscaling up to 8K, with subscription-gated full-size downloads.'
};
export default function EnhancePage(){return <ProfessionalImageEnhancer/>}
