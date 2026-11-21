import { SandboxCheckout } from "@/components/phonepe-sandbox-checkout";

export default function Pricing() {
  const sandboxEnabled = process.env.PHONEPE_ENV === "sandbox" &&
    process.env.PHONEPE_SANDBOX_CHECKOUT_ENABLED === "true" &&
    (process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development");
  const plans = [
    { name: "Free", price: "₹0", features: ["20 utility tools", "Browser-based processing", "No account required"] },
    { name: "Pro", price: "₹199/month", features: ["Higher processing limits (planned)", "AI credits (planned)", "Ad-free experience (planned)"] },
    { name: "Business", price: "₹499/month", features: ["More AI credits (planned)", "Batch processing (planned)", "Team features (planned)"] }
  ];
  return <>
    <h1 className="text-3xl font-extrabold">Simple, transparent pricing</h1>
    <p className="muted mt-2 mb-6">Free tools are available now. Premium access is not enabled; a sandbox checkout test is available on configured preview deployments only.</p>
    <div className="pricing-grid">
      {plans.map(p => <div className="panel" key={p.name}>
        <b>{p.name}</b>
        <h2 className="text-3xl font-extrabold my-5">{p.price}</h2>
        {p.features.map(f => <p className="muted mt-3 text-sm" key={f}>✓ {f}</p>)}
        {p.name === "Pro" && sandboxEnabled ? <SandboxCheckout /> :
          <button className="button mt-7" disabled={p.name !== "Free"}
            style={p.name !== "Free" ? { opacity: .5, cursor: "not-allowed" } : {}}>
            {p.name === "Free" ? "Available Now" : "Coming Soon"}
          </button>}
      </div>)}
    </div>
  </>;
}
