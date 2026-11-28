import Link from 'next/link';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Online Image, Vector, ZIP & Invoice Studio Tools',description:'Explore 12 ToolNexa AI Creator Studio workspaces for image enhancement, vector conversion, background removal, ZIP Maker, invoices and passport photo sizes.',alternates:{canonical:'/studio'}};
const items=[
 {href:'/studio/bill-maker',icon:'🧾',title:'Bill & Invoice Maker Studio',desc:'Create professional GST and non-GST bills with logo, signature, live A4 preview, PDF and print.',tag:'NEW · Business'},
 {href:'/studio/zip-maker',icon:'▣',title:'Advanced ZIP Maker Studio',desc:'Create professional ZIP archives from files and folders locally, with real compression, nested paths and Starter–Max limits.',tag:'NEW · Verified ZIP'},
 {href:'/studio/vector',icon:'✦',title:'Real Vector Studio',desc:'Generate editable SVG designs and open the image tracer.',tag:'Vector'},
 {href:'/studio/image-to-vector',icon:'◈',title:'Image to Vector Pro',desc:'Upload PNG, JPG or WebP and trace actual editable SVG paths.',tag:'Real SVG'},
 {href:'/studio/convert',icon:'⇄',title:'Vector Format Converter',desc:'Export SVG, vector PDF, EPS and CAD DXF outlines.',tag:'4 formats'},
 {href:'/studio/svg-editor',icon:'✎',title:'SVG Editor',desc:'Change vector shape fill, stroke and geometry.',tag:'Editable'},
 {href:'/studio/enhance',icon:'✺',title:'AI Detail Enhancer & Upscaler',desc:'Upload photos, compare Before/After, improve noise and sharpness, then upscale with optional neural AI Detail up to 8K.',tag:'Pro HD'},
 {href:'/studio/background-remove',icon:'▣',title:'AI Background Remover HD',desc:'On-device U²-Net AI foreground separation, plus offline solid-bg cleanup.',tag:'AI cutout'},
 {href:'/studio/retouch',icon:'◌',title:'Object Remover & Retouch',desc:'Select and heal small unwanted marks with a painting brush.',tag:'Local retouch'},
 {href:'/studio/restore',icon:'☼',title:'Photo Restore & Colorizer',desc:'Denoise, sharpen and colour-grade scanned photographs.',tag:'Photo tools'},
 {href:'/studio/batch',icon:'⚡',title:'Batch Pro+ ZIP Engine',desc:'Sequential local enhancement of up to 8 photos with real Premium/Max verification and ZIP export.',tag:'Premium · Max'},
 {href:'/studio/passport-social',icon:'▧',title:'AI Passport & Social Size Studio',desc:'Passport, ID and 12 social size presets, live crop, 4×6 print sheets, AI cutout and verified Pro exports.',tag:'New · Pro Print'}
] as const;
export default function StudioHome(){return <main className="studio-home suite-home">
 <span className="studio-eyebrow">NEON GLASS 3D · TOOLNEXA CREATOR STUDIO</span>
 <h1>Creative AI, Image, Vector, ZIP &amp; Billing Suite <span className="suite-count">12 Workspaces</span></h1>
 <p>Create professional invoices and SVG vector paths from your own images, clean photographs, edit designs and export professional files. Free users share 3 daily runs. Starter adds 2× upscale, Pro adds 4×/4K, and Premium/Max add up to 8K, and all paid tiers can create ZIP archives based on their plan limits.</p>
 <div className="suite-home-grid">{items.map(item=><Link href={item.href} key={item.href} className="suite-tile">
  <div className="suite-tile-art"><span>{item.icon}</span><small>{item.tag}</small></div>
  <strong>{item.title}</strong><p>{item.desc}</p><b>Open Tool →</b>
 </Link>)}</div>
 <section className="studio-panel suite-suite-note">
  <h2>Real output, clear format support</h2>
  <p>SVG, vector PDF, EPS and outline DXF export use vector geometry. EPS/DXF convert curves to polylines for compatibility. Native Adobe Illustrator .AI, CorelDRAW .CDR, WMF and EMF require independent converters and are not available yet.</p>
  <p>AI background removal downloads a small browser model on first use. Healing and Photo Restoration are conventional photo-processing tools, not generative AI person removal, scratch reconstruction, or historically accurate automatic colourization.</p>
  <Link href="/pricing" className="button">Explore Pro HD Downloads</Link>
 </section>
 </main>}
