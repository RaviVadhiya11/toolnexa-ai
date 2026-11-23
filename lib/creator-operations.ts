/** High-quality, local-only creator and developer utilities. No external API calls. */
const MAX_TEXT=1_000_000;
const csvCell=(value:string,fromString:boolean):string=>{
  // Spreadsheet apps interpret leading =,+,-,@ as formulas. Protect string data.
  const safe=fromString&&/^[\s]*[=+\-@]/u.test(value)?"'"+value:value;
  return /[",\r\n]/u.test(safe)?'"'+safe.replace(/"/g,'""')+'"':safe;
};
type Scalar=string|number|boolean|null;
function flattenRow(value:Record<string,unknown>,out:Map<string,Scalar>,prefix='',depth=0):void{
 if(depth>6)throw Error('Nested JSON exceeds the supported 6-level depth.');
 for(const [key,entry] of Object.entries(value)){
  const path=prefix?prefix+'.'+key:key;
  if(path.length>180)throw Error('A JSON field name is too long.');
  if(entry!==null&&typeof entry==='object'&&!Array.isArray(entry)){
   flattenRow(entry as Record<string,unknown>,out,path,depth+1);
  }else if(typeof entry==='string'||typeof entry==='number'||typeof entry==='boolean'||entry===null){
   out.set(path,entry);
  }else if(Array.isArray(entry)){
   out.set(path,JSON.stringify(entry));
  }else throw Error('Unsupported JSON value in '+path);
 }
}
export function jsonToCsv(input:string):string{
 if(input.length>MAX_TEXT)throw Error('JSON input must be at most 1,000,000 characters.');
 let parsed:unknown;
 try{parsed=JSON.parse(input)}catch{throw Error('Enter valid JSON containing an array of objects.')}
 if(!Array.isArray(parsed)||!parsed.length)throw Error('Provide a nonempty JSON array of objects.');
 if(parsed.length>5000)throw Error('Maximum 5,000 JSON records.');
 const rows:Map<string,Scalar>[]=[];
 const headings=new Set<string>();
 for(const [i,record] of parsed.entries()){
  if(record===null||typeof record!=='object'||Array.isArray(record))
   throw Error('Row '+(i+1)+' must be a JSON object.');
  const row=new Map<string,Scalar>();
  flattenRow(record as Record<string,unknown>,row);
  for(const key of row.keys())headings.add(key);
  rows.push(row);
 }
 const keys=[...headings];
 if(!keys.length||keys.length>100)throw Error('JSON must have 1–100 unique fields.');
 const output=[keys.map(h=>csvCell(h,true)).join(',')];
 for(const row of rows){
  output.push(keys.map(k=>{
   const v=row.get(k);
   return v===null||v===undefined?'':csvCell(String(v),typeof v==='string');
  }).join(','));
 }
 const csv=output.join('\r\n')+'\r\n';
 if(csv.length>3_000_000)throw Error('Output would exceed 3,000,000 characters.');
 return csv;
}
function parseSafeUrl(input:string,label:string):URL{
 if(!input.trim()||input.length>2048)throw Error(label+' must be a valid HTTP(S) URL under 2,048 characters.');
 let url:URL;
 try{url=new URL(input.trim())}catch{throw Error(label+' must be a complete URL starting with https:// or http://.')}
 if(!['https:','http:'].includes(url.protocol)||!url.hostname||url.username||url.password)
  throw Error(label+' must be an HTTP(S) URL without embedded credentials.');
 return url;
}
function campaignPart(value:string,label:string,required:boolean):string{
 const s=value.trim();
 if((required&&!s)||s.length>120||/[\u0000-\u001f\u007f]/u.test(s))
  throw Error(label+' must '+(required?'contain 1–120':'contain up to 120')+' printable characters.');
 return s;
}
export function buildUtmUrl(destination:string,source:string,medium:string,campaign:string,term='',content=''):string{
 const url=parseSafeUrl(destination,'Destination');
 const data:{name:string;value:string;required:boolean}[]=[
  {name:'utm_source',value:source,required:true},
  {name:'utm_medium',value:medium,required:true},
  {name:'utm_campaign',value:campaign,required:true},
  {name:'utm_term',value:term,required:false},
  {name:'utm_content',value:content,required:false}
 ];
 for(const item of data){
  const v=campaignPart(item.value,item.name,item.required);
  if(v)url.searchParams.set(item.name,v);
  else url.searchParams.delete(item.name);
 }
 const result=url.toString();
 if(result.length>3000)throw Error('Generated campaign URL is too long.');
 return result;
}
const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
export function makeSeoMetaTags(canonical:string,title:string,description:string,imageUrl=''):string{
 const url=parseSafeUrl(canonical,'Canonical URL');
 const heading=title.trim(),desc=description.trim();
 if(heading.length<3||heading.length>100)throw Error('Page title must be 3–100 characters.');
 if(desc.length<10||desc.length>300)throw Error('Meta description must be 10–300 characters.');
 const img=imageUrl.trim()?parseSafeUrl(imageUrl,'Social preview image').toString():'';
 const urlValue=escapeHtml(url.toString()),titleValue=escapeHtml(heading),descValue=escapeHtml(desc);
 const items=[
  '<title>'+titleValue+'</title>',
  '<meta name="description" content="'+descValue+'">',
  '<link rel="canonical" href="'+urlValue+'">',
  '<meta property="og:type" content="website">',
  '<meta property="og:url" content="'+urlValue+'">',
  '<meta property="og:title" content="'+titleValue+'">',
  '<meta property="og:description" content="'+descValue+'">',
  '<meta name="twitter:card" content="'+(img?'summary_large_image':'summary')+'">',
  '<meta name="twitter:title" content="'+titleValue+'">',
  '<meta name="twitter:description" content="'+descValue+'">'
 ];
 if(img){
  const image=escapeHtml(img);
  items.push('<meta property="og:image" content="'+image+'">');
  items.push('<meta name="twitter:image" content="'+image+'">');
 }
 const tips:string[]=[];
 if(heading.length>60)tips.push('Title is over 60 characters; search results may truncate it.');
 if(desc.length>160)tips.push('Description is over 160 characters; search results may truncate it.');
 return items.join('\n')+(tips.length?'\n\n'+tips.map(x=>'<!-- '+x+' -->').join('\n'):'');
}
export async function fileChecksum(file:Blob,algorithm:'SHA-256'|'SHA-512'='SHA-256'):Promise<string>{
 if(file.size===0||file.size>25*1024*1024)throw Error('Choose a nonempty file of at most 25 MB.');
 if(!globalThis.crypto?.subtle)throw Error('Secure hashing is unavailable in this browser. Use HTTPS.');
 const bytes=await file.arrayBuffer();
 const hash=await crypto.subtle.digest(algorithm,bytes);
 return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function hashVerification(actual:string,expected:string):string{
 const supplied=expected.trim().toLowerCase().replace(/\s+/gu,'');
 if(!supplied)return 'No expected checksum supplied.';
 if(!/^[a-f0-9]{64}$|^[a-f0-9]{128}$/u.test(supplied))
  throw Error('Expected checksum must be 64 (SHA-256) or 128 (SHA-512) hex characters.');
 if(supplied.length!==actual.length)throw Error('Expected checksum length does not match the chosen algorithm.');
 return supplied===actual?'MATCH — file checksum verified':'MISMATCH — file differs from the expected checksum';
}
