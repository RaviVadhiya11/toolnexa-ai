import {SUPPORT_EMAIL,SUPPORT_MAILTO} from '@/lib/contact';
export function SupportEmail({className}:{className?:string}){return <a href={SUPPORT_MAILTO} className={className} style={{overflowWrap:'anywhere'}}>{SUPPORT_EMAIL}</a>}
