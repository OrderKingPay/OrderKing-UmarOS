// PostgreSQL-backed sliding-window rate limiter.
// Shared across instances so horizontal scaling does not reset abuse budgets.

import { getSql } from "@/lib/db";

type Config = { windowMs?: number; maxRequests?: number };

export async function enforceRateLimit(
  request: Request,
  scope: string,
  config: Config = {},
): Promise<Response | null> {
  const windowMs = config.windowMs ?? 60_000;
  const maxRequests = config.maxRequests ?? 20;
  if (!scope || windowMs <= 0 || maxRequests <= 0) {
    throw new Error("Invalid rate-limit configuration");
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  const ip = forwarded || real || "unknown";
  const bucketKey = `${scope}:ip:${ip}`;

  const sql = await getSql();
  const windowSeconds = windowMs / 1000;

  const result = await sql.transaction(async (tx: any) => {
    await tx.query(
      "CREATE TABLE IF NOT EXISTS rate_limit_events (id BIGSERIAL PRIMARY KEY, bucket_key TEXT NOT NULL, occurred_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    await tx.query(
      "CREATE INDEX IF NOT EXISTS idx_rate_limit_events_bucket_time ON rate_limit_events (bucket_key, occurred_at)",
    );
    await tx.query("SELECT pg_advisory_xact_lock(hashtext($1))", [bucketKey]);
    await tx.query(
      "DELETE FROM rate_limit_events WHERE bucket_key = $1 AND occurred_at <= now() - ($2::double precision * interval '1 second')",
      [bucketKey, windowSeconds],
    );
    const rows = await tx.query(
      "SELECT count(*)::int AS count, min(occurred_at)::text AS oldest FROM rate_limit_events WHERE bucket_key = $1",
      [bucketKey],
    );
    const count = Number(rows[0]?.count ?? 0);
    const oldest = rows[0]?.oldest ? new Date(rows[0].oldest).getTime() : Date.now();

    if (count >= maxRequests) {
      const resetMs = Math.max(1, oldest + windowMs - Date.now());
      return { allowed: false, retryAfter: Math.ceil(resetMs / 1000) };
    }

    await tx.query(
      "INSERT INTO rate_limit_events (bucket_key, occurred_at) VALUES ($1, now())",
      [bucketKey],
    );
    return { allowed: true, remaining: Math.max(0, maxRequests - count - 1) };
  });

  if (result.allowed) return null;

  return new Response(
    JSON.stringify({
      error: "RATE_LIMITED",
      message: "Too many requests. Please retry shortly.",
      retryAfterSeconds: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter),
        "Cache-Control": "no-store",
      },
    },
  );
}
