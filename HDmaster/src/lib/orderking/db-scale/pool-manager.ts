import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Prevent connection exhaustion by limiting max connections.
const commonConfig = {
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

let readPool: NeonPool | null = null;
let writePool: NeonPool | null = null;

export function getReadPool(): NeonPool {
  if (!readPool) {
    const connectionString = process.env.DATABASE_READ_URL || process.env.DATABASE_URL;
    readPool = new NeonPool({ ...commonConfig, connectionString });
  }
  return readPool;
}

export function getWritePool(): NeonPool {
  if (!writePool) {
    const connectionString = process.env.DATABASE_URL;
    writePool = new NeonPool({ ...commonConfig, connectionString });
  }
  return writePool;
}

export async function closePools(): Promise<void> {
  const promises = [];
  if (readPool) promises.push(readPool.end());
  if (writePool) promises.push(writePool.end());
  await Promise.all(promises);
  readPool = null;
  writePool = null;
}
