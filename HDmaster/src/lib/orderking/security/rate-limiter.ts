const store = new Map<string, { count: number; windowStart: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const now = Date.now();
  let record = store.get(identifier);

  if (!record) {
    record = { count: 1, windowStart: now };
    store.set(identifier, record);
    return { allowed: true, remaining: maxRequests - 1 };
  }

  const elapsed = now - record.windowStart;

  if (elapsed >= windowMs) {
    // Window expired, reset
    record.count = 1;
    record.windowStart = now;
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    const retryAfterMs = windowMs - elapsed;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
}

export function createRateLimitMiddleware(maxRequests: number, windowMs: number) {
  return function rateLimitMiddleware(req: any, res: any, next: any) {
    const identifier = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    
    const result = checkRateLimit(identifier as string, maxRequests, windowMs);
    
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    
    const resetTimeMs = Date.now() + (result.retryAfterMs || windowMs);
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTimeMs / 1000));

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        retryAfterMs: result.retryAfterMs
      });
    }

    next();
  };
}
