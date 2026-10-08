import { getSql } from "../../db.ts";

export interface EventMessage {
  id: string;
  topic: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  last_error: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export type EventHandler = (payload: any, msg: EventMessage) => Promise<void>;

export class DurableEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  private isPolling = false;
  private pollIntervalMs = 2000;
  private maxAttempts = 5;
  private activePollPromise: Promise<void> | null = null;

  constructor(options?: { pollIntervalMs?: number; maxAttempts?: number }) {
    if (options?.pollIntervalMs) this.pollIntervalMs = options.pollIntervalMs;
    if (options?.maxAttempts) this.maxAttempts = options.maxAttempts;
  }

  async publish(topic: string, payload: any) {
    const sql = await getSql();
    const rows = await sql.query<EventMessage>(
      `INSERT INTO durable_event_bus (topic, payload)
       VALUES ($1, $2)
       RETURNING *`,
      [topic, payload]
    );
    return rows[0];
  }

  subscribe(topic: string, handler: EventHandler) {
    let topicHandlers = this.handlers.get(topic);
    if (!topicHandlers) {
      topicHandlers = [];
      this.handlers.set(topic, topicHandlers);
    }
    topicHandlers.push(handler);
  }

  start() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.activePollPromise = this.poll();
  }

  stop() {
    this.isPolling = false;
  }

  async waitStop() {
    this.stop();
    if (this.activePollPromise) {
      await this.activePollPromise;
    }
  }

  private async poll() {
    while (this.isPolling) {
      try {
        await this.processNextBatch();
      } catch (err) {
        console.error('[DurableEventBus] Polling error:', err);
      }
      
      if (this.isPolling) {
        await new Promise(resolve => setTimeout(resolve, this.pollIntervalMs));
      }
    }
  }

  private async processNextBatch() {
    const sql = await getSql();
    
    const topics = Array.from(this.handlers.keys());
    if (topics.length === 0) return;

    const messages = await sql.query<EventMessage>(
      `UPDATE durable_event_bus
       SET status = 'processing', locked_at = NOW(), attempts = attempts + 1, updated_at = NOW()
       WHERE id IN (
         SELECT id FROM durable_event_bus
         WHERE status = 'pending' AND topic = ANY($1::varchar[])
         ORDER BY created_at ASC
         LIMIT 10
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`,
      [topics]
    );

    for (const msg of messages) {
      const topicHandlers = this.handlers.get(msg.topic) || [];
      let success = true;
      let lastErrorStr = '';

      for (const handler of topicHandlers) {
         try {
           await handler(msg.payload, msg);
         } catch (error: any) {
           success = false;
           lastErrorStr = error?.message || String(error);
           console.error(`[DurableEventBus] Handler error for topic ${msg.topic}:`, error);
           break;
         }
      }

      if (success) {
        await sql.query(
          `UPDATE durable_event_bus SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [msg.id]
        );
      } else {
        const isExhausted = msg.attempts >= this.maxAttempts;
        const newStatus = isExhausted ? 'failed' : 'pending';
        
        await sql.query(
          `UPDATE durable_event_bus 
           SET status = $1, last_error = $2, locked_at = NULL, updated_at = NOW() 
           WHERE id = $3`,
          [newStatus, lastErrorStr, msg.id]
        );
      }
    }

    // Recover stale messages
    await sql.query(`
      UPDATE durable_event_bus 
      SET status = 'pending', locked_at = NULL, updated_at = NOW()
      WHERE status = 'processing' AND locked_at < NOW() - INTERVAL '5 minutes'
    `);
  }
}

export const eventBus = new DurableEventBus();
