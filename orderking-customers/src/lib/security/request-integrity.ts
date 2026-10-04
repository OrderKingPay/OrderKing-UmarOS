import { createHash } from "node:crypto";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;

  let expected: string;
  try {
    expected = new URL(request.url).origin;
  } catch {
    throw new Response("Invalid request URL", { status: 400 });
  }

  if (origin !== expected) {
    throw new Response("Cross-origin request blocked", { status: 403 });
  }
}

export function requestRiskFingerprint(request: Request, userId: string): string {
  const userAgent = request.headers.get("user-agent") ?? "";
  const material = "orderking:" + userId + ":" + userAgent;
  return createHash("sha256").update(material).digest("hex").slice(0, 32);
}
