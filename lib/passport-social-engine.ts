/** Browser-only image/print geometry for Passport & Social Size Studio.
 * Passport presets are illustrative; official jurisdiction requirements vary.
 * 300/600 PPI describe pixel density when printed at the stated physical size.
 * Browser PNG/JPG export may not carry DPI metadata; PDF does carry a 4x6-inch page.
 */
export type PhotoMode='passport'|'social';
export type SizeUnit='mm'|'in'|'px';
export type PhotoPreset={id:string;name:string;detail:string;unit:SizeUnit;w:number;h:number};
export type PhotoAdjust={
 zoom:number;brightness:number;contrast:number;saturation:number;rotation:number;
 panX:number;panY:number;color:string;gradient:boolean;
 flipH?:boolean;flipV?:boolean;warmth?:number;
};
export const passportPresets:PhotoPreset[]=[
 {id:'35x45',name:'35 × 45 mm',detail:'Common ID example',unit:'mm',w:35,h:45},
 {id:'2x2',name:'2 × 2 inch',detail:'Square photo example',unit:'in',w:2,h:2},
 {id:'50x70',name:'50 × 70 mm',detail:'Large portrait example',unit:'mm',w:50,h:70},
 {id:'25x35',name:'25 × 35 mm',detail:'Small ID / PAN-style example',unit:'mm',w:25,h:35},
 {id:'exam',name:'Exam / Application 200 × 230',detail:'Digital application example',unit:'px',w:200,h:230},
 {id:'custom',name:'Custom size',detail:'15–150 mm',unit:'mm',w:35,h:45}
];
export const socialPresets:PhotoPreset[]=[
 {id:'igpost',name:'Instagram Post',detail:'1:1 square',unit:'px',w:1080,h:1080},
 {id:'igportrait',name:'Instagram Portrait',detail:'4:5 feed',unit:'px',w:1080,h:1350},
 {id:'story',name:'Story / Reel',detail:'9:16 vertical',unit:'px',w:1080,h:1920},
 {id:'youtube',name:'YouTube Thumbnail',detail:'16:9 video',unit:'px',w:1280,h:720},
 {id:'linkedin',name:'LinkedIn Banner',detail:'Wide cover',unit:'px',w:1584,h:396},
 {id:'profile',name:'Profile Picture',detail:'Square avatar',unit:'px',w:640,h:640},
 {id:'tiktok',name:'TikTok Video Cover',detail:'9:16 vertical',unit:'px',w:1080,h:1920},
 {id:'pinterest',name:'Pinterest Pin',detail:'2:3 vertical',unit:'px',w:1000,h:1500},
 {id:'facebook',name:'Facebook Cover',detail:'Wide cover example',unit:'px',w:820,h:312},
 {id:'xheader',name:'X / Twitter Header',detail:'3:1 banner',unit:'px',w:1500,h:500},
 {id:'youtubeavatar',name:'YouTube Avatar',detail:'Square icon',unit:'px',w:800,h:800},
 {id:'whatsapp',name:'WhatsApp Display Photo',detail:'Square profile crop',unit:'px',w:800,h:800},
 {id:'linkedinprofile',name:'LinkedIn Profile Photo',detail:'Square profile crop',unit:'px',w:800,h:800},
 {id:'custom-social',name:'Custom pixels',detail:'320–4096 px',unit:'px',w:1080,h:1080}
];
export const defaultAdjust:PhotoAdjust={zoom:100,brightness:100,contrast:100,saturation:100,
 rotation:0,panX:0,panY:0,color:'#ffffff',gradient:false,flipH:false,flipV:false,warmth:0};
