import { EventEmitter } from 'node:events';

export type MqttMessage = {
  topic: string;
  payload: any;
  timestamp: Date;
};

export type MessageHandler = (message: MqttMessage) => void;

interface Subscription {
  topicFilter: string;
  handler: MessageHandler;
}

export class IoTBroker {
  private subscriptions: Map<string, Set<Subscription>> = new Map();
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  /**
   * Publishes a payload to a specific topic.
   */
  public publish(topic: string, payload: any): void {
    const message: MqttMessage = {
      topic,
      payload,
      timestamp: new Date()
    };
    
    // Find all matching subscriptions and trigger them
    for (const [clientId, subs] of this.subscriptions.entries()) {
      for (const sub of subs) {
        if (this.topicMatches(sub.topicFilter, topic)) {
          // Asynchronously call the handler to prevent blocking
          setImmediate(() => {
            try {
              sub.handler(message);
            } catch (error) {
              console.error(`Error in MQTT handler for client ${clientId} on topic ${sub.topicFilter}:`, error);
            }
          });
        }
      }
    }
  }

  /**
   * Subscribes a client to a topic filter.
   */
  public subscribe(clientId: string, topicFilter: string, handler: MessageHandler): void {
    let clientSubs = this.subscriptions.get(clientId);
    if (!clientSubs) {
      clientSubs = new Set();
      this.subscriptions.set(clientId, clientSubs);
    }
    clientSubs.add({ topicFilter, handler });
  }

  /**
   * Unsubscribes a client from a specific topic filter.
   */
  public unsubscribe(clientId: string, topicFilter: string): void {
    const clientSubs = this.subscriptions.get(clientId);
    if (clientSubs) {
      for (const sub of clientSubs) {
        if (sub.topicFilter === topicFilter) {
          clientSubs.delete(sub);
        }
      }
      if (clientSubs.size === 0) {
        this.subscriptions.delete(clientId);
      }
    }
  }

  /**
   * Disconnects a client entirely.
   */
  public disconnectClient(clientId: string): void {
    this.subscriptions.delete(clientId);
  }

  /**
   * Matches an MQTT topic filter against an actual topic string.
   * Supports '+' (single level wildcard) and '#' (multi-level wildcard).
   */
  private topicMatches(filter: string, topic: string): boolean {
    if (filter === topic) return true;

    const filterParts = filter.split('/');
    const topicParts = topic.split('/');

    for (let i = 0; i < filterParts.length; i++) {
      const f = filterParts[i];
      if (f === '#') {
        return true;
      }
      
      if (f === '+') {
        if (i >= topicParts.length) return false;
        continue;
      }
      
      if (f !== topicParts[i]) {
        return false;
      }
    }
    
    // If we've reached the end of the filter, the topic must also have no more parts
    // unless the last part of filter was #, which is handled above.
    return filterParts.length === topicParts.length;
  }
}
