import Link from 'next/link';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Vector Studio and Image Enhancer',description:'Create genuine SVG vector designs, adjust images and use Pro for server-verified HD PNG downloads.'};
export default function StudioHome(){return <div className="studio-home">
 <span className="studio-eyebrow">TOOLNEXA AI · NEW DESIGN WORKSPACE</span>
 <h1>Image to Vector & Image Enhancer</h1>
 <p>Upload a JPG, PNG or WebP image and trace it into editable SVG vector paths; enhance photos with straightforward controls. Free standard exports; verified Pro, Premium or Max membership unlocks server-produced HD vector PNGs or enhanced-image JPEGs.</p>
 <div className="studio-home-grid">
  <Link href="/studio/vector"><span className="studio-emoji">✧</span><strong>Real Vector Studio</strong><span>Upload PNG/JPG/WebP, choose tracing colors and download real editable SVG paths.</span><b>Open Vector Editor →</b></Link>
  <Link href="/studio/enhance"><span className="studio-emoji">◈</span><strong>Image Enhancer</strong><span>Brightness, contrast and saturation preview with HD upscale download.</span><b>Open Image Enhancer →</b></Link>
 </div>
 <p className="studio-note">Enhancement is traditional browser-based image processing; it does not generate new AI image details. Native AI, CDR, EPS, DXF, WMF/EMF converters are not included in this release.</p>
 </div>}
