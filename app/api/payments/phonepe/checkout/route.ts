import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { serverSupabase } from "@/lib/supabase/server";
import { PRO_MONTHLY_PAISE, sandboxPhonePe, trustedPhonePeRedirect } from "@/lib/phonepe/sandbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (process.env.PHONEPE_ENV !== "sandbox" ||
      process.env.PHONEPE_SANDBOX_CHECKOUT_ENABLED !== "true") {
    return NextResponse.json({ error: "Sandbox checkout disabled" }, { status: 503 });
  }
  const requestOrigin = new URL(request.url).origin;
  if (request.headers.get("origin") !== requestOrigin) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }
  // Preview branch aliases and immutable deployment URLs can have different hosts.
  // Only trust the explicitly configured return origin or Vercel's own deployment URL.
  const returnOrigin = process.env.PHONEPE_RETURN_ORIGIN?.replace(/\\/$/, "");
  const deploymentOrigin = process.env.VERCEL_URL
    ? "https://" + process.env.VERCEL_URL
    : null;
  let configuredOrigin: string | null = null;
  try {
    if (returnOrigin) {
      const url = new URL(returnOrigin);
      if (url.protocol === "https:" && !url.username && !url.password &&
          url.pathname === "/" && !url.search && !url.hash) {
        configuredOrigin = url.origin;
      }
    }
  } catch { /* Invalid configuration: fail closed. */ }
  if (!configuredOrigin ||
      (requestOrigin !== configuredOrigin && requestOrigin !== deploymentOrigin)) {
    return NextResponse.json({ error: "Sandbox return origin not configured" }, { status: 503 });
  }
  // Return to the same verified host that initiated checkout, never a client-supplied URL.
  const verifiedReturnOrigin = requestOrigin;
  const session = await serverSupabase();
  if (!session) return NextResponse.json({ error: "Auth unavailable" }, { status: 503 });
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl || !dbKey) return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  const db = createClient(dbUrl, dbKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // Reject concurrent/repeated checkout launches. Additional edge rate limits are advisable.
  const { data: active, error: activeErr } = await db.from("billing_subscriptions")
    .select("id").eq("user_id", user.id).in("status", ["active", "paused", "past_due"]).limit(1);
  if (activeErr) return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });
  if (active?.length) return NextResponse.json({ error: "Subscription already exists" }, { status: 409 });
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: recent, error: recentErr } = await db.from("billing_checkout_attempts")
    .select("id").eq("user_id", user.id).in("state", ["created", "pending"])
    .gte("created_at", cutoff).limit(1);
  if (recentErr) return NextResponse.json({ error: "Billing setup incomplete; apply checkout SQL" }, { status: 503 });
  if (recent?.length) return NextResponse.json({ error: "A checkout is already pending. Check its status first." }, { status: 409 });

  const merchantOrderId = "tnxo_" + randomUUID().replace(/-/g, "");
  const merchantSubscriptionId = "tnxs_" + randomUUID().replace(/-/g, "");
  const { data: subscription, error: subscriptionErr } = await db.from("billing_subscriptions")
    .insert({
      user_id: user.id, merchant_subscription_id: merchantSubscriptionId,
      status: "pending", plan_code: "pro_monthly", currency: "INR", amount_paise: PRO_MONTHLY_PAISE
    }).select("id").single();
  if (subscriptionErr || !subscription) {
    return NextResponse.json({ error: "Unable to reserve subscription" }, { status: 503 });
  }
  const { error: attemptErr } = await db.from("billing_checkout_attempts").insert({
    user_id: user.id, subscription_id: subscription.id,
    merchant_order_id: merchantOrderId, merchant_subscription_id: merchantSubscriptionId,
    amount_paise: PRO_MONTHLY_PAISE, state: "created"
  });
  if (attemptErr) {
    await db.from("billing_subscriptions").delete().eq("id", subscription.id).eq("status", "pending");
    return NextResponse.json({ error: "Unable to reserve checkout" }, { status: 503 });
  }
  const redirectBack = verifiedReturnOrigin + "/pricing?phonepe_order=" + encodeURIComponent(merchantOrderId);
  try {
    const response = await sandboxPhonePe("/checkout/v2/pay", "POST", {
      merchantOrderId,
      amount: PRO_MONTHLY_PAISE,
      paymentFlow: {
        type: "SUBSCRIPTION_CHECKOUT_SETUP",
        merchantUrls: { redirectUrl: redirectBack },
        subscriptionDetails: {
          subscriptionType: "RECURRING",
          merchantSubscriptionId,
          authWorkflowType: "TRANSACTION",
          amountType: "FIXED",
          maxAmount: PRO_MONTHLY_PAISE,
          frequency: "MONTHLY",
          expireAt: Date.now() + 365 * 24 * 60 * 60 * 1000
        }
      },
      expireAfter: 900
    });
    if (response.state !== "PENDING" || !trustedPhonePeRedirect(response.redirectUrl) ||
        typeof response.orderId !== "string" || !response.orderId) {
      throw new Error("Unexpected PhonePe checkout response");
    }
    const { error: saveErr } = await db.from("billing_checkout_attempts")
      .update({ state: "pending", provider_order_id: response.orderId })
      .eq("merchant_order_id", merchantOrderId).eq("user_id", user.id);
    if (saveErr) throw new Error("Unable to persist sandbox checkout");
    return NextResponse.json({ merchantOrderId, redirectUrl: response.redirectUrl }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch {
    // Never log credentials, provider response bodies, or issue Pro access here.
    await db.from("billing_checkout_attempts")
      .update({ state: "failed" }).eq("merchant_order_id", merchantOrderId).eq("state", "created");
    return NextResponse.json({ error: "Sandbox checkout failed; inspect server logs safely" }, { status: 502 });
  }
}
