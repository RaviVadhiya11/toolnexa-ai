import './studio.css';
import {StudioTopbar} from '@/components/studio-premium-nav';
export default function StudioLayout({children}:{children:React.ReactNode}){
 return <><StudioTopbar/>{children}</>;
}
