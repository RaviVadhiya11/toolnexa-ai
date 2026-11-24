/** A tiny standards-conformant ZIP writer using the uncompressed STORE method.
 * No external script/CDN; output is created locally in the browser.
 * CRC-32 is required by ZIP readers, so each entry is checked before packaging. */
export async function packageImagesAsZip(files:{name:string;blob:Blob}[]):Promise<Blob>{
 const enc=new TextEncoder(),entries:BlobPart[]=[],directory:BlobPart[]=[];
 const table=new Uint32Array(256);
 for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0}
 const crc32=(arr:Uint8Array)=>{let c=0xffffffff;for(const b of arr)c=(c>>>8)^table[(c^b)&0xff];return (c^0xffffffff)>>>0};
 let offset=0,dirBytes=0;
 for(const file of files){
  const raw=new Uint8Array(await file.blob.arrayBuffer()),name=enc.encode(file.name.replaceAll('..','').replaceAll('/','-'));
  if(raw.byteLength>0xffffffff||name.byteLength>65535)throw Error('File too large for ZIP archive');
  const crc=crc32(raw);
  const head=new Uint8Array(30+name.length),h=new DataView(head.buffer);
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);
  h.setUint16(6,0x800,true);h.setUint16(8,0,true);
  h.setUint32(14,crc,true);h.setUint32(18,raw.length,true);h.setUint32(22,raw.length,true);
  h.setUint16(26,name.length,true);head.set(name,30);
  entries.push(head,file.blob);
  const cent=new Uint8Array(46+name.length),v=new DataView(cent.buffer);
  v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);
  v.setUint16(8,0x800,true);v.setUint16(10,0,true);
  v.setUint32(16,crc,true);v.setUint32(20,raw.length,true);v.setUint32(24,raw.length,true);
  v.setUint16(28,name.length,true);v.setUint32(42,offset,true);cent.set(name,46);
  directory.push(cent);dirBytes+=cent.byteLength;offset+=head.byteLength+raw.byteLength;
  if(offset>0xffffffff)throw Error('ZIP exceeds 4 GB limit');
 }
 if(files.length>65535)throw Error('Too many files for standard ZIP');
 const end=new Uint8Array(22),e=new DataView(end.buffer);
 e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);
 e.setUint16(10,files.length,true);e.setUint32(12,dirBytes,true);e.setUint32(16,offset,true);
 return new Blob([...entries,...directory,end],{type:'application/zip'});
}
