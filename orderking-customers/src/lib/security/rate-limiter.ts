type RateLimitEntry = {
  timestamps: number[];
  lastSeen: number;
};

export class MemorySafeRateLimiter {
  private cache = new Map<string, RateLimitEntry>();
  private readonly maxEntries: number;
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private lastCleanup = Date.now();

  constructor(opts: { windowMs: number; maxRequests: number; maxEntries?: number }) {
    this.windowMs = opts.windowMs;
    this.maxRequests = opts.maxRequests;
    this.maxEntries = opts.maxEntries ?? 10_000;
  }

  isAllowed(key: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    this.evictStaleIfNeeded(now);

    let entry = this.cache.get(key);
    if (!entry) {
      if (this.cache.size >= this.maxEntries) {
        // Evict oldest entry (LRU protection against memory exhaustion)
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey) this.cache.delete(oldestKey);
      }
      entry = { timestamps: [], lastSeen: now };
      this.cache.set(key, entry);
    }

    entry.lastSeen = now;
    const threshold = now - this.windowMs;
    entry.timestamps = entry.timestamps.filter((ts) => ts > threshold);

    if (entry.timestamps.length >= this.maxRequests) {
      const resetMs = entry.timestamps[0] + this.windowMs - now;
      return { allowed: false, remaining: 0, resetMs: Math.max(0, resetMs) };
    }

    entry.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.maxRequests - entry.timestamps.length,
      resetMs: this.windowMs,
    };
  }

  private evictStaleIfNeeded(now: number) {
    if (now - this.lastCleanup < 60_000) return;
    this.lastCleanup = now;
    const threshold = now - this.windowMs;
    for (const [k, v] of this.cache.entries()) {
      if (v.lastSeen < threshold) {
        this.cache.delete(k);
      }
    }
  }
}

// Preset Limiters
export const checkoutLimiter = new MemorySafeRateLimiter({ windowMs: 60_000, maxRequests: 5 });
export const paymentLimiter = new MemorySafeRateLimiter({ windowMs: 60_000, maxRequests: 10 });
export const searchLimiter = new MemorySafeRateLimiter({ windowMs: 10_000, maxRequests: 30 });
export const aiChatLimiter = new MemorySafeRateLimiter({ windowMs: 60_000, maxRequests: 15 });
