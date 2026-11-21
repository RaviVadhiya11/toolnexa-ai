"use client";

import { useEffect, useState } from "react";

type CheckoutResponse = { redirectUrl?: string; error?: string };
type VerificationResponse = {
  orderState?: string; mandateState?: string; verifiedSetup?: boolean;
  proAccessActivated?: boolean; error?: string
};

export function SandboxCheckout() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("phonepe_order");
    if (!id || !/^tnxo_[a-f0-9]{32}$/.test(id)) return;
    let live = true;
    setMessage("Checking PhonePe Sandbox mandate status…");
    fetch("/api/payments/phonepe/checkout/status?orderId=" + encodeURIComponent(id),
      { credentials: "same-origin", cache: "no-store" })
      .then(async response => {
        const data = await response.json() as VerificationResponse;
        if (!response.ok) throw new Error(data.error || "Status unavailable");
        if (live) setMessage(data.verifiedSetup
          ? "Sandbox mandate setup verified. Pro access is NOT enabled yet."
          : "Sandbox order: " + (data.orderState || "unknown") +
            "; mandate: " + (data.mandateState || "not yet verified") +
            ". No Pro access granted.");
      })
      .catch(error => { if (live) setMessage(error instanceof Error ? error.message : "Verification failed"); });
    return () => { live = false; };
  }, []);

  async function startCheckout() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/payments/phonepe/checkout", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: "{}"
      });
      const data = await response.json() as CheckoutResponse;
      if (!response.ok) throw new Error(data.error || "Sandbox checkout unavailable");
      if (!data.redirectUrl || !data.redirectUrl.startsWith("https://")) {
        throw new Error("Invalid Sandbox redirect");
      }
      window.location.assign(data.redirectUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed");
      setBusy(false);
    }
  }

  return <div className="mt-7">
    <button type="button" className="button" onClick={startCheckout} disabled={busy}>
      {busy ? "Opening Sandbox…" : "Test ₹199/month Sandbox"}
    </button>
    <p className="muted mt-2 text-sm">Sandbox test only. No live charge and no Pro activation.</p>
    {message ? <p role="status" className="muted mt-3 text-sm">{message}</p> : null}
  </div>;
}
