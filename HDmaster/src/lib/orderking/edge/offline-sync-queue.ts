export type SyncAction = {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
};

export class OfflineSyncQueue {
  private queue: SyncAction[] = [];
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private readonly storageKey = 'orderking:edge:sync-queue';

  constructor(private syncCallback: (action: SyncAction) => Promise<void>) {
    this.loadQueue();
    this.setupListeners();
  }

  private setupListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.sync();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  private loadQueue() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        try {
          this.queue = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse offline sync queue:', e);
          this.queue = [];
        }
      }
    }
  }

  private saveQueue() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    }
  }

  public enqueue(actionType: string, payload: any): void {
    const action: SyncAction = {
      id: crypto.randomUUID(),
      type: actionType,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(action);
    this.saveQueue();

    if (this.isOnline) {
      this.sync();
    }
  }

  public async sync(): Promise<void> {
    if (!this.isOnline || this.isSyncing || this.queue.length === 0) {
      return;
    }

    this.isSyncing = true;

    try {
      // Process queue sequentially
      while (this.queue.length > 0) {
        const action = this.queue[0];
        
        try {
          await this.syncCallback(action);
          // Only remove on success
          this.queue.shift();
          this.saveQueue();
        } catch (error) {
          action.retryCount++;
          this.saveQueue();
          console.error(`Failed to sync action ${action.id}:`, error);
          // On failure, stop syncing and wait for next online event or retry interval
          break;
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}
