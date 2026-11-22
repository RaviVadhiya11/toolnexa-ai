import {PayPalSubscribe} from '@/components/paypal-subscribe';
export default function Pricing(){
 const enabled=process.env.PAYPAL_CHECKOUT_ENABLED==='true' && process.env.PAYPAL_ENV==='live' && !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET && !!process.env.PAYPAL_PLAN_ID && !!process.env.PAYPAL_WEBHOOK_ID && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
 return <><h1 className="text-3xl font-extrabold">Simple, transparent pricing</h1>
 <p className="muted mt-2 mb-6">Free tools are available now. Premium features are being prepared.</p>
 <div className="pricing-grid">
 <div className="panel"><b>Free</b><h2 className="text-3xl font-extrabold my-5">₹0</h2><p>20 utility tools</p><p>Browser-based processing</p><p>No account required</p><button className="button mt-7">Available Now</button></div>
 <div className="panel"><b>Pro International</b><h2 className="text-3xl font-extrabold my-5">$3.99/month</h2><p>Monthly recurring subscription</p><p className="mt-3">Includes Pro Batch Text Analyzer (up to 20 texts per request).</p><a className="button outline mt-4" href="/pro/text-batch">Open Pro Text Analyzer</a><p className="muted mt-3">Other premium features are planned and not included yet.</p>{enabled?<div className="mt-7"><PayPalSubscribe clientId={process.env.PAYPAL_CLIENT_ID!} planId={process.env.PAYPAL_PLAN_ID!}/></div>:<button className="button mt-7" disabled>Coming Soon</button>}</div>
 <div className="panel"><b>Business</b><h2 className="text-3xl font-extrabold my-5">₹499/month</h2><p className="muted">Team features (planned)</p><button className="button mt-7" disabled>Coming Soon</button></div>
 </div></>
}