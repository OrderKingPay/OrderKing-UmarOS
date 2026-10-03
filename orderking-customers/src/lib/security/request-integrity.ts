import { createHash } from "node:crypto";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin")?.trim();
  if (!origin) return;

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();
  if (!host) throw new Error("Request host unavailable");

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new Error("Invalid request origin");
  }

  if (originUrl.host !== host) throw new Error("Cross-origin request rejected");
}

export function requestRiskFingerprint(request: Request, userId: string): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";
  const origin = request.headers.get("origin") ?? "";
  return createHash("sha256")
    .update([userId, forwardedFor, userAgent, origin].join("|"))
    .digest("hex");
}
