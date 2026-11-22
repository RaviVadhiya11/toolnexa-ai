/* Browser-safe, pure operations shared by all text, developer and business tools.
 * Keeping algorithms independent of React makes real output tests possible in CI.
 */
export type CaseMode='title'|'upper'|'lower'|'sentence';
export type MoneyMode='exclusive'|'inclusive';
const numberFormat=(value:number)=>value.toFixed(2);
function finite(value:number,label:string){
 if(!Number.isFinite(value))throw new Error('Enter a valid '+label);
 return value;
}
export function wordStats(text:string){
 const words=text.trim()?text.trim().split(/\s+/u).length:0;
 const characters=Array.from(text).length;
 const lines=text?text.split(/\r\n|\n|\r/).length:0;
 const sentences=text.trim()?(text.match(/[^.!?।\n]+[.!?।]*/gu)||[]).filter(x=>x.trim()).length:0;
 const readingMinutes=words/200;
 return {words,characters,lines,sentences,readingMinutes};
}
export function wordReport(text:string){
 const s=wordStats(text);
 return [
  'Words: '+s.words,
  'Characters: '+s.characters,
  'Lines: '+s.lines,
  'Sentences: '+s.sentences,
  'Estimated reading time: '+(s.words===0?'0 sec':Math.max(1,Math.ceil(s.readingMinutes*60))+' sec')
 ].join('\n');
}
export function convertCase(text:string,mode:CaseMode){
 if(!text.trim())throw new Error('Enter text first');
 switch(mode){
  case 'upper':return text.toLocaleUpperCase();
  case 'lower':return text.toLocaleLowerCase();
  case 'sentence':return text.toLocaleLowerCase().replace(/(^|[.!?।]\s+)(\p{L})/gu,(_full,prefix:string,letter:string)=>prefix+letter.toLocaleUpperCase());
  case 'title':return text.toLocaleLowerCase().replace(/(^|[^\p{L}\p{N}])(\p{L})/gu,(_full,prefix:string,letter:string)=>prefix+letter.toLocaleUpperCase());
 }
}
export function reverseText(text:string){
 if(!text)throw new Error('Enter text first');
 // Intl.Segmenter avoids splitting emoji sequences and combining characters.
 if(typeof Intl.Segmenter==='function'){
  const seg=new Intl.Segmenter(undefined,{granularity:'grapheme'});
  return Array.from(seg.segment(text),s=>s.segment).reverse().join('');
 }
 return Array.from(text).reverse().join('');
}
export function formatJson(text:string,compact=false){
 if(!text.trim())throw new Error('Enter JSON first');
 try {return JSON.stringify(JSON.parse(text),null,compact?undefined:2)}
 catch(e){throw new Error('Invalid JSON: '+(e instanceof Error?e.message:'Check syntax'))}
}
export function encodeBase64(text:string){
 if(!text)throw new Error('Enter text first');
 const bytes=new TextEncoder().encode(text);
 let raw='';
 for(const b of bytes)raw+=String.fromCharCode(b);
 return btoa(raw);
}
export function decodeBase64(text:string){
 if(!text.trim())throw new Error('Enter Base64 text first');
 try{
  const cleaned=text.replace(/\s/g,'');
  if(!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)||cleaned.length%4===1)throw Error('Invalid alphabet');
  const raw=atob(cleaned);
  return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(raw,ch=>ch.charCodeAt(0)));
 }catch{throw new Error('Invalid Base64 or unsupported UTF-8 data')}
}
export function transformUrl(text:string,decode=false){
 if(!text.trim())throw new Error('Enter a URL or text first');
 try{return decode?decodeURIComponent(text):encodeURIComponent(text)}
 catch{throw new Error('Invalid URL-encoded sequence. Check percent (%) escapes.')}
}
const AMBIGUOUS='abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PUNCTUATION='!@#$%^&*_-+';
export function securePassword(length:number,symbols=true){
 if(!Number.isInteger(length)||length<8||length>128)throw new Error('Password length must be 8–128');
 if(!globalThis.crypto?.getRandomValues)throw new Error('Secure random generator unavailable');
 const chars=AMBIGUOUS+(symbols?PUNCTUATION:'');
 const max=256-256%chars.length;
 function pick(alphabet:string){
  // Rejection sampling removes modular bias.
  for(;;){const value=new Uint8Array(1);crypto.getRandomValues(value);if(value[0]<256-256%alphabet.length)return alphabet[value[0]%alphabet.length]}
 }
 const groups=['abcdefghijkmnopqrstuvwxyz','ABCDEFGHJKLMNPQRSTUVWXYZ','23456789'];
 if(symbols)groups.push(PUNCTUATION);
 const charsOut=groups.map(pick);
 while(charsOut.length<length){
  const values=new Uint8Array(Math.min(128,(length-charsOut.length)*2));crypto.getRandomValues(values);
  for(const x of values){if(x<max&&charsOut.length<length)charsOut.push(chars[x%chars.length])}
 }
 // Secure Fisher-Yates shuffle.
 for(let i=charsOut.length-1;i>0;i--){
  const limit=256-256%(i+1);
  let draw=255;
  while(draw>=limit){const arr=new Uint8Array(1);crypto.getRandomValues(arr);draw=arr[0]}
  const j=draw%(i+1);
  [charsOut[i],charsOut[j]]=[charsOut[j],charsOut[i]];
 }
 return charsOut.join('');
}
export function gstReport(amount:number,rate:number,mode:MoneyMode){
 finite(amount,'amount');finite(rate,'GST rate');
 if(amount<0||rate<0||rate>100)throw new Error('Amount must be nonnegative and GST rate 0–100%');
 const gst=mode==='inclusive'?amount-amount/(1+rate/100):amount*rate/100;
 return 'GST: ₹'+numberFormat(gst)+'\nBase amount: ₹'+numberFormat(mode==='inclusive'?amount-gst:amount)+'\nTotal: ₹'+numberFormat(mode==='inclusive'?amount:amount+gst);
}
export function percentageReport(base:number,percent:number){
 finite(base,'base number');finite(percent,'percentage');
 return percent+'% of '+base+' = '+numberFormat(base*percent/100);
}
export function profitReport(cost:number,selling:number){
 finite(cost,'cost price');finite(selling,'selling price');
 if(cost<0)throw new Error('Cost cannot be negative');
 if(selling<=0)throw new Error('Selling price must be positive');
 const profit=selling-cost;
 return 'Profit: ₹'+numberFormat(profit)+'\nMargin: '+numberFormat(profit/selling*100)+'%\nMarkup: '+(cost>0?numberFormat(profit/cost*100)+'%':'N/A');
}
export function parsePageRanges(input:string,pageCount:number){
 if(!Number.isInteger(pageCount)||pageCount<1)throw new Error('Invalid PDF page count');
 const indexes=new Set<number>();
 if(!input.trim())throw new Error('Enter pages to extract (e.g. 1,3-5)');
 for(const part of input.split(',')){
  const match=/^(\d+)(?:\s*-\s*(\d+))?$/.exec(part.trim());
  if(!match)throw new Error('Use pages such as 1,3-5');
  const start=Number(match[1]),end=match[2]===undefined?start:Number(match[2]);
  if(start<1||end<start||end>pageCount)throw new Error('Page range is outside this '+pageCount+'-page PDF');
  for(let page=start;page<=end;page++)indexes.add(page-1);
 }
 return Array.from(indexes).sort((a,b)=>a-b);
}
