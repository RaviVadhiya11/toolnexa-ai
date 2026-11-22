import {PremiumPricing} from '@/components/premium-pricing';
import {paypalTierSettings} from '@/lib/paypal';

export default function Pricing(){
 const checkoutEnabled=process.env.PAYPAL_CHECKOUT_ENABLED==='true' &&
  process.env.PAYPAL_ENV==='live' &&
  !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET &&
  !!process.env.PAYPAL_WEBHOOK_ID && !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 return <PremiumPricing clientId={checkoutEnabled?process.env.PAYPAL_CLIENT_ID!:''}
  plans={{
   Starter:paypalTierSettings.Starter.planId,
   Pro:paypalTierSettings.Pro.planId,
   Premium:paypalTierSettings.Premium.planId
  }} enabled={checkoutEnabled}/>;
}
