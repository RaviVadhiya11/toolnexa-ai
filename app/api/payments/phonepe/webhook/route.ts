import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validAuthorization(header: string | null): boolean {
  const username = process.env.PHONEPE_WEBHOOK_USERNAME;
  const password = process.env.PHONEPE_WEBHOOK_PASSWORD;
  if (!username || !password || !header) return false;
  // PhonePe SHA callback authentication: Authorization = SHA256(username:password).
  const expected = createHash("sha256").update(username + ":" + password).digest("hex");
  const supplied = header.trim().replace(/^SHA256\s+/i, "");
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(supplied, "hex"));
}

export async function POST(request: NextRequest) {
  if (!validAuthorization(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > 65536) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  let payload: unknown;
  try { payload = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const event = payload as Record<string, unknown>;
  const eventType = typeof event.event === "string" ? event.event :
    typeof event.type === "string" ? event.type : "";
  if (!eventType || eventType.length > 150) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  // A stable event key is used only for logging, not for subscription activation.
  const eventKey = createHash("sha256").update(raw).digest("hex");
  const { error } = await db.from("billing_webhook_events").upsert(
    { provider: "phonepe", event_key: eventKey, event_type: eventType },
    { onConflict: "event_key", ignoreDuplicates: true }
  );
  if (error) return NextResponse.json({ error: "Event persistence failed" }, { status: 503 });
  // Fail closed: no entitlement or billing status changes until PhonePe
  // subscription status API reconciliation and mandate eligibility are verified.
  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
