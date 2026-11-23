import {batchLimits} from '@/lib/usage-limits';
import {paidTiers,type BillingPeriod,type PaidTier} from '@/lib/subscription-pricing';
export type {PaidTier,BillingPeriod} from '@/lib/subscription-pricing';
export const paypalPlanId = process.env.PAYPAL_PLAN_ID || '';
// Existing monthly identifiers remain unchanged.
export const paypalTierSettings: Record<PaidTier,{planId:string;maxTexts:number}> = {
 Starter:{planId:process.env.PAYPAL_PLAN_ID_STARTER || paypalPlanId,maxTexts:batchLimits.Starter},
 Pro:{planId:process.env.PAYPAL_PLAN_ID_PRO || '',maxTexts:batchLimits.Pro},
 Premium:{planId:process.env.PAYPAL_PLAN_ID_PREMIUM || '',maxTexts:batchLimits.Premium}
};
// PayPal creates separate recurring billing plans for YEARLY and MONTHLY billing.
export const paypalYearlyPlanIds:Record<PaidTier,string>={
 Starter:process.env.PAYPAL_PLAN_ID_STARTER_YEARLY || '',
 Pro:process.env.PAYPAL_PLAN_ID_PRO_YEARLY || '',
 Premium:process.env.PAYPAL_PLAN_ID_PREMIUM_YEARLY || ''
};
export function planForPayPalPlan(planId:string):{tier:PaidTier;billingPeriod:BillingPeriod}|null{
 if(!planId)return null;
 const matches:{tier:PaidTier;billingPeriod:BillingPeriod}[]=[];
 for(const tier of paidTiers){
  if(paypalTierSettings[tier].planId===planId)matches.push({tier,billingPeriod:'monthly'});
  if(paypalYearlyPlanIds[tier]===planId)matches.push({tier,billingPeriod:'yearly'});
 }
 // Never grant entitlements for a plan ID used by two configurations.
 return matches.length===1?matches[0]:null;
}
export function tierForPayPalPlan(planId:string):PaidTier|null{
 return planForPayPalPlan(planId)?.tier??null;
}
export function configuredPayPalPlanIds():string[]{
 const ids=paidTiers.flatMap(tier=>[paypalTierSettings[tier].planId,paypalYearlyPlanIds[tier]]);
 return ids.filter(id=>!!id&&planForPayPalPlan(id)!==null);
}
export function paypalPlanIdForCheckout(tier:PaidTier,billingPeriod:BillingPeriod):string{
 if(billingPeriod==='yearly'&&process.env.PAYPAL_YEARLY_CHECKOUT_ENABLED!=='true')return '';
 const id=billingPeriod==='monthly'?paypalTierSettings[tier].planId:paypalYearlyPlanIds[tier];
 const match=planForPayPalPlan(id);
 return match?.tier===tier&&match.billingPeriod===billingPeriod?id:'';
}
export const paypalBase = process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
export async function paypalToken() {
 const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_CLIENT_SECRET;
 if (!id || !secret) throw new Error('PayPal credentials not configured');
 const response = await fetch(paypalBase + '/v1/oauth2/token', {
  method:'POST', headers:{Authorization:'Basic '+Buffer.from(id+':'+secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},
  body:'grant_type=client_credentials', cache:'no-store'
 });
 if(!response.ok) throw new Error('PayPal authentication failed');
 return (await response.json() as {access_token:string}).access_token;
}
export async function paypalSubscription(id:string) {
 if(!/^I-[A-Z0-9]+$/i.test(id)) throw new Error('Invalid subscription ID');
 const token=await paypalToken();
 const response=await fetch(paypalBase+'/v1/billing/subscriptions/'+encodeURIComponent(id),{headers:{Authorization:'Bearer '+token},cache:'no-store'});
 if(!response.ok) throw new Error('Unable to verify PayPal subscription');
 return response.json() as Promise<{id:string;plan_id:string;status:string;custom_id?:string;billing_info?:{next_billing_time?:string}}>;
}
