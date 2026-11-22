export const paypalPlanId = process.env.PAYPAL_PLAN_ID || '';
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
