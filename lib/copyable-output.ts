/** Copy individual, meaningful plain-text results; skip structured source code. */
const structured=new Set([
 'json-formatter','csv-to-json','html-formatter','css-minifier',
 'javascript-minifier','sql-formatter','jwt-decoder','base64-encoder',
 'url-encoder','image-to-base64'
]);
export type CopyRow={display:string;copyValue:string};
export function extractCopyableRows(output:string,slug:string):CopyRow[]{
 if(!output||output.length>24000||structured.has(slug))return [];
 const raw=output.split(/\r?\n/u).map(s=>s.trim()).filter(Boolean);
 if(raw.length<2||raw.length>60||raw.some(line=>line.length>800))return [];
 if(/^[\[{]/u.test(raw[0])&&slug!=='json-to-csv')return [];
 return raw.map(line=>{
  // Labelled output like "SHA-256: <digest>" should copy the value, not the label.
  const labelled=/^([A-Za-z][A-Za-z0-9 /_()-]{1,50}):\s+(.+)$/u.exec(line);
  return {display:line,copyValue:labelled?.[2]||line};
 });
}
