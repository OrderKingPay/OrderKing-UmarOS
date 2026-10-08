export class BulkheadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BulkheadError';
  }
}

export interface BulkheadOptions {
  maxConcurrent: number;
  maxQueueSize?: number; // if undefined, queue is unbounded
}

export class Bulkhead {
  private maxConcurrent: number;
  private maxQueueSize?: number;
  private currentConcurrent: number = 0;
  private queue: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];

  constructor(maxConcurrent: number | BulkheadOptions) {
    if (typeof maxConcurrent === 'number') {
      this.maxConcurrent = maxConcurrent;
    } else {
      this.maxConcurrent = maxConcurrent.maxConcurrent;
      this.maxQueueSize = maxConcurrent.maxQueueSize;
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.currentConcurrent >= this.maxConcurrent) {
      if (this.maxQueueSize !== undefined && this.queue.length >= this.maxQueueSize) {
        throw new BulkheadError('Bulkhead queue is full');
      }

      await new Promise<void>((resolve, reject) => {
        this.queue.push({ resolve, reject });
      });
    }

    this.currentConcurrent++;

    try {
      return await fn();
    } finally {
      this.currentConcurrent--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next?.resolve();
      }
    }
  }
}
