import { createHash } from "node:crypto";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const allowed = new Set(
    [
      process.env.CUSTOMER_APP_URL,
      process.env.ORDERKING_CUSTOMER_URL,
      process.env.HDMASTER_URL,
    ]
      .filter(Boolean)
      .map((value) => String(value).replace(/\/$/, "")),
  );

  if (allowed.size === 0) return;

  const normalized = origin.replace(/\/$/, "");
  if (!allowed.has(normalized)) {
    throw new Error("CROSS_ORIGIN_BLOCKED");
  }
}

export function requestRiskFingerprint(request: Request, subject: string): string {
  const input = [
    subject,
    request.headers.get("user-agent") ?? "",
    request.headers.get("sec-ch-ua") ?? "",
    request.headers.get("sec-ch-ua-platform") ?? "",
    request.headers.get("accept-language") ?? "",
  ].join("|");

  return createHash("sha256").update(input).digest("hex");
}
