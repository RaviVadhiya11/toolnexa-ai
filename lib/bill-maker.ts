export type BillItem={description:string;hsn:string;quantity:string;rate:string;discount:string;tax:string};
export type TaxMode='none'|'split'|'igst';
export const newItem=():BillItem=>({description:'',hsn:'',quantity:'1',rate:'0',discount:'0',tax:'0'});
const num=(v:string,max:number)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(0,n)):0};
const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export function billTotals(items:BillItem[],mode:TaxMode,paid:string){
 const lines=items.map(item=>{
  const quantity=num(item.quantity,100000),rate=num(item.rate,10000000),discountRate=num(item.discount,100),taxRate=mode==='none'?0:num(item.tax,100);
  const gross=round(quantity*rate),discount=round(gross*discountRate/100),net=round(gross-discount);
  const tax=round(net*taxRate/100),cgst=mode==='split'?round(tax/2):0,sgst=mode==='split'?round(tax-cgst):0,igst=mode==='igst'?tax:0;
  return {gross,discount,net,tax,cgst,sgst,igst,total:round(net+tax)};
 });
 const sum=(key:keyof typeof lines[number])=>round(lines.reduce((n,l)=>n+l[key],0));
 const total=sum('total'),payment=round(num(paid,100000000000000));
 return {lines,subtotal:sum('gross'),discount:sum('discount'),net:sum('net'),tax:sum('tax'),cgst:sum('cgst'),sgst:sum('sgst'),igst:sum('igst'),total,paid:payment,balance:round(Math.max(0,total-payment)),overpaid:round(Math.max(0,payment-total))};
}
export const billMoney=(value:number,currency:string)=>new Intl.NumberFormat(currency==='INR'?'en-IN':'en-US',{style:'currency',currency,currencyDisplay:'code',minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
export function validBillItem(i:BillItem){
 return !!i.description.trim()&&[i.quantity,i.rate,i.discount,i.tax].every(v=>v.trim()!==''&&Number.isFinite(Number(v))&&Number(v)>=0)&&Number(i.quantity)>0&&Number(i.quantity)<=100000&&Number(i.rate)<=10000000&&Number(i.discount)<=100&&Number(i.tax)<=100;
}
