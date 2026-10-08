import { getSql } from '@/lib/db';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface SystemHealth {
  database: {
    status: HealthStatus;
    latencyMs: number;
  };
  cloudflare: {
    status: HealthStatus;
    latencyMs: number;
  };
  ai: {
    status: HealthStatus;
    configuredProviders: string[];
  };
  timestamp: string;
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout'));
    }, timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export async function checkSystemHealth(): Promise<SystemHealth> {
  const timeoutMs = 5000;
  const timestamp = new Date().toISOString();

  // 1. PostgreSQL Probe
  let dbStatus: HealthStatus = 'UNHEALTHY';
  let dbLatency = -1;
  try {
    const start = performance.now();
    const sql = await getSql();
    await withTimeout(sql`SELECT 1`, timeoutMs);
    dbLatency = Math.round(performance.now() - start);
    dbStatus = 'HEALTHY';
  } catch (err: any) {
    if (err.message === 'Timeout') {
      dbStatus = 'DEGRADED';
    } else {
      dbStatus = 'UNHEALTHY';
    }
  }

  // 2. Cloudflare API Probe
  let cfStatus: HealthStatus = 'UNHEALTHY';
  let cfLatency = -1;
  try {
    const start = performance.now();
    // We just check reachability, a 400/401 still means it's reachable.
    const res = await withTimeout(
      fetch('https://api.cloudflare.com/client/v4/user/tokens/verify'),
      timeoutMs
    );
    cfLatency = Math.round(performance.now() - start);
    if (res.status >= 500) {
      cfStatus = 'UNHEALTHY';
    } else {
      cfStatus = 'HEALTHY';
    }
  } catch (err: any) {
    if (err.message === 'Timeout') {
      cfStatus = 'DEGRADED';
    } else {
      cfStatus = 'UNHEALTHY';
    }
  }

  // 3. AI Provider Health
  const aiProviders: string[] = [];
  if (process.env.GEMINI_API_KEY) {
    aiProviders.push('gemini');
  }
  if (process.env.OPENAI_API_KEY) {
    aiProviders.push('openai');
  }
  if (process.env.ANTHROPIC_API_KEY) {
    aiProviders.push('anthropic');
  }
  
  const aiStatus: HealthStatus = aiProviders.length > 0 ? 'HEALTHY' : 'DEGRADED';

  return {
    database: {
      status: dbStatus,
      latencyMs: dbLatency,
    },
    cloudflare: {
      status: cfStatus,
      latencyMs: cfLatency,
    },
    ai: {
      status: aiStatus,
      configuredProviders: aiProviders,
    },
    timestamp,
  };
}
