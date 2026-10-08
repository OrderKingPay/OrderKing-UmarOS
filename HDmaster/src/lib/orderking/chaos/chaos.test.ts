import test from 'node:test';
import assert from 'node:assert';
import { FaultInjector } from './fault-injector';
import {
  testCircuitBreakerResilience,
  testBulkheadResilience,
  measureContainmentTime,
  CircuitBreakerLike,
  BulkheadLike,
  ContainmentControllerLike,
} from './resilience-tester';

test('FaultInjector - injectLatency', async () => {
  const fn = async () => 'ok';
  const delayed = FaultInjector.injectLatency(fn, 50);

  const start = Date.now();
  const res = await delayed();
  const end = Date.now();

  assert.strictEqual(res, 'ok');
  assert.ok(end - start >= 45, 'Should have delayed by ~50ms');
});

test('FaultInjector - injectFailure', async () => {
  const fn = async () => 'ok';
  const failing = FaultInjector.injectFailure(fn, 1.0); // 100% failure rate

  await assert.rejects(failing, /Injected failure/);

  const passing = FaultInjector.injectFailure(fn, 0.0); // 0% failure rate
  assert.strictEqual(await passing(), 'ok');
});

test('FaultInjector - injectTimeout', async () => {
  const fn = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return 'ok';
  };

  const timeoutFn = FaultInjector.injectTimeout(fn, 20);
  await assert.rejects(timeoutFn, /Injected timeout/);

  const fastFn = async () => 'fast';
  const noTimeoutFn = FaultInjector.injectTimeout(fastFn, 50);
  assert.strictEqual(await noTimeoutFn(), 'fast');
});

test('ResilienceTester - testCircuitBreakerResilience', async () => {
  let callCount = 0;
  let state = 'closed';

  const mockBreaker: CircuitBreakerLike = {
    execute: async <T>(action: () => Promise<T>): Promise<T> => {
      if (state === 'open') {
        throw new Error('Circuit open');
      }
      callCount++;
      try {
        const result = await action();
        return result;
      } catch (err) {
        if (callCount >= 3) {
          state = 'open'; // Trip after 3 calls
        }
        throw err;
      }
    },
  };

  const faultyFn = FaultInjector.injectFailure(async () => 'ok', 1.0);
  const result = await testCircuitBreakerResilience(mockBreaker, faultyFn, 10);

  assert.strictEqual(result.successes, 0);
  assert.strictEqual(result.failures, 3);
  assert.strictEqual(result.shortCircuits, 7);
});

test('ResilienceTester - testBulkheadResilience', async () => {
  let active = 0;
  const maxActive = 2;

  const mockBulkhead: BulkheadLike = {
    execute: async <T>(action: () => Promise<T>): Promise<T> => {
      if (active >= maxActive) {
        throw new Error('Bulkhead rejected');
      }
      active++;
      try {
        return await action();
      } finally {
        active--;
      }
    },
  };

  const result = await testBulkheadResilience(mockBulkhead, 5);

  assert.strictEqual(result.successes, 2);
  assert.strictEqual(result.rejections, 3);
});

test('ResilienceTester - measureContainmentTime', async () => {
  const mockController: ContainmentControllerLike = {
    execute: async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    },
  };

  const time = await measureContainmentTime(mockController);
  assert.ok(time >= 25, 'Should take at least 30ms');
  assert.ok(time < 150, 'Should not take significantly longer than 30ms');
});
