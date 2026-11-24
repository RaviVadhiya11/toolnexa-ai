/* ZIP Maker download limits. All ZIP contents are assembled in the user's browser.
 * Values are product caps, not protection against a modified client or offline copies.
 */
export const zipPlans={
 Starter:{files:50,bytes:100*1024*1024,maximum:false},
 Pro:{files:200,bytes:300*1024*1024,maximum:true},
 Premium:{files:500,bytes:600*1024*1024,maximum:true},
 Max:{files:1000,bytes:1024*1024*1024,maximum:true}
} as const;
export type ZipTier=keyof typeof zipPlans;
export type ZipCompression='fast'|'smart'|'maximum';
const order:ZipTier[]=['Starter','Pro','Premium','Max'];
export function zipRequiredTier(count:number,bytes:number,mode:ZipCompression):ZipTier|null{
 if(!Number.isSafeInteger(count)||count<1||count>zipPlans.Max.files||
   !Number.isSafeInteger(bytes)||bytes<0||bytes>zipPlans.Max.bytes)return null;
 for(const tier of order){
  const limits=zipPlans[tier];
  if(count<=limits.files&&bytes<=limits.bytes&&(mode!=='maximum'||limits.maximum))
   return tier;
 }
 return null;
}
export function zipPlanAllows(plan:ZipTier,required:ZipTier){
 return order.indexOf(plan)>=order.indexOf(required);
}
