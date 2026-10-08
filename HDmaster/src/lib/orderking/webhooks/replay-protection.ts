export class ReplayProtector {
  private processedEvents = new Map<string, number>();
  private ttlMs: number;

  constructor(ttlMs: number = 300000) { // Default 5 minutes
    this.ttlMs = ttlMs;
  }

  isReplay(eventId: string): boolean {
    this.cleanup();
    return this.processedEvents.has(eventId);
  }

  markProcessed(eventId: string): void {
    this.cleanup();
    this.processedEvents.set(eventId, Date.now());
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [eventId, timestamp] of this.processedEvents.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.processedEvents.delete(eventId);
      }
    }
  }
}
