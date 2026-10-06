export class RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();

  constructor(private limit: number, private windowMs: number) {}

  /**
   * Check rate limit for a given identifier (e.g. IP address).
   * Returns true if allowed, false if rate limited.
   */
  check(identifier: string): boolean {
    const now = Date.now();
    let record = this.store.get(identifier);

    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + this.windowMs };
    }

    record.count += 1;
    this.store.set(identifier, record);

    return record.count <= this.limit;
  }
}

export const globalLimiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute
