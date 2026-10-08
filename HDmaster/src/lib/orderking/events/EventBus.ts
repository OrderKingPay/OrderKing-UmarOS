export interface EventPayload {
  [key: string]: any;
}

export type EventHandler<T = EventPayload> = (payload: T) => Promise<void> | void;

export class EventBus {
  private subscribers: Map<string, EventHandler<any>[]> = new Map();

  /**
   * Subscribe to an event
   */
  public subscribe<T = EventPayload>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.subscribers.get(eventType) || [];
    handlers.push(handler);
    this.subscribers.set(eventType, handlers);
  }

  /**
   * Unsubscribe from an event
   */
  public unsubscribe<T = EventPayload>(eventType: string, handler: EventHandler<T>): void {
    const handlers = this.subscribers.get(eventType);
    if (handlers) {
      this.subscribers.set(eventType, handlers.filter(h => h !== handler));
    }
  }

  /**
   * Publish an event to all subscribers asynchronously
   * This ensures the main thread is not blocked (ZERO SYNCHRONOUS BOTTLENECKS)
   */
  public publish<T = EventPayload>(eventType: string, payload: T): void {
    const handlers = this.subscribers.get(eventType);
    if (!handlers || handlers.length === 0) {
      return;
    }

    // Execute handlers asynchronously on the next tick
    setTimeout(() => {
      for (const handler of handlers) {
        // Fire and forget each handler independently
        Promise.resolve(handler(payload)).catch(error => {
          console.error(`[EventBus] Error processing event "${eventType}":`, error);
        });
      }
    }, 0);
  }
}

// Global instance for application-wide event broadcasting
export const eventBus = new EventBus();
