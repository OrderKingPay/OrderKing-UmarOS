export interface CircuitBreakerLike {
  execute<T>(action: () => Promise<T>): Promise<T>;
}

export interface BulkheadLike {
  execute<T>(action: () => Promise<T>): Promise<T>;
}

export interface ContainmentControllerLike {
  execute(): Promise<void>;
}

export async function testCircuitBreakerResilience(
  breaker: CircuitBreakerLike,
  faultyFn: () => Promise<any>,
  iterations: number = 100
): Promise<{ successes: number; failures: number; shortCircuits: number }> {
  let successes = 0;
  let failures = 0;
  let shortCircuits = 0;

  for (let i = 0; i < iterations; i++) {
    try {
      await breaker.execute(faultyFn);
      successes++;
    } catch (error: any) {
      if (
        error &&
        error.message &&
        (error.message.includes('open') || error.message.includes('short'))
      ) {
        shortCircuits++;
      } else {
        failures++;
      }
    }
  }

  return { successes, failures, shortCircuits };
}

export async function testBulkheadResilience(
  bulkhead: BulkheadLike,
  concurrentLoad: number
): Promise<{ successes: number; rejections: number }> {
  let successes = 0;
  let rejections = 0;

  const tasks = Array.from({ length: concurrentLoad }, async () => {
    try {
      await bulkhead.execute(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20)); // simulated work
      });
      successes++;
    } catch (error: any) {
      rejections++;
    }
  });

  await Promise.all(tasks);

  return { successes, rejections };
}

export async function measureContainmentTime(
  controller: ContainmentControllerLike
): Promise<number> {
  const start = Date.now();
  try {
    await controller.execute();
  } catch (error) {
    // Expected to potentially fail
  }
  const end = Date.now();
  return end - start;
}
