/**
 * Rate Limiter — In-memory sliding window rate limiter for API endpoints.
 * Production deployment should swap to Redis-based limiter via RATE_LIMIT_BACKEND env var.
 *
 * @module rate-limiter
 */

type RateLimitEntry = { timestamps: number[]; banned: boolean; banExpiry: number };

const store = new Map<string, RateLimitEntry>();

const DEFAULTS = {
  windowMs: 60_000,
  maxRequests: 60,
  banThresholdMultiplier: 3,
  banDurationMs: 300_000,
  cleanupIntervalMs: 120_000,
} as const;

type RateLimitConfig = {
  windowMs?: number;
  maxRequests?: number;
  banThresholdMultiplier?: number;
  banDurationMs?: number;
  keyPrefix?: string;
};

const ENDPOINT_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  "POST /v1/admin/master-ai": { maxRequests: 20, windowMs: 60_000 },
  "POST /v1/admin/customer-order": { maxRequests: 30, windowMs: 60_000 },
  "POST /v1/payments": { maxRequests: 10, windowMs: 60_000 },
  "POST /v1/admin/dispatch/reassign": { maxRequests: 15, windowMs: 60_000 },
  "GET /v1/admin/customer-orders": { maxRequests: 100, windowMs: 60_000 },
  "GET /v1/admin/rider-offers": { maxRequests: 100, windowMs: 60_000 },
};

function getEntry(key: string): RateLimitEntry {
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [], banned: false, banExpiry: 0 };
    store.set(key, entry);
  }
  return entry;
}

function pruneOld(entry: RateLimitEntry, windowMs: number, now: number) {
  const cutoff = now - windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  banned: boolean;
  retryAfterMs?: number;
};

export function checkRateLimit(
  clientId: string,
  endpoint: string,
  config?: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const endpointConfig = ENDPOINT_LIMITS[endpoint];
  const windowMs = config?.windowMs ?? endpointConfig?.windowMs ?? DEFAULTS.windowMs;
  const maxRequests = config?.maxRequests ?? endpointConfig?.maxRequests ?? DEFAULTS.maxRequests;
  const banMultiplier = config?.banThresholdMultiplier ?? DEFAULTS.banThresholdMultiplier;
  const banDurationMs = config?.banDurationMs ?? DEFAULTS.banDurationMs;

  const prefix = config?.keyPrefix ?? "";
  const key = `${prefix}${clientId}:${endpoint}`;
  const entry = getEntry(key);

  // Check if currently banned
  if (entry.banned) {
    if (now < entry.banExpiry) {
      return {
        allowed: false,
        remaining: 0,
        resetMs: entry.banExpiry - now,
        banned: true,
        retryAfterMs: entry.banExpiry - now,
      };
    }
    entry.banned = false;
    entry.banExpiry = 0;
    entry.timestamps = [];
  }

  pruneOld(entry, windowMs, now);
  entry.timestamps.push(now);
  const count = entry.timestamps.length;

  // Auto-ban if abuse threshold exceeded
  if (count >= maxRequests * banMultiplier) {
    entry.banned = true;
    entry.banExpiry = now + banDurationMs;
    return {
      allowed: false,
      remaining: 0,
      resetMs: banDurationMs,
      banned: true,
      retryAfterMs: banDurationMs,
    };
  }

  // Normal rate limit check
  if (count > maxRequests) {
    const oldest = entry.timestamps[0] ?? now;
    const resetMs = oldest + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
      banned: false,
      retryAfterMs: Math.max(0, resetMs),
    };
  }

  // Allow request
  return {
    allowed: true,
    remaining: maxRequests - count,
    resetMs: windowMs,
    banned: false,
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetMs / 1000)),
  };
  if (!result.allowed) {
    headers["Retry-After"] = String(Math.ceil((result.retryAfterMs ?? result.resetMs) / 1000));
  }
  return headers;
}

let cleanupTimer: ReturnType<typeof setInterval> | undefined;

export function startCleanup(intervalMs = DEFAULTS.cleanupIntervalMs) {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const maxAge = DEFAULTS.windowMs * DEFAULTS.banThresholdMultiplier;
    for (const [key, entry] of store) {
      if (entry.banned && now >= entry.banExpiry) {
        store.delete(key);
        continue;
      }
      pruneOld(entry, maxAge, now);
      if (entry.timestamps.length === 0 && !entry.banned) {
        store.delete(key);
      }
    }
  }, intervalMs);
}

export function stopCleanup() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = undefined;
  }
}

export function resetStore() {
  store.clear();
}
