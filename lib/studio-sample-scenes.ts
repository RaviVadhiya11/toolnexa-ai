/** Locally generated illustrative sample scenes for trying Studio Enhance V4.
 * These are procedural demo illustrations, not photographic AI outputs. */
export type StudioSample='mountain'|'product'|'vintage';
export async function studioSampleFile(kind:StudioSample):Promise<File>{
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=800;
 const ctx=canvas.getContext('2d');
 if(!ctx)throw Error('Sample illustration cannot be created on this device.');
 const fill=(top:string,bottom:string)=>{
  const g=ctx.createLinearGradient(0,0,0,800);
  g.addColorStop(0,top);g.addColorStop(1,bottom);ctx.fillStyle=g;ctx.fillRect(0,0,1200,800);
 };
 if(kind==='mountain'){
  fill('#222d53','#ca7587');
  const sun=ctx.createRadialGradient(730,285,25,730,285,265);
  sun.addColorStop(0,'#fff2d0');sun.addColorStop(.26,'#f5bd9c');sun.addColorStop(1,'#f5bd9c00');
  ctx.fillStyle=sun;ctx.fillRect(450,0,600,590);
  ctx.fillStyle='#63618a';ctx.beginPath();ctx.moveTo(0,550);
  for(const [x,y] of [[130,370],[280,510],[430,280],[670,525],[910,330],[1200,510]])ctx.lineTo(x,y);
  ctx.lineTo(1200,800);ctx.lineTo(0,800);ctx.fill();
  ctx.fillStyle='#33354e';ctx.beginPath();ctx.moveTo(0,690);
  for(const [x,y] of [[180,540],[320,630],[580,480],[810,650],[1040,540],[1200,650]])ctx.lineTo(x,y);
  ctx.lineTo(1200,800);ctx.lineTo(0,800);ctx.fill();
  const water=ctx.createLinearGradient(0,550,0,800);
  water.addColorStop(0,'#9a7087');water.addColorStop(1,'#222b4a');
  ctx.fillStyle=water;ctx.fillRect(0,675,1200,125);
 }else if(kind==='product'){
  fill('#0d1926','#3a3649');
  const g=ctx.createRadialGradient(630,350,40,630,350,480);
  g.addColorStop(0,'#8796a3');g.addColorStop(.6,'#3f455b');g.addColorStop(1,'#121725');
  ctx.fillStyle=g;ctx.fillRect(0,0,1200,800);
  ctx.fillStyle='#545564';ctx.beginPath();ctx.ellipse(600,686,380,78,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#1b2232';ctx.fillRect(400,646,400,105);
  ctx.fillStyle='#131e30';ctx.beginPath();ctx.roundRect(515,205,170,443,28);ctx.fill();
  ctx.fillStyle='#27394b';ctx.fillRect(560,137,80,94);
  ctx.fillStyle='#96dbd8';ctx.beginPath();ctx.roundRect(535,345,130,135,8);ctx.fill();
  ctx.fillStyle='#25414d';ctx.font='bold 26px sans-serif';ctx.textAlign='center';ctx.fillText('STUDIO',600,412);
  ctx.fillStyle='#dae8e7';ctx.fillRect(555,372,90,2);
 }else{
  fill('#bba68b','#6f5d57');
  ctx.fillStyle='#cabb9e';ctx.fillRect(85,70,1030,660);
  ctx.fillStyle='#a59680';ctx.beginPath();ctx.arc(800,280,120,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#776d60';ctx.beginPath();ctx.moveTo(150,650);ctx.lineTo(375,355);ctx.lineTo(540,540);
  ctx.lineTo(715,280);ctx.lineTo(1030,650);ctx.closePath();ctx.fill();
  ctx.fillStyle='#544a46';ctx.fillRect(150,650,880,30);
  for(let i=0;i<34;i++){ctx.fillStyle='#4b42362c';ctx.fillRect(100+i*29,95+(i*17)%555,1,22+(i%3)*12)}
 }
 const fade=ctx.createLinearGradient(0,0,0,800);fade.addColorStop(0,'#ffffff16');fade.addColorStop(1,'#00000028');
 ctx.fillStyle=fade;ctx.fillRect(0,0,1200,800);
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not prepare demo sample')),'image/png'));
 canvas.width=0;canvas.height=0;
 return new File([blob],'toolnexa-sample-'+kind+'.png',{type:'image/png'});
}
