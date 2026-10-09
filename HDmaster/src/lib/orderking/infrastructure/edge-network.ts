export interface OrderPayload {
  id: string;
  items: any[];
  total: number;
  customerInfo: any;
  timestamp: number;
  [key: string]: any;
}

export class ExtremeNetworkEngine {
  private offlineQueue: OrderPayload[] = [];
  private isOnline: boolean = true;

  constructor() {
    this.initNetworkListeners();
    this.loadOfflineQueue();
  }

  private initNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      this.isOnline = navigator.onLine;
    }
  }

  private handleOnline() {
    this.isOnline = true;
    this.syncOfflineQueue();
  }

  private handleOffline() {
    this.isOnline = false;
  }

  private loadOfflineQueue() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('orderking_offline_queue');
      if (stored) {
        try {
          this.offlineQueue = JSON.parse(stored);
        } catch (e) {
          this.offlineQueue = [];
        }
      }
    }
  }

  private saveOfflineQueue() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('orderking_offline_queue', JSON.stringify(this.offlineQueue));
    }
  }

  public cacheOrderForOffline(orderPayload: OrderPayload): void {
    console.log('Network dropped. Caching order for offline sync...', orderPayload.id);
    this.offlineQueue.push(orderPayload);
    this.saveOfflineQueue();
    // Attempt sync immediately in case network is flaky but available
    this.syncOfflineQueue();
  }

  public async syncOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    console.log(`Syncing ${this.offlineQueue.length} offline orders...`);
    
    const queueCopy = [...this.offlineQueue];
    this.offlineQueue = [];
    this.saveOfflineQueue();

    for (const order of queueCopy) {
      try {
        const compressed = this.compressPayloadFor2G(order);
        // Simulate sending over network
        await this.transmit(compressed);
        console.log(`Successfully synced order ${order.id}`);
      } catch (e) {
        console.error(`Failed to sync order ${order.id}, requeuing...`, e);
        this.offlineQueue.push(order);
        this.saveOfflineQueue();
      }
    }
  }

  public compressPayloadFor2G(payload: OrderPayload): string {
    // A mathematical compression function to minimize bytes before transmitting over slow networks
    const jsonString = JSON.stringify(payload);
    
    // Simple dictionary substitution to minimize common keys
    const dictionary = {
      '"id":': '"i":',
      '"items":': '"t":',
      '"total":': '"v":',
      '"customerInfo":': '"c":',
      '"timestamp":': '"s":'
    };
    
    let compressedString = jsonString;
    for (const [key, value] of Object.entries(dictionary)) {
        compressedString = compressedString.replace(new RegExp(key, 'g'), value);
    }
    
    // Convert to base64 for transmission
    if (typeof btoa !== 'undefined') {
        return btoa(unescape(encodeURIComponent(compressedString)));
    }
    
    return Buffer.from(compressedString).toString('base64');
  }

  private async transmit(compressedPayload: string): Promise<boolean> {
    // Simulated transmission delay depending on network
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 2000); // simulate 2G latency
    });
  }
}
