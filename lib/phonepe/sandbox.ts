// Server-only PhonePe AutoPay Sandbox transport. NEVER use production endpoints here.
export const PRO_MONTHLY_PAISE = 19900;
const BASE = "https://api-preprod.phonepe.com/apis/pg-sandbox";

function assertSandbox() {
  if (process.env.PHONEPE_ENV !== "sandbox") {
    throw new Error("PhonePe sandbox is not enabled");
  }
}

async function getToken(): Promise<string> {
  assertSandbox();
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION;
  if (!clientId || !clientSecret || !clientVersion || !/^\\d+$/.test(clientVersion)) {
    throw new Error("PhonePe sandbox credentials are not configured");
  }
  const body = new URLSearchParams({
    client_id: clientId, client_secret: clientSecret,
    client_version: clientVersion, grant_type: "client_credentials"
  });
  const response = await fetch(BASE + "/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body, cache: "no-store", signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error("PhonePe sandbox authorization rejected (" + response.status + ")");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("access_token" in data) ||
      typeof data.access_token !== "string" || !data.access_token) {
    throw new Error("PhonePe sandbox returned no access token");
  }
  return data.access_token;
}

export async function sandboxPhonePe(
  path: string, method: "GET" | "POST", payload?: unknown
): Promise<Record<string, unknown>> {
  assertSandbox();
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Invalid API path");
  const token = await getToken();
  const response = await fetch(BASE + path, {
    method,
    headers: {
      "Authorization": "O-Bearer " + token,
      "Content-Type": "application/json"
    },
    ...(method === "POST" ? { body: JSON.stringify(payload) } : {}),
    cache: "no-store",
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error("PhonePe sandbox request rejected (" + response.status + ")");
  const value: unknown = await response.json();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid PhonePe sandbox response");
  }
  return value as Record<string, unknown>;
}

export function trustedPhonePeRedirect(input: unknown): input is string {
  if (typeof input !== "string") return false;
  try {
    const url = new URL(input);
    return url.protocol === "https:" &&
      (url.hostname === "phonepe.com" || url.hostname.endsWith(".phonepe.com")) &&
      !url.username && !url.password;
  } catch { return false; }
}
