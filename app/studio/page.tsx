import Link from 'next/link';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Vector Studio and Image Enhancer',description:'Create genuine SVG vector designs, adjust images and use Pro for server-verified HD PNG downloads.'};
export default function StudioHome(){return <div className="studio-home">
 <span className="studio-eyebrow">TOOLNEXA AI · NEW DESIGN WORKSPACE</span>
 <h1>Vector Studio & Image Enhancer</h1>
 <p>Create editable vector artwork and enhance photos with straightforward controls. Free standard exports; verified Pro, Premium or Max membership unlocks server-produced HD PNGs.</p>
 <div className="studio-home-grid">
  <Link href="/studio/vector"><span className="studio-emoji">✧</span><strong>Real Vector Studio</strong><span>Editable SVG artwork, color controls and free vector download.</span><b>Open Vector Editor →</b></Link>
  <Link href="/studio/enhance"><span className="studio-emoji">◈</span><strong>Image Enhancer</strong><span>Brightness, contrast and saturation preview with HD upscale download.</span><b>Open Image Enhancer →</b></Link>
 </div>
 <p className="studio-note">Enhancement is traditional browser-based image processing; it does not generate new AI image details. Native AI, CDR, EPS, DXF, WMF/EMF converters are not included in this release.</p>
 </div>}
