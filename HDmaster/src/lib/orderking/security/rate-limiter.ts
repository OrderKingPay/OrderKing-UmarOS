import { getSql } from "@/lib/db";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  retryAfterMs?: number;
};

export type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

const DEFAULTS: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 60,
};

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = await getSql();
    await sql.query(
      "create table if not exists rate_limit_events (id bigserial primary key, bucket_key text not null, occurred_at timestamptz not null default now())",
    );
    await sql.query(
      "create index if not exists idx_rate_limit_events_bucket_time on rate_limit_events (bucket_key, occurred_at)",
    );
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

/**
 * PostgreSQL-backed sliding-window limiter.
 *
 * The decision is fail-closed: if the database cannot evaluate the limit,
 * callers receive an exception and must reject the protected operation.
 *
 * The query uses a PostgreSQL transaction plus an advisory transaction lock
 * keyed by the bucket. This prevents concurrent requests for the same bucket
 * from both passing the limit at the boundary.
 */
export async function checkRateLimit(
  bucketKey: string,
  config: Partial<RateLimitConfig> = {},
): Promise<RateLimitResult> {
  const windowMs = config.windowMs ?? DEFAULTS.windowMs;
  const maxRequests = config.maxRequests ?? DEFAULTS.maxRequests;
  if (!bucketKey || maxRequests <= 0 || windowMs <= 0) {
    throw new Error("Invalid rate-limit configuration");
  }

  await ensureSchema();
  const sql = await getSql();
  const windowSeconds = windowMs / 1000;

  await sql.query("BEGIN");
  try {
    await sql.query(
      "select pg_advisory_xact_lock(hashtext($1))",
      [bucketKey],
    );
    await sql.query(
      "delete from rate_limit_events where bucket_key = $1 and occurred_at <= now() - ($2::double precision * interval '1 second')",
      [bucketKey, windowSeconds],
    );
    const rows = await sql.query<{ count: number; oldest: string | null }>(
      "select count(*)::int as count, min(occurred_at)::text as oldest from rate_limit_events where bucket_key = $1",
      [bucketKey],
    );
    const count = rows[0]?.count ?? 0;
    const oldest = rows[0]?.oldest ? new Date(rows[0].oldest).getTime() : Date.now();

    if (count >= maxRequests) {
      const resetMs = Math.max(1, oldest + windowMs - Date.now());
      await sql.query("ROLLBACK");
      return {
        allowed: false,
        remaining: 0,
        resetMs,
        retryAfterMs: resetMs,
      };
    }

    await sql.query(
      "insert into rate_limit_events (bucket_key, occurred_at) values ($1, now())",
      [bucketKey],
    );
    await sql.query("COMMIT");
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - count - 1),
      resetMs: windowMs,
    };
  } catch (error) {
    try { await sql.query("ROLLBACK"); } catch { /* preserve original error */ }
    throw error;
  }
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetMs / 1000)),
  };
  if (!result.allowed) {
    headers["Retry-After"] = String(
      Math.max(1, Math.ceil((result.retryAfterMs ?? result.resetMs) / 1000)),
    );
  }
  return headers;
}

export function getClientRateLimitKey(request: Request, scope: string): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const ip = forwarded || realIp || "unknown";
  return `${scope}:ip:${ip}`;
}

export async function enforceRateLimit(
  request: Request,
  scope: string,
  config?: Partial<RateLimitConfig>,
): Promise<Response | null> {
  const result = await checkRateLimit(getClientRateLimitKey(request, scope), config);
  if (result.allowed) return null;
  return new Response(JSON.stringify({ error: "Too Many Requests" }), {
    status: 429,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...getRateLimitHeaders(result),
    },
  });
}
