export interface FailedEvent {
  provider: string;
  payload: any;
  error: Error;
  timestamp: number;
}

export class DeadLetterQueue {
  private queue: FailedEvent[] = [];

  enqueue(event: Omit<FailedEvent, 'timestamp'>): void {
    this.queue.push({
      ...event,
      timestamp: Date.now(),
    });
  }

  drain(): FailedEvent[] {
    const drained = [...this.queue];
    this.queue = [];
    return drained;
  }

  size(): number {
    return this.queue.length;
  }
}
