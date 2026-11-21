import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { serverSupabase } from "@/lib/supabase/server";
import { PRO_MONTHLY_PAISE, sandboxPhonePe } from "@/lib/phonepe/sandbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const ID_PATTERN = /^tnxo_[a-f0-9]{32}$/;

export async function GET(request: NextRequest) {
  if (process.env.PHONEPE_ENV !== "sandbox" ||
      process.env.PHONEPE_SANDBOX_CHECKOUT_ENABLED !== "true") {
    return NextResponse.json({ error: "Sandbox checkout disabled" }, { status: 503 });
  }
  const merchantOrderId = request.nextUrl.searchParams.get("orderId");
  if (!merchantOrderId || !ID_PATTERN.test(merchantOrderId)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }
  const session = await serverSupabase();
  if (!session) return NextResponse.json({ error: "Auth unavailable" }, { status: 503 });
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl || !dbKey) return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });
  const db = createClient(dbUrl, dbKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: attempt, error: readErr } = await db.from("billing_checkout_attempts")
    .select("id, subscription_id, merchant_subscription_id, merchant_order_id, amount_paise, state")
    .eq("merchant_order_id", merchantOrderId).eq("user_id", user.id).maybeSingle();
  if (readErr) return NextResponse.json({ error: "Billing unavailable" }, { status: 503 });
  if (!attempt) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  try {
    const order = await sandboxPhonePe(
      "/checkout/v2/order/" + encodeURIComponent(merchantOrderId) + "/status", "GET");
    const flow = order.paymentFlow && typeof order.paymentFlow === "object" &&
      !Array.isArray(order.paymentFlow) ? order.paymentFlow as Record<string, unknown> : null;
    if (order.amount !== PRO_MONTHLY_PAISE || attempt.amount_paise !== PRO_MONTHLY_PAISE ||
        order.currency !== "INR" || !flow ||
        flow.type !== "SUBSCRIPTION_CHECKOUT_SETUP" ||
        flow.merchantSubscriptionId !== attempt.merchant_subscription_id ||
        flow.maxAmount !== PRO_MONTHLY_PAISE || flow.frequency !== "MONTHLY") {
      return NextResponse.json({ error: "Payment verification mismatch" }, { status: 502 });
    }
    let subscriptionState = "NOT_VERIFIED";
    let verifiedSetup = false;
    let providerSubscriptionId: string | null = null;
    if (order.state === "COMPLETED") {
      const sub = await sandboxPhonePe(
        "/checkout/v2/subscriptions/" +
        encodeURIComponent(attempt.merchant_subscription_id) + "/status", "GET");
      if (sub.merchantSubscriptionId !== attempt.merchant_subscription_id ||
          sub.maxAmount !== PRO_MONTHLY_PAISE || sub.currency !== "INR" ||
          sub.frequency !== "MONTHLY") {
        return NextResponse.json({ error: "Mandate verification mismatch" }, { status: 502 });
      }
      subscriptionState = typeof sub.state === "string" ? sub.state : "UNKNOWN";
      providerSubscriptionId = typeof sub.subscriptionId === "string" ? sub.subscriptionId : null;
      verifiedSetup = subscriptionState === "ACTIVE" && Boolean(providerSubscriptionId);
    }
    const nextState = verifiedSetup ? "setup_completed" :
      order.state === "FAILED" ? "failed" : order.state === "EXPIRED" ? "expired" : "pending";
    const { error: saveErr } = await db.from("billing_checkout_attempts")
      .update({ state: nextState, last_checked_at: new Date().toISOString() })
      .eq("id", attempt.id).eq("user_id", user.id);
    if (saveErr) return NextResponse.json({ error: "Unable to save verification" }, { status: 503 });
    if (verifiedSetup && providerSubscriptionId) {
      const { error: subErr } = await db.from("billing_subscriptions")
        .update({ provider_subscription_id: providerSubscriptionId, updated_at: new Date().toISOString() })
        .eq("id", attempt.subscription_id).eq("user_id", user.id).eq("status", "pending");
      if (subErr) return NextResponse.json({ error: "Unable to save mandate" }, { status: 503 });
    }
    // Deliberately do not grant premium access or record a paid billing period.
    // Settlement/redemption reconciliation must be independently implemented and tested.
    return NextResponse.json({
      orderState: order.state, mandateState: subscriptionState,
      verifiedSetup, proAccessActivated: false
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Sandbox status verification unavailable" }, { status: 502 });
  }
}
