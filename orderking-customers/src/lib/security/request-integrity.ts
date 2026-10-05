import { createHash } from "node:crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new Error("Invalid Origin header");
  }

  const requestUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
    || request.headers.get("host")
    || requestUrl.host;

  if (originUrl.protocol !== requestUrl.protocol || originUrl.host !== host) {
    throw new Error("Cross-origin request rejected");
  }
}

export function requestRiskFingerprint(request: Request, userId: string): string {
  const material = [
    userId,
    request.headers.get("user-agent") || "",
    request.headers.get("accept-language") || "",
    request.headers.get("sec-fetch-site") || "",
    request.headers.get("host") || "",
  ].join("|");
  return sha256(material);
}
