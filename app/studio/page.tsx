import Link from 'next/link';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'8 High-Quality Image & Vector Tools',description:'Explore ToolNexa AI Vector Studio, JPG to SVG, vector format conversion, SVG editing, background removal, retouch, enhancement and photo restoration.'};
const items=[
 {href:'/studio/vector',icon:'✦',title:'Real Vector Studio',desc:'Generate editable SVG designs and open the image tracer.',tag:'Vector'},
 {href:'/studio/image-to-vector',icon:'◈',title:'Image to Vector Pro',desc:'Upload PNG, JPG or WebP and trace actual editable SVG paths.',tag:'Real SVG'},
 {href:'/studio/convert',icon:'⇄',title:'Vector Format Converter',desc:'Export SVG, vector PDF, EPS and CAD DXF outlines.',tag:'4 formats'},
 {href:'/studio/svg-editor',icon:'✎',title:'SVG Editor',desc:'Change vector shape fill, stroke and geometry.',tag:'Editable'},
 {href:'/studio/enhance',icon:'✺',title:'Image Enhancer & Upscaler',desc:'Improve colour and contrast, click Upscale Image and export actual pixels up to 8K on eligible plans.',tag:'Pro HD'},
 {href:'/studio/background-remove',icon:'▣',title:'AI Background Remover HD',desc:'On-device U²-Net AI foreground separation, plus offline solid-bg cleanup.',tag:'AI cutout'},
 {href:'/studio/retouch',icon:'◌',title:'Object Remover & Retouch',desc:'Select and heal small unwanted marks with a painting brush.',tag:'Local retouch'},
 {href:'/studio/restore',icon:'☼',title:'Photo Restore & Colorizer',desc:'Denoise, sharpen and colour-grade scanned photographs.',tag:'Photo tools'}
] as const;
export default function StudioHome(){return <main className="studio-home suite-home">
 <span className="studio-eyebrow">TOOLNEXA AI · CREATOR WORKSPACE</span>
 <h1>High-Quality Image &amp; Vector Suite <span className="suite-count">8 Tools</span></h1>
 <p>Create SVG vector paths from your own images, clean photographs, edit designs and export professional files. Free users share 3 daily runs. Starter adds 2× upscale, Pro adds 4×/4K, and Premium/Max add up to 8K.</p>
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
