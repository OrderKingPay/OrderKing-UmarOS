import { getSql } from '@/lib/db';

export async function withTrace<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = process.hrtime.bigint();
  
  try {
    return await fn();
  } finally {
    const end = process.hrtime.bigint();
    const durationNs = end - start;
    const durationMs = Number(durationNs / 1_000_000n);
    
    if (durationMs > 500) {
      // Non-blocking asynchronous DB insert for slow traces
      Promise.resolve().then(async () => {
        try {
          const sql = await getSql();
          await sql`
            INSERT INTO apm_slow_traces (name, duration_ms, created_at)
            VALUES (${name}, ${durationMs}, NOW())
          `;
        } catch (error) {
          console.error(`[withTrace] Failed to log slow trace '${name}':`, error);
        }
      });
    }
  }
}
