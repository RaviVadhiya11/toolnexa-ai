/* SVG sanitizer and genuine vector PDF/EPS/DXF output. No fake .ai/.cdr wrappers. */
import {downloadFile} from '@/lib/studio-suite-client';
const NS='http://www.w3.org/2000/svg';
const tags=new Set(['svg','g','path','rect','circle','ellipse','line','polygon','polyline']);
const attrs=new Set(['viewBox','width','height','d','fill','stroke','stroke-width','fill-rule','opacity','transform','cx','cy','r','rx','ry','x','y','x1','x2','y1','y2','points','stroke-linecap','stroke-linejoin']);
export function cleanSVG(input:string){
 if(input.length>2500000)throw Error('SVG is larger than 2.5 MB.');
 const inputDoc=new DOMParser().parseFromString(input,'image/svg+xml');
 const root=inputDoc.documentElement;
 if(root.localName!=='svg'||root.namespaceURI!==NS||inputDoc.querySelector('parsererror'))throw Error('Choose a valid SVG file.');
 const output=document.implementation.createDocument(NS,'svg',null);
 function copy(source:Element,target:Element,depth:number){
  if(depth>15)throw Error('SVG groups are too deeply nested.');
  for(const attr of Array.from(source.attributes)){
   if(!attrs.has(attr.name))continue;
   const value=attr.value.trim();
   if(value.length>500000||/url\s*\(|javascript:|data:|expression\s*\(/i.test(value))continue;
   target.setAttribute(attr.name,value);
  }
  for(const child of Array.from(source.children)){
   if(!tags.has(child.localName))continue;const result=output.createElementNS(NS,child.localName);
   copy(child,result,depth+1);target.appendChild(result);
  }
 }
 copy(root,output.documentElement,0);
 const safe=output.documentElement;
 if(!safe.getAttribute('viewBox')){
  const w=Number(safe.getAttribute('width'))||800,h=Number(safe.getAttribute('height'))||800;
  safe.setAttribute('viewBox','0 0 '+Math.min(10000,w)+' '+Math.min(10000,h));
 }
 if(!safe.querySelector('path,rect,circle,ellipse,line,polygon,polyline'))throw Error('No supported vector shapes found.');
 return new XMLSerializer().serializeToString(safe);
}
function svgSize(root:Element){
 const v=root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number)||[];
 const width=Number.isFinite(v[2])&&v[2]>0?v[2]:800;
 const height=Number.isFinite(v[3])&&v[3]>0?v[3]:800;
 return {width:Math.min(10000,width),height:Math.min(10000,height),ox:v[0]||0,oy:v[1]||0};
}
function color(input:string|null){
 if(!input||input==='none')return null;
 let x=input.trim();
 if(/^#[0-9a-f]{3}$/i.test(x))x='#'+x.slice(1).split('').map(c=>c+c).join('');
 if(/^#[0-9a-f]{6}$/i.test(x))return [1,3,5].map(i=>parseInt(x.slice(i,i+2),16)/255);
 const m=/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(x);
 return m?m.slice(1,4).map(n=>Math.min(255,Number(n))/255):null;
}
type Contour={points:{x:number;y:number}[];closed:boolean;fill:number[]|null};
function contours(xml:string){
 const root=new DOMParser().parseFromString(xml,'image/svg+xml').documentElement;
 if(root.querySelector('[transform]'))throw Error('EPS/DXF export supports untransformed SVG paths. Export SVG or PDF for transformed artwork.');
 const {width,height,ox,oy}=svgSize(root);
 const output:Contour[]=[];
 for(const element of Array.from(root.querySelectorAll('path,rect,circle,ellipse,line,polygon,polyline'))){
  const fill=color(element.getAttribute('fill')||element.parentElement?.getAttribute('fill')||'#000000');
  const raw=element.localName==='path'?element.getAttribute('d')||'':null;
  // Full path geometry is approximated by dense editable line segments, not a bitmap.
  const pieces=raw?raw.replace(/([mM])/g,'|$1').split('|').filter(Boolean):[];
  if(raw&&pieces.length===0)continue;
  const shapes=raw?pieces:[null];
  for(const piece of shapes){
   const path=document.createElementNS(NS,'path');
   let d=piece||'';
   const a=(name:string)=>Number(element.getAttribute(name)||0);
   if(!piece){
    if(element.localName==='rect')d='M '+a('x')+' '+a('y')+' h '+a('width')+' v '+a('height')+' h '+(-a('width'))+' Z';
    if(element.localName==='circle'||element.localName==='ellipse'){
     const cx=a('cx'),cy=a('cy'),rx=element.localName==='circle'?a('r'):a('rx'),ry=element.localName==='circle'?a('r'):a('ry');
     d='M '+(cx+rx)+' '+cy+' A '+rx+' '+ry+' 0 1 1 '+(cx-rx)+' '+cy+' A '+rx+' '+ry+' 0 1 1 '+(cx+rx)+' '+cy+' Z';
    }
    if(element.localName==='line')d='M '+a('x1')+' '+a('y1')+' L '+a('x2')+' '+a('y2');
    if(element.localName==='polygon'||element.localName==='polyline')d='M '+(element.getAttribute('points')||'').trim().replace(/^\s+/,'').replace(/\s+/g,' L ')+(element.localName==='polygon'?' Z':'');
   }
   try{
    path.setAttribute('d',d);
    const length=path.getTotalLength();
    if(!Number.isFinite(length)||length<=0)continue;
    const steps=Math.min(350,Math.max(6,Math.ceil(length/3)));
    const points=[] as {x:number;y:number}[];
    for(let i=0;i<=steps;i++){const p=path.getPointAtLength(length*i/steps);points.push({x:p.x-ox,y:p.y-oy})}
    output.push({points,closed:/[zZ]\s*$/.test(d)||element.localName==='rect'||element.localName==='circle'||element.localName==='ellipse'||element.localName==='polygon',fill});
    if(output.length>500||output.reduce((s,v)=>s+v.points.length,0)>55000)throw Error('Too many line segments. Reduce SVG complexity.');
   }catch(e){if(e instanceof Error&&e.message.includes('Too many'))throw e;throw Error('Unsupported SVG geometry. Try exporting a simpler path-only SVG.')}
  }
 }
 if(!output.length)throw Error('No path geometry to convert.');
 return {output,width,height};
}
export async function exportVector(xml:string,format:'svg'|'pdf'|'eps'|'dxf'){
 const safe=cleanSVG(xml);
 if(format==='svg'){downloadFile(new Blob([safe],{type:'image/svg+xml'}),'toolnexa-vector.svg');return}
 if(format==='pdf'){
  const {jsPDF}=await import('jspdf');
  const {svg2pdf}=await import('svg2pdf.js');
  const doc=new DOMParser().parseFromString(safe,'image/svg+xml');
  const {width,height}=svgSize(doc.documentElement);
  const pdf=new jsPDF({orientation:width>height?'landscape':'portrait',unit:'pt',format:[width,height]});
  await svg2pdf(doc.documentElement as unknown as SVGSVGElement,pdf,{x:0,y:0,width,height});
  downloadFile(pdf.output('blob'),'toolnexa-vector.pdf');return;
 }
 const {output,width,height}=contours(safe);
 if(format==='eps'){
  const lines=['%!PS-Adobe-3.0 EPSF-3.0','%%BoundingBox: 0 0 '+Math.ceil(width)+' '+Math.ceil(height),'%%Title: ToolNexa Editable Vector','%%EndComments', 'gsave','0 '+height+' translate','1 -1 scale'];
  for(const item of output){
   if(item.fill===null)continue;
   lines.push(item.fill.map(n=>n.toFixed(4)).join(' ')+' setrgbcolor','newpath');
   item.points.forEach((p,i)=>lines.push(p.x.toFixed(3)+' '+p.y.toFixed(3)+(i===0?' moveto':' lineto')));
   if(item.closed)lines.push('closepath');lines.push('eofill');
  }
  lines.push('grestore','showpage','%%EOF');
  downloadFile(new Blob([lines.join('\n')],{type:'application/postscript'}),'toolnexa-vector.eps');return;
 }
 const lines=['0','SECTION','2','HEADER','9','$ACADVER','1','AC1015','0','ENDSEC','0','SECTION','2','ENTITIES'];
 for(const item of output){
  const points=item.closed?item.points.slice(0,-1):item.points;
  lines.push('0','LWPOLYLINE','8','ToolNexa','90',String(points.length),'70',item.closed?'1':'0');
  for(const p of points){lines.push('10',p.x.toFixed(4),'20',(height-p.y).toFixed(4))}
 }
 lines.push('0','ENDSEC','0','EOF');
 downloadFile(new Blob([lines.join('\n')],{type:'application/dxf'}),'toolnexa-outline.dxf');
}
