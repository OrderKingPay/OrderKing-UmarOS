// C:\Users\hasan\OrderKing\HDmaster\src\lib\orderking\edge\cdn\EdgeCacheController.ts

export interface CacheOptions {
  ttl: number; // Time to live in seconds
  staleWhileRevalidate: number; // Stale while revalidate time in seconds
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class EdgeCacheController {
  private cache: Map<string, CacheEntry<any>>;
  private pendingRevalidations: Map<string, Promise<any>>;

  constructor() {
    // In a real-world scenario, this might connect to Redis, Vercel Edge Cache, Cloudflare KV, etc.
    // For this implementation, we simulate an in-memory edge cache.
    this.cache = new Map();
    this.pendingRevalidations = new Map();
  }

  /**
   * Generates a cache key based on region and identifier
   */
  private generateKey(region: string, identifier: string): string {
    return `${region}:${identifier}`;
  }

  /**
   * Pushes static menu data to the edge cache format
   */
  public async pushToEdgeCache<T>(
    region: string,
    identifier: string,
    data: T,
    options: CacheOptions = { ttl: 60, staleWhileRevalidate: 300 }
  ): Promise<void> {
    const key = this.generateKey(region, identifier);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    // Simulating global distribution
    console.log(`[EdgeCache] Pushed ${identifier} to edge region: ${region}`);
  }

  /**
   * Retrieves data using stale-while-revalidate strategy for <50ms latency
   */
  public async getWithStaleWhileRevalidate<T>(
    region: string,
    identifier: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = { ttl: 60, staleWhileRevalidate: 300 }
  ): Promise<T> {
    const key = this.generateKey(region, identifier);
    const entry = this.cache.get(key);
    const now = Date.now();

    if (entry) {
      const age = (now - entry.timestamp) / 1000;

      if (age <= options.ttl) {
        // FRESH: Return immediately
        return entry.data as T;
      }

      if (age <= options.ttl + options.staleWhileRevalidate) {
        // STALE: Return stale data immediately, but trigger background revalidation
        this.revalidateInBackground(key, fetcher, region, identifier);
        return entry.data as T;
      }
    }

    // EXPIRED or MISS: Must fetch synchronously
    const freshData = await this.fetchAndCache(key, fetcher, region, identifier);
    return freshData;
  }

  /**
   * Background revalidation to update the cache without blocking the main thread
   */
  private revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    region: string,
    identifier: string
  ): void {
    if (this.pendingRevalidations.has(key)) {
      return; // Already revalidating
    }

    const revalidationPromise = this.fetchAndCache(key, fetcher, region, identifier)
      .catch((error) => {
        console.error(`[EdgeCache] Background revalidation failed for ${key}:`, error);
      })
      .finally(() => {
        this.pendingRevalidations.delete(key);
      });

    this.pendingRevalidations.set(key, revalidationPromise);
  }

  /**
   * Fetches fresh data and updates the cache
   */
  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    region: string,
    identifier: string
  ): Promise<T> {
    const freshData = await fetcher();
    this.cache.set(key, {
      data: freshData,
      timestamp: Date.now(),
    });
    console.log(`[EdgeCache] Revalidated and updated edge cache for: ${key}`);
    return freshData;
  }
  
  /**
   * Invalidate a specific cache entry
   */
  public async invalidate(region: string, identifier: string): Promise<void> {
    const key = this.generateKey(region, identifier);
    this.cache.delete(key);
    console.log(`[EdgeCache] Invalidated cache for: ${key}`);
  }
}

// Singleton instance for the application
export const edgeCache = new EdgeCacheController();
