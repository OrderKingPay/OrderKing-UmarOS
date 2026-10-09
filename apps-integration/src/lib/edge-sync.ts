/**
 * UmarOS HyperEdgeCache Integration
 * Global API Gateway for Omni-Platform Edge Injection
 *
 * Platforms: Web, iOS, Android, Desktop
 */

interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

interface CacheRecord {
  timestamp: number;
  data: any;
  route: string;
}

class IndexedDBManager {
  private dbName = 'HyperEdgeCacheDB';
  private storeName = 'edge-routes';
  private version = 1;

  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not available in this environment.'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'route' });
        }
      };
    });
  }

  async get(route: string): Promise<CacheRecord | null> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(route);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  async set(route: string, data: any): Promise<void> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const record: CacheRecord = { timestamp: Date.now(), data, route };
        const request = store.put(record);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('Failed to cache in HyperEdgeCacheDB', e);
    }
  }
}

export class EdgeSyncGateway {
  private dbManager: IndexedDBManager;
  private platformCacheMode: 'STRICT' | 'STALE_WHILE_REVALIDATE';

  constructor(mode: 'STRICT' | 'STALE_WHILE_REVALIDATE' = 'STALE_WHILE_REVALIDATE') {
    this.dbManager = new IndexedDBManager();
    this.platformCacheMode = mode;
  }

  /**
   * Injects requests through the HyperEdgeCache layer.
   * Falls back to IndexedDB for 0ms latency on 2G/Starlink connections.
   */
  async fetch(config: RequestConfig): Promise<any> {
    const cacheKey = `${config.method}:${config.url}`;

    // Return immediately from Cache for 0ms latency if available
    if (config.method === 'GET') {
      const cachedData = await this.dbManager.get(cacheKey);
      if (cachedData) {
        // Revalidate in background (Stale-While-Revalidate pattern)
        if (this.platformCacheMode === 'STALE_WHILE_REVALIDATE') {
          this.networkFetch(config).then(freshData => {
            this.dbManager.set(cacheKey, freshData);
          }).catch(err => console.error('HyperEdgeCache Background Sync failed:', err));
        }
        return cachedData.data;
      }
    }

    // Network Request Fallback
    const responseData = await this.networkFetch(config);

    if (config.method === 'GET') {
      await this.dbManager.set(cacheKey, responseData);
    }

    return responseData;
  }

  private async networkFetch(config: RequestConfig): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for Edge

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          'X-UmarOS-Edge-Injection': 'true',
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`EdgeSync Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Global Instance
export const hyperEdgeGateway = new EdgeSyncGateway();
