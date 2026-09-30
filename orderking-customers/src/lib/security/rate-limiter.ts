type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function getClientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  return `${scope}:ip:${forwarded || real || "unknown"}`;
}

export async function enforceRateLimit(
  request: Request,
  scope: string,
  config: { windowMs?: number; maxRequests?: number } = {},
): Promise<Response | null> {
  const windowMs = config.windowMs ?? 60_000;
  const maxRequests = config.maxRequests ?? 20;
  const now = Date.now();
  const key = getClientKey(request, scope);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return null;
  }

  if (current.count >= maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return new Response(
      JSON.stringify({
        error: "RATE_LIMITED",
        message: "Too many AI requests. Please retry shortly.",
        retryAfterSeconds: retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  current.count += 1;
  return null;
}
