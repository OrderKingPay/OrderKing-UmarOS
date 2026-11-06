export class HyperEdgeCache {
  private dbName = 'OrderKingEdgeDB';
  private dbVersion = 1;
  private storeName = 'hyperCache';

  async init(): Promise<void> {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('[HyperEdge] Service Worker registered for edge caching.');
      } catch (error) {
        console.error('[HyperEdge] SW registration failed:', error);
      }
    }
  }

  async fetchMenu(url: string): Promise<any> {
    const isSlow = this.isSlowConnection();
    
    if (isSlow) {
      console.warn('[HyperEdge] Slow connection detected. Bypassing network.');
      const cached = await this.getFromIndexedDB(url);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response not ok');
      const data = await response.json();
      
      // Cache the response asynchronously
      this.saveToIndexedDB(url, data).catch(console.error);
      
      return data;
    } catch (error) {
      console.warn('[HyperEdge] Network failed, falling back to edge cache.', error);
      const cached = await this.getFromIndexedDB(url);
      if (cached) {
        return cached;
      }
      throw new Error('Network offline and no edge cache available.');
    }
  }

  private isSlowConnection(): boolean {
    if (typeof navigator === 'undefined') return false;
    
    // @ts-ignore - Experimental Network Information API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      if (['slow-2g', '2g', '3g'].includes(connection.effectiveType)) {
        return true;
      }
      if (connection.downlink && connection.downlink < 1.0) { // Less than 1Mbps
        return true;
      }
    }
    return false; // Assume fast if API is unsupported
  }

  private async getFromIndexedDB(key: string): Promise<any> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result?.data || null);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async saveToIndexedDB(key: string, data: any): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put({ id: key, data, timestamp: Date.now() });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }
}
