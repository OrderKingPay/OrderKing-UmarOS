/**
 * OrderKing Partner Realtime Dead-Letter Queue (DLQ) Manager
 *
 * Implements exponential backoff retry semantics for failed Supabase Realtime
 * event sync, KOT notifications, and kitchen mutations.
 */

export interface DeadLetterEntry<T = unknown> {
  id: string;
  queueName: string;
  payload: T;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  status: "PENDING" | "PROCESSING" | "RETRYING" | "FAILED" | "RESOLVED";
  nextRetryAt: number; // Unix timestamp in ms
  createdAt: number;
  updatedAt: number;
}

export interface DlqRetryConfig {
  baseDelayMs?: number;
  maxDelayMs?: number;
  maxRetries?: number;
  jitterFactor?: number;
}

export const DEFAULT_DLQ_CONFIG: Required<DlqRetryConfig> = {
  baseDelayMs: 2000,
  maxDelayMs: 300000, // 5 minutes max
  maxRetries: 5,
  jitterFactor: 0.2,
};

/**
 * Calculates exponential backoff delay in milliseconds with randomized jitter.
 */
export function calculateDlqBackoff(
  retryCount: number,
  config: DlqRetryConfig = {}
): number {
  const { baseDelayMs, maxDelayMs, jitterFactor } = {
    ...DEFAULT_DLQ_CONFIG,
    ...config,
  };

  const exponentialDelay = Math.min(
    baseDelayMs * Math.pow(2, Math.max(0, retryCount)),
    maxDelayMs
  );

  const jitterRange = exponentialDelay * jitterFactor;
  const jitter = Math.floor((Math.random() * 2 - 1) * jitterRange);

  return Math.max(baseDelayMs, exponentialDelay + jitter);
}

export class DeadLetterQueueManager<T = unknown> {
  private queue: Map<string, DeadLetterEntry<T>> = new Map();
  private config: Required<DlqRetryConfig>;

  constructor(
    public readonly queueName: string,
    config?: DlqRetryConfig
  ) {
    this.config = { ...DEFAULT_DLQ_CONFIG, ...config };
  }

  public enqueue(
    payload: T,
    errorMessage?: string,
    maxRetries?: number
  ): DeadLetterEntry<T> {
    const id = crypto.randomUUID();
    const now = Date.now();
    const entry: DeadLetterEntry<T> = {
      id,
      queueName: this.queueName,
      payload,
      errorMessage,
      retryCount: 0,
      maxRetries: maxRetries ?? this.config.maxRetries,
      status: "PENDING",
      nextRetryAt: now,
      createdAt: now,
      updatedAt: now,
    };

    this.queue.set(id, entry);
    return entry;
  }

  public getReadyForRetry(now: number = Date.now()): DeadLetterEntry<T>[] {
    const ready: DeadLetterEntry<T>[] = [];
    for (const entry of this.queue.values()) {
      if (
        (entry.status === "PENDING" || entry.status === "RETRYING") &&
        entry.nextRetryAt <= now
      ) {
        ready.push(entry);
      }
    }
    return ready.sort((a, b) => a.nextRetryAt - b.nextRetryAt);
  }

  public async processRetries(
    handler: (payload: T, entry: DeadLetterEntry<T>) => Promise<boolean>,
    now: number = Date.now()
  ): Promise<{ resolved: number; failed: number; retried: number }> {
    const ready = this.getReadyForRetry(now);
    let resolved = 0;
    let failed = 0;
    let retried = 0;

    for (const entry of ready) {
      entry.status = "PROCESSING";
      entry.updatedAt = Date.now();

      try {
        const success = await handler(entry.payload, entry);
        if (success) {
          entry.status = "RESOLVED";
          entry.updatedAt = Date.now();
          this.queue.delete(entry.id);
          resolved++;
        } else {
          throw new Error("Handler failed to process retry");
        }
      } catch (err: any) {
        const nextRetries = entry.retryCount + 1;
        entry.retryCount = nextRetries;
        entry.errorMessage = String(err?.message || err);
        entry.updatedAt = Date.now();

        if (nextRetries >= entry.maxRetries) {
          entry.status = "FAILED";
          failed++;
        } else {
          entry.status = "RETRYING";
          const backoffMs = calculateDlqBackoff(nextRetries, this.config);
          entry.nextRetryAt = Date.now() + backoffMs;
          retried++;
        }
      }
    }

    return { resolved, failed, retried };
  }

  public getStats(): { pending: number; retrying: number; failed: number; total: number } {
    let pending = 0;
    let retrying = 0;
    let failed = 0;

    for (const entry of this.queue.values()) {
      if (entry.status === "PENDING") pending++;
      else if (entry.status === "RETRYING" || entry.status === "PROCESSING") retrying++;
      else if (entry.status === "FAILED") failed++;
    }

    return { pending, retrying, failed, total: this.queue.size };
  }
}
