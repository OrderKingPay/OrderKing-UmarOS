import { createHash } from "node:crypto";

function publicOrigin(request: Request): URL | null {
  const origin = request.headers.get("origin")?.trim();
  if (!origin) return null;
  try { return new URL(origin); } catch { return null; }
}

function requestHost(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("host")?.trim() || null;
}

export function assertSameOrigin(request: Request): void {
  const origin = publicOrigin(request);
  if (!origin) return;

  const host = requestHost(request);
  if (!host) throw new Error("Origin verification failed: host is unavailable.");

  if (origin.host !== host) {
    throw new Error("Origin verification failed.");
  }
}

export function requestRiskFingerprint(request: Request, userId: string): string {
  const ip = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  const ua = request.headers.get("user-agent") ?? "unknown";
  return createHash("sha256")
    .update(`${userId}|${ip}|${ua}`)
    .digest("hex");
}
