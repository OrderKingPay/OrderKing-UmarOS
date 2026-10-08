export function createRateLimiter(windowMs: number, maxRequests: number) {
  const requests = new Map<string, number[]>();

  return function rateLimitMiddleware(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    let userRequests = requests.get(identifier) || [];
    
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);

    if (userRequests.length >= maxRequests) {
      requests.set(identifier, userRequests);
      return false;
    }

    userRequests.push(now);
    requests.set(identifier, userRequests);
    
    return true;
  };
}
