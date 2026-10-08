interface RateLimitData {
  count: number;
  resetTime: number;
  blockTime: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

const WINDOW_MS = 1000;
const MAX_REQUESTS_PER_SEC = 100;
const INITIAL_BLOCK_MS = 5000;

export function adaptiveRateLimit(ip: string): boolean {
  const now = Date.now();
  const data = rateLimitStore.get(ip) || { count: 0, resetTime: now + WINDOW_MS, blockTime: 0 };

  if (now < data.blockTime) {
    return false; // Blocked
  }

  if (now > data.resetTime) {
    data.count = 0;
    data.resetTime = now + WINDOW_MS;
  }

  data.count++;

  if (data.count > MAX_REQUESTS_PER_SEC) {
    const blockDuration = data.blockTime > 0 ? (data.blockTime - now) * 2 : INITIAL_BLOCK_MS;
    data.blockTime = now + Math.max(blockDuration, INITIAL_BLOCK_MS);
    rateLimitStore.set(ip, data);
    return false; // Blocked
  }

  rateLimitStore.set(ip, data);
  return true; // Allowed
}