const safe=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function outputPixels(preset:PhotoPreset,ppi=300){
 if(!Number.isFinite(ppi)||ppi<72||ppi>600)throw Error('Unsupported print density');
 const {unit,w,h}=preset;
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)throw Error('Invalid size');
 if(unit==='mm'&&(w<15||h<15||w>150||h>150))throw Error('Custom passport size must be 15–150 mm');
 if(unit==='px'&&(w<128||h<128||w>4096||h>4096))throw Error('Social size must be 128–4096 pixels');
 const ratio=unit==='mm'?ppi/25.4:unit==='in'?ppi:1;
 return {width:Math.round(w*ratio),height:Math.round(h*ratio)};
}
export function printSheetGrid(photoWidth:number,photoHeight:number,ppi=300){
 const width=4*ppi,height=6*ppi;
 const margin=Math.round(.13*ppi),gap=Math.round(.07*ppi);
 const columns=Math.floor((width-2*margin+gap)/(photoWidth+gap));
 const rows=Math.floor((height-2*margin+gap)/(photoHeight+gap));
 if(columns<1||rows<1)return {width,height,columns:0,rows:0,count:0,margin,gap};
 return {width,height,columns,rows,count:columns*rows,margin,gap};
}
export function renderPhoto(
 ctx:CanvasRenderingContext2D,src:CanvasImageSource,srcWidth:number,srcHeight:number,
 width:number,height:number,adjust:PhotoAdjust,mode:PhotoMode,withCutout:boolean
){
 if(!width||!height||!srcWidth||!srcHeight)throw Error('Invalid source or export dimensions');
 ctx.clearRect(0,0,width,height);
 if(mode==='social'&&adjust.gradient){
  const grad=ctx.createLinearGradient(0,0,width,height);
  grad.addColorStop(0,adjust.color);grad.addColorStop(1,'#20263b');
  ctx.fillStyle=grad;
 }else ctx.fillStyle=adjust.color;
 ctx.fillRect(0,0,width,height);
 const zoom=safe(adjust.zoom,100,260)/100;
 const scale=Math.max(width/srcWidth,height/srcHeight)*zoom;
 const iw=srcWidth*scale,ih=srcHeight*scale;
 const x=(width-iw)/2+safe(adjust.panX,-100,100)/100*Math.max(0,iw-width)/2;
 const y=(height-ih)/2+safe(adjust.panY,-100,100)/100*Math.max(0,ih-height)/2;
 ctx.save();
 ctx.translate(width/2,height/2);
 ctx.rotate(safe(adjust.rotation,-45,45)*Math.PI/180);
 ctx.scale(adjust.flipH?-1:1,adjust.flipV?-1:1);
 ctx.translate(-width/2,-height/2);
 ctx.filter='brightness('+safe(adjust.brightness,60,150)+'%) contrast('+safe(adjust.contrast,60,160)+
  '%) saturate('+safe(adjust.saturation,0,200)+'%)';
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality='high';
 ctx.drawImage(src,x,y,iw,ih);
 ctx.restore();
 if(adjust.warmth){
  ctx.save();ctx.globalCompositeOperation='soft-light';
  ctx.fillStyle=adjust.warmth>0?'rgba(255,150,66,'+(Math.min(40,adjust.warmth)/100)+')':'rgba(72,153,255,'+(Math.min(40,-adjust.warmth)/100)+')';
  ctx.fillRect(0,0,width,height);ctx.restore();
 }
 // The color backdrop becomes visible under genuine transparent cutout edges;
 // a solid original photo is never represented as if AI cutout succeeded.
 void withCutout;
}
export function renderPhotoCanvas(src:CanvasImageSource,sw:number,sh:number,w:number,h:number,
 adjust:PhotoAdjust,mode:PhotoMode,cutout:boolean){
 if(w*h>32000000)throw Error('Output exceeds the supported 32-million-pixel canvas. Choose a smaller size.');
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas is unavailable');
 renderPhoto(ctx,src,sw,sh,w,h,adjust,mode,cutout);
 return canvas;
}
export function renderSheet(src:CanvasImageSource,sw:number,sh:number,
 tileWidth:number,tileHeight:number,adjust:PhotoAdjust,ppi=300){
 const layout=printSheetGrid(tileWidth,tileHeight,ppi);
 if(layout.count<1)throw Error('This photo size does not physically fit a 4 × 6 inch sheet at '+ppi+' PPI.');
 if(layout.width*layout.height>32000000)throw Error('Print sheet exceeds device canvas limit.');
 const sheet=document.createElement('canvas');sheet.width=layout.width;sheet.height=layout.height;
 const ctx=sheet.getContext('2d');if(!ctx)throw Error('Print sheet canvas unavailable');
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,sheet.width,sheet.height);
 // Generate each tile at its intended physical pixel dimensions; no hidden
 // resize-to-fit of oversized passport photos, which would spoil print scale.
 const tile=renderPhotoCanvas(src,sw,sh,tileWidth,tileHeight,{...adjust,gradient:false},'passport',true);
 const allWidth=layout.columns*tileWidth+(layout.columns-1)*layout.gap;
 const allHeight=layout.rows*tileHeight+(layout.rows-1)*layout.gap;
 const x0=(sheet.width-allWidth)/2,y0=(sheet.height-allHeight)/2;
 for(let row=0;row<layout.rows;row++)for(let col=0;col<layout.columns;col++){
  const x=x0+col*(tileWidth+layout.gap),y=y0+row*(tileHeight+layout.gap);
  ctx.drawImage(tile,x,y,tileWidth,tileHeight);
  ctx.strokeStyle='#aeb9c7';ctx.lineWidth=Math.max(1,ppi/300);
  ctx.strokeRect(x+.5,y+.5,tileWidth-1,tileHeight-1);
 }
 tile.width=0;tile.height=0;
 return {canvas:sheet,count:layout.count};
}
export function demoPassportCanvas(){
 // Identifiably illustrative sample; never imply this image is a real person's photo.
 const c=document.createElement('canvas');c.width=750;c.height=1000;
 const x=c.getContext('2d');if(!x)throw Error('Cannot render demo illustration');
 const back=x.createLinearGradient(0,0,750,1000);back.addColorStop(0,'#d8ddec');back.addColorStop(1,'#a4c1d6');
 x.fillStyle=back;x.fillRect(0,0,750,1000);
 x.fillStyle='#2e4569';x.beginPath();x.ellipse(375,1015,377,355,0,0,Math.PI*2);x.fill();
 x.fillStyle='#ffffff';x.beginPath();x.moveTo(280,705);x.lineTo(375,905);x.lineTo(468,705);x.fill();
 x.fillStyle='#d6a68a';x.fillRect(335,600,80,130);
 x.fillStyle='#d6a286';x.beginPath();x.ellipse(375,417,178,221,0,0,Math.PI*2);x.fill();
 x.fillStyle='#282c3b';x.beginPath();x.ellipse(375,251,197,117,0,Math.PI,Math.PI*2);x.fill();
 x.beginPath();x.ellipse(230,345,43,118,-.1,0,Math.PI*2);x.fill();
 x.beginPath();x.ellipse(520,345,43,118,.1,0,Math.PI*2);x.fill();
 x.fillStyle='#303343';x.beginPath();x.ellipse(303,415,12,7,0,0,Math.PI*2);x.ellipse(447,415,12,7,0,0,Math.PI*2);x.fill();
 x.strokeStyle='#a77363';x.lineWidth=5;x.beginPath();x.moveTo(330,555);x.quadraticCurveTo(375,581,420,555);x.stroke();
 x.fillStyle='#152037bb';x.fillRect(0,949,750,51);x.fillStyle='#ffffff';x.font='bold 23px sans-serif';
 x.textAlign='center';x.fillText('DEMO ILLUSTRATION · NOT A REAL PHOTO',375,982);
 return c;
}
