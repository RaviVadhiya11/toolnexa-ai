export type OutputResult={text:string;filename?:string};
const round=(n:number,p=2)=>Number(n.toFixed(p));
export function parseYoutubeId(input:string):string{
 const raw=input.trim();
 if(/^[a-zA-Z0-9_-]{11}$/.test(raw))return raw;
 let u:URL;try{u=new URL(raw)}catch{throw Error('Paste a valid YouTube video link or 11-character ID.')}
 const host=u.hostname.toLowerCase();
 if(host==='youtu.be'||host==='www.youtu.be'){
  const id=u.pathname.split('/')[1]||'';
  if(/^[a-zA-Z0-9_-]{11}$/.test(id))return id;
 }else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)){
  const parts=u.pathname.split('/').filter(Boolean);
  const id=parts[0]==='watch'?u.searchParams.get('v'):(['shorts','live','embed','v'].includes(parts[0])?parts[1]:null);
  if(id&&/^[a-zA-Z0-9_-]{11}$/.test(id))return id;
 }
 throw Error('Only YouTube video, Shorts, live or youtu.be links are supported.');
}
export function csvToJson(input:string):string{
 if(input.length>1_000_000)throw Error('CSV must be 1 MB or less.');
 const rows:string[][]=[];let row:string[]=[],field='',quoted=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(quoted){
   if(c==='"'&&input[i+1]==='"'){field+='"';i++}
   else if(c==='"')quoted=false;
   else field+=c;
  }else if(c==='"'&&field==='')quoted=true;
  else if(c===','){row.push(field);field=''}
  else if(c==='\n'||c==='\r'){
   if(c==='\r'&&input[i+1]==='\n')i++;
   row.push(field);field='';
   if(row.some(x=>x.trim()))rows.push(row);
   row=[];
  }else if(c==='"')throw Error('Unescaped quote in CSV field.');
  else field+=c;
 }
 if(quoted)throw Error('Unclosed quoted CSV field.');
 row.push(field);if(row.some(x=>x.trim()))rows.push(row);
 if(rows.length<2)throw Error('Provide a header row and at least one data row.');
 if(rows.length>5000)throw Error('Maximum 5,000 CSV rows.');
 const headers=rows[0].map(x=>x.trim());
 if(headers.some(x=>!x)||new Set(headers).size!==headers.length)throw Error('CSV headers must be non-empty and unique.');
 const records=rows.slice(1).map((fields,i)=>{
  if(fields.length!==headers.length)throw Error('CSV row '+(i+2)+' has '+fields.length+' values; expected '+headers.length+'.');
  return Object.fromEntries(headers.map((h,j)=>[h,fields[j]]));
 });
 return JSON.stringify(records,null,2);
}
export function colorConvert(value:string):string{
 const v=value.trim();let r:number,g:number,b:number;
 const h=/^#?([a-f\d]{3}|[a-f\d]{6})$/i.exec(v);
 if(h){let code=h[1];if(code.length===3)code=code.split('').map(x=>x+x).join('');r=parseInt(code.slice(0,2),16);g=parseInt(code.slice(2,4),16);b=parseInt(code.slice(4,6),16)}
 else{
  const m=/^(?:rgb\s*\()?\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)?$/i.exec(v);
  if(!m)throw Error('Enter a HEX code (#33AABB) or RGB (51, 170, 187).');
  [r,g,b]=m.slice(1).map(Number);
 }
 if([r,g,b].some(x=>x<0||x>255))throw Error('RGB values must be between 0 and 255.');
 return 'HEX: #'+[r,g,b].map(x=>x.toString(16).padStart(2,'0').toUpperCase()).join('')+'\nRGB: rgb('+r+', '+g+', '+b+')';
}
export function emiReport(principal:number,annualRate:number,months:number):string{
 if(!Number.isFinite(principal)||principal<=0||principal>1e12||!Number.isFinite(annualRate)||annualRate<0||annualRate>100||!Number.isInteger(months)||months<1||months>600)throw Error('Enter a positive loan, 0–100% yearly interest and 1–600 months.');
 const rate=annualRate/1200;
 const emi=rate===0?principal/months:principal*rate*Math.pow(1+rate,months)/(Math.pow(1+rate,months)-1);
 const total=emi*months;
 return 'Loan: '+round(principal).toLocaleString('en-IN')+'\nMonthly EMI: '+round(emi).toLocaleString('en-IN')+'\nInterest: '+round(total-principal).toLocaleString('en-IN')+'\nTotal repayment: '+round(total).toLocaleString('en-IN')+'\nTerm: '+months+' months';
}
function dateUTC(value:string):Date{
 const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(value.trim());
 if(!m)throw Error('Use the YYYY-MM-DD date format.');
 const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));
 if(d.getUTCFullYear()!==+m[1]||d.getUTCMonth()!==+m[2]-1||d.getUTCDate()!==+m[3])throw Error('Invalid calendar date.');
 return d;
}
export function ageReport(birth:string,asOf:string):string{
 const b=dateUTC(birth),t=dateUTC(asOf);
 if(b>t)throw Error('Birth date must not be in the future.');
 let y=t.getUTCFullYear()-b.getUTCFullYear(),m=t.getUTCMonth()-b.getUTCMonth(),d=t.getUTCDate()-b.getUTCDate();
 if(d<0){m--;d+=new Date(Date.UTC(t.getUTCFullYear(),t.getUTCMonth(),0)).getUTCDate()}
 if(m<0){y--;m+=12}
 return y+' years, '+m+' months, '+d+' days\nTotal days: '+Math.round((t.getTime()-b.getTime())/86400000).toLocaleString('en-IN');
}
export function dateDifferenceReport(a:string,b:string):string{
 const ms=Math.abs(dateUTC(a).getTime()-dateUTC(b).getTime()),days=ms/86400000;
 return 'Difference: '+days+' days\nWeeks: '+Math.floor(days/7)+' weeks, '+days%7+' days\nHours: '+(days*24).toLocaleString('en-IN');
}
export function timestampReport(value:string):string{
 const s=value.trim();
 if(!s)throw Error('Enter a Unix timestamp or an ISO date string.');
 const numeric=/^-?\d{1,16}$/.test(s);
 let d:Date;
 if(numeric){const n=Number(s);d=new Date(s.replace('-','').length>10?n:n*1000)}
 else d=new Date(s);
 if(!Number.isFinite(d.getTime()))throw Error('Invalid timestamp or date.');
 return 'UTC ISO: '+d.toISOString()+'\nUnix seconds: '+Math.floor(d.getTime()/1000)+'\nUnix milliseconds: '+d.getTime()+'\nLocal: '+d.toLocaleString();
}
export function textSort(input:string,dedupe:boolean):string{
 if(input.length>400_000)throw Error('Maximum 400,000 characters.');
 const lines=input.split(/\r?\n/).filter(x=>x.trim());
 const selected=dedupe?[...new Set(lines)]:lines;
 return selected.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'})).join('\n');
}
export function textDiff(a:string,b:string):string{
 const left=a.split(/\r?\n/),right=b.split(/\r?\n/);
 if(left.length>250||right.length>250)throw Error('Each side supports up to 250 lines.');
 const dp=Array.from({length:left.length+1},()=>new Uint16Array(right.length+1));
 for(let i=left.length-1;i>=0;i--)for(let j=right.length-1;j>=0;j--)
  dp[i][j]=left[i]===right[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const out:string[]=[];let i=0,j=0,removed=0,added=0;
 while(i<left.length||j<right.length){
  if(i<left.length&&j<right.length&&left[i]===right[j]){out.push('  '+left[i]);i++;j++}
  else if(j<right.length&&(i===left.length||dp[i][j+1]>=dp[i+1][j])){out.push('+ '+right[j++]);added++}
  else{out.push('- '+left[i++]);removed++}
 }
 return 'Added: '+added+' lines | Removed: '+removed+' lines\n\n'+out.join('\n');
}
export function jwtReport(token:string):string{
 const parts=token.trim().split('.');
 if(parts.length!==3||parts.some(x=>!/^[A-Za-z0-9_-]*$/.test(x)))throw Error('Expected three Base64URL-encoded JWT segments.');
 const decode=(v:string)=>JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4)),c=>c.charCodeAt(0))));
 const header=decode(parts[0]),payload=decode(parts[1]);
 const now=Math.floor(Date.now()/1000);
 return 'HEADER\n'+JSON.stringify(header,null,2)+'\n\nPAYLOAD\n'+JSON.stringify(payload,null,2)+'\n\nExpiry: '+(typeof payload.exp==='number'?(payload.exp<now?'Expired':'Not yet expired')+' ('+new Date(payload.exp*1000).toISOString()+')':'Not supplied')+'\n\n⚠ The signature is NOT verified. Do not trust this token for authentication.';
}
export function regexReport(input:string,pattern:string,flags:string):string{
 if(pattern.length>500||input.length>15000)throw Error('Maximum 500 pattern characters and 15,000 test characters.');
 if(!/^[gimsuyd]*$/.test(flags)||new Set(flags).size!==flags.length)throw Error('Invalid or duplicate regex flags.');
 const start=performance.now(),reg=new RegExp(pattern,flags.includes('g')?flags:flags+'g'),found:string[]=[];
 let m:RegExpExecArray|null;
 while((m=reg.exec(input))!==null){
  found.push('Match '+(found.length+1)+' @ '+m.index+': '+JSON.stringify(m[0])+(m.length>1?' | Groups: '+JSON.stringify(m.slice(1)):''));
  if(found.length>=100){found.push('Stopped after 100 matches.');break}
  if(m[0]==='')reg.lastIndex++;
  if(performance.now()-start>150){found.push('Stopped after 150ms. Simplify your pattern.');break}
 }
 return found.length?found.join('\n'):'No matches.';
}
export function socialSuggestions(topic:string,platform:string,tone:string):string{
 const t=topic.trim().replace(/\s+/g,' ');
 if(t.length<3||t.length>300)throw Error('Enter a topic of 3–300 characters.');
 const clean=t.replace(/[<>#]/g,'');
 const prefix=tone==='fun'?'Fun take on':tone==='professional'?'A practical guide to':'Discover';
 const titles=[
  clean+' — Everything You Need to Know',
  '5 Smart Tips for '+clean,
  'How to Get Better at '+clean,
  clean+': A Simple Step-by-Step Guide',
  'Why Everyone Is Talking About '+clean,
  prefix+' '+clean+' in 60 Seconds'
 ];
 const keywords=clean.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
 const tags=[platform.toLowerCase().replace(/\W/g,''),'creator','tips','guide','learn',...keywords.filter(x=>x.length>2).slice(0,10)];
 const unique=[...new Set(tags.map(w=>'#'+w.replace(/[^\p{L}\p{N}]/gu,'')))].filter(x=>x.length>1);
 return 'SMART OFFLINE SUGGESTIONS (not generated by an AI model)\n\nTITLES\n'+titles.map((s,i)=>(i+1)+'. '+s).join('\n')+'\n\nHASHTAGS\n'+unique.slice(0,15).join(' ')+'\n\nTIP\nReview relevance and avoid misleading claims before posting.';
}
export function cssMinify(input:string):string{
 if(!input.trim())throw Error('Enter CSS first.');
 if(input.length>500_000)throw Error('Maximum 500,000 characters.');
 let out='',quote='',comment=false,space=false;
 for(let i=0;i<input.length;i++){
  const c=input[i],n=input[i+1];
  if(comment){if(c==='*'&&n==='/'){comment=false;i++}continue}
  if(quote){out+=c;if(c==='\\'){out+=input[++i]||''}else if(c===quote)quote='';continue}
  if(c==='/'&&n==='*'){comment=true;i++;continue}
  if(c==='"'||c==="'"){if(space&&!/[{:;,>+~(]/.test(out.slice(-1)))out+=' ';space=false;quote=c;out+=c;continue}
  if(/\s/.test(c)){space=true;continue}
  if(space&&/[a-zA-Z0-9_\-#.)]/.test(c)&&/[a-zA-Z0-9_\-#.)]/.test(out.slice(-1)))out+=' ';
  space=false;
  if(/[{}:;,>+~]/.test(c)){out=out.replace(/\s+$/,'');out+=c}
  else out+=c;
 }
 if(quote||comment)throw Error('Unclosed CSS string or comment.');
 return out.replace(/;}/g,'}');
}
