import { Pool } from "pg";

export type EventType = "ORDER_CREATED" | "PAYMENT_CAPTURED" | "ORDER_DISPATCHED" | "ORDER_DELIVERED";

export interface DomainEvent<T = any> {
  id: string;
  type: EventType;
  payload: T;
  createdAt: Date;
  processedAt?: Date;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  error?: string;
}

export interface EventBusConfig {
  connectionString?: string;
  pool?: Pool;
}

export class PostgresEventBus {
  private pool: Pool;
  private isProcessing: boolean = false;
  private processInterval?: NodeJS.Timeout;

  constructor(config: EventBusConfig = {}) {
    if (config.pool) {
      this.pool = config.pool;
    } else {
      const connectionString = config.connectionString || process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("PostgresEventBus requires a connectionString or an existing pg Pool. Set DATABASE_URL in environment.");
      }
      this.pool = new Pool({ connectionString });
    }
  }

  async initialize() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS event_queue (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type VARCHAR(255) NOT NULL,
          payload JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          processed_at TIMESTAMP WITH TIME ZONE,
          status VARCHAR(50) DEFAULT 'PENDING',
          error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_event_queue_status ON event_queue(status);
      `);
    } finally {
      client.release();
    }
  }

  async publish<T>(type: EventType, payload: T): Promise<string> {
    const query = `
      INSERT INTO event_queue (type, payload)
      VALUES ($1, $2)
      RETURNING id;
    `;
    const res = await this.pool.query(query, [type, JSON.stringify(payload)]);
    return res.rows[0].id;
  }

  async startProcessing(intervalMs: number = 5000, handler: (event: DomainEvent) => Promise<void>) {
    if (this.processInterval) {
      throw new Error("Event processor is already running.");
    }

    this.processInterval = setInterval(() => this.processNextBatch(handler), intervalMs);
  }

  stopProcessing() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = undefined;
    }
  }

  private async processNextBatch(handler: (event: DomainEvent) => Promise<void>) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      
      const selectQuery = `
        SELECT id, type, payload, created_at as "createdAt", status
        FROM event_queue
        WHERE status = 'PENDING' OR status = 'FAILED'
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 10;
      `;
      const res = await client.query(selectQuery);
      
      if (res.rows.length === 0) {
        await client.query("COMMIT");
        return;
      }

      for (const row of res.rows) {
        const updateProcessingQuery = `UPDATE event_queue SET status = 'PROCESSING' WHERE id = $1`;
        await client.query(updateProcessingQuery, [row.id]);
        
        try {
          await handler({
            id: row.id,
            type: row.type as EventType,
            payload: row.payload,
            createdAt: row.createdAt,
            status: "PROCESSING"
          });
          
          const completeQuery = `UPDATE event_queue SET status = 'COMPLETED', processed_at = NOW() WHERE id = $1`;
          await client.query(completeQuery, [row.id]);
        } catch (err: any) {
          const failQuery = `UPDATE event_queue SET status = 'FAILED', error = $1 WHERE id = $2`;
          await client.query(failQuery, [err.message || String(err), row.id]);
        }
      }
      
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error processing event batch", err);
    } finally {
      this.isProcessing = false;
      client.release();
    }
  }
}
