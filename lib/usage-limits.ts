/* Per-browser, per-day usage limits for locally processed tools.
 * These are UX quotas, not server-enforced anti-abuse controls.
 * A browser-only tool cannot be made tamper-proof by localStorage.
 */
export type UsagePlan='Free'|'Starter'|'Pro'|'Premium';
export const dailyLimits:Record<UsagePlan,number>={Free:10,Starter:150,Pro:500,Premium:2000};
export const batchLimits={Starter:20,Pro:60,Premium:150} as const;
export const planNames:UsagePlan[]=['Free','Starter','Pro','Premium'];
export function isUsagePlan(value:unknown):value is UsagePlan{
 return typeof value==='string'&&planNames.some(plan=>plan===value);
}
export function quotaKey(userId:string|null,date=new Date()):string{
 const utcDay=date.toISOString().slice(0,10);
 const owner=userId&&/^[a-f0-9-]{36}$/i.test(userId)?userId:'guest';
 return 'toolnexa-daily-usage-v1:'+utcDay+':'+owner;
}
export function readUsage(key:string):number{
 try{
  const value=localStorage.getItem(key);
  if(value===null)return 0;
  const number=Number(value);
  return Number.isSafeInteger(number)&&number>=0?number:0;
 }catch{return 0}
}
export function consumeUsage(key:string,limit:number):number|null{
 // Counts only successful browser operations. No credit consumed on failure.
 // Separate server accounting is required for truly tamper-resistant quota enforcement.
 const used=readUsage(key);
 if(used>=limit)return null;
 try{localStorage.setItem(key,String(used+1))}catch{return null}
 return used+1;
}
