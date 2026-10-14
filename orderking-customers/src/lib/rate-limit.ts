export function createMemoryRateLimiter(maxEntries: number = 10_000) {
  const buckets = new Map<string, number[]>();
  let lastCleanup = Date.now();

  return (key: string, n: number, windowMs: number): boolean => {
    const now = Date.now();

    // Periodic cleanup of expired entries (every 30 seconds or when capacity exceeded)
    if (now - lastCleanup > 30_000 || buckets.size >= maxEntries) {
      lastCleanup = now;
      for (const [k, timestamps] of buckets.entries()) {
        const active = timestamps.filter((t) => now - t < windowMs);
        if (active.length === 0) {
          buckets.delete(k);
        } else {
          buckets.set(k, active);
        }
      }
      // If still exceeding maxEntries, evict oldest
      if (buckets.size >= maxEntries) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey) buckets.delete(oldestKey);
      }
    }

    const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
    if (arr.length >= n) {
      buckets.set(key, arr);
      return false;
    }
    arr.push(now);
    buckets.set(key, arr);
    return true;
  };
}
