'use client';
import {useEffect,useState} from 'react';
import {FileText,Image as ImageIcon,Files} from 'lucide-react';

function readableBytes(bytes:number){
 if(bytes<1024)return bytes+' B';
 if(bytes<1024*1024)return (bytes/1024).toFixed(1)+' KB';
 return (bytes/1024/1024).toFixed(2)+' MB';
}
/** Shared preview: images display locally; PDF and other files show honest metadata.
 * Object URLs are revoked when the uploaded files change or the tool unmounts. */
export function ToolUploadPreview({files}:{files:File[]}){
 const [urls,setUrls]=useState<string[]>([]);
 useEffect(()=>{
  const links=files.slice(0,4).map(file=>file.type.startsWith('image/')?URL.createObjectURL(file):'');
  setUrls(links);
  return()=>links.forEach(url=>{if(url)URL.revokeObjectURL(url)});
 },[files]);
 if(!files.length)return null;
 return <div className="tool-upload-previews" role="group" aria-label="Local file previews">
  {files.slice(0,4).map((file,i)=><div className="tool-upload-preview" key={i}>
   <span className="tool-upload-preview-art" aria-hidden="true">
    {urls[i]?<img src={urls[i]} alt=""/>:
     file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')?
     <FileText size={28}/>:file.type.startsWith('image/')?<ImageIcon size={28}/>:<Files size={28}/>}
   </span>
   <span className="tool-upload-preview-details">
    <strong title={file.name}>{file.name}</strong>
    <small>{readableBytes(file.size)} · {file.type==='application/pdf'?'PDF document':
     file.type.startsWith('image/')?'Image preview from your device':'Local file'}</small>
    <span>{urls[i]?'✓ Image ready to process':'✓ File selected'}</span>
   </span>
  </div>)}
  {files.length>4&&<p className="small-note">+{files.length-4} more local files selected</p>}
 </div>;
}
