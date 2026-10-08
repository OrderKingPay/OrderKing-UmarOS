import { getSql } from '../../db';

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  p50: number;
  p95: number;
  p99: number;
  totalTimeMs: number;
}

export async function runLoadTest(url: string, concurrentRequests: number, totalRequests: number): Promise<LoadTestResult> {
  const latencies: number[] = [];
  let successfulRequests = 0;
  let failedRequests = 0;
  
  const sql = await getSql();

  const startTime = performance.now();
  let currentRequest = 0;

  async function worker() {
    while (currentRequest < totalRequests) {
      const reqId = currentRequest++;
      if (reqId >= totalRequests) break;
      
      const reqStart = performance.now();
      try {
        const res = await fetch(url);
        if (res.ok) {
          successfulRequests++;
        } else {
          failedRequests++;
        }
      } catch (err) {
        failedRequests++;
      } finally {
        latencies.push(performance.now() - reqStart);
      }
    }
  }

  const workers = Array(concurrentRequests).fill(null).map(() => worker());
  await Promise.all(workers);
  
  const totalTimeMs = performance.now() - startTime;
  latencies.sort((a, b) => a - b);
  
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    p50,
    p95,
    p99,
    totalTimeMs
  };
}
