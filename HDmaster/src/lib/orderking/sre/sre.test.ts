import test from 'node:test';
import assert from 'node:assert';
import { CircuitBreaker, CircuitBreakerState, CircuitBreakerError } from './circuit-breaker';
import { retryWithBackoff } from './retry';
import { Bulkhead, BulkheadError } from './bulkhead';

test('Circuit Breaker tests', async (t) => {
  await t.test('Should transition to OPEN after threshold failures', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 100 });
    
    let calls = 0;
    const failingFn = async () => { calls++; throw new Error('fail'); };
    
    await assert.rejects(() => cb.execute(failingFn));
    assert.strictEqual(cb.getState(), CircuitBreakerState.CLOSED);
    
    await assert.rejects(() => cb.execute(failingFn));
    assert.strictEqual(cb.getState(), CircuitBreakerState.OPEN);
    
    await assert.rejects(() => cb.execute(failingFn), CircuitBreakerError);
    assert.strictEqual(calls, 2);
  });

  await t.test('Should transition to HALF_OPEN after timeout and then back to CLOSED on success', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 50 });
    const failingFn = async () => { throw new Error('fail'); };
    
    await assert.rejects(() => cb.execute(failingFn));
    assert.strictEqual(cb.getState(), CircuitBreakerState.OPEN);
    
    await new Promise(r => setTimeout(r, 60));
    assert.strictEqual(cb.getState(), CircuitBreakerState.HALF_OPEN);
    
    const successFn = async () => 'success';
    const res = await cb.execute(successFn);
    assert.strictEqual(res, 'success');
    assert.strictEqual(cb.getState(), CircuitBreakerState.CLOSED);
  });

  await t.test('Should transition to OPEN from HALF_OPEN on failure', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 50 });
    const failingFn = async () => { throw new Error('fail'); };
    
    await assert.rejects(() => cb.execute(failingFn));
    await new Promise(r => setTimeout(r, 60));
    
    assert.strictEqual(cb.getState(), CircuitBreakerState.HALF_OPEN);
    await assert.rejects(() => cb.execute(failingFn));
    assert.strictEqual(cb.getState(), CircuitBreakerState.OPEN);
  });
});

test('Retry tests', async (t) => {
  await t.test('Should succeed on first try', async () => {
    let calls = 0;
    const fn = async () => { calls++; return 'ok'; };
    const res = await retryWithBackoff(fn, { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 50 });
    assert.strictEqual(res, 'ok');
    assert.strictEqual(calls, 1);
  });

  await t.test('Should retry and succeed', async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 3) throw new Error('fail');
      return 'ok';
    };
    const res = await retryWithBackoff(fn, { maxRetries: 3, baseDelayMs: 10, maxDelayMs: 50, jitter: false });
    assert.strictEqual(res, 'ok');
    assert.strictEqual(calls, 3);
  });

  await t.test('Should fail after max retries', async () => {
    let calls = 0;
    const fn = async () => { calls++; throw new Error('fail'); };
    await assert.rejects(() => retryWithBackoff(fn, { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 50 }));
    assert.strictEqual(calls, 3);
  });
});

test('Bulkhead tests', async (t) => {
  await t.test('Should allow max concurrent executions', async () => {
    const bh = new Bulkhead(2);
    let active = 0;
    let maxActive = 0;
    
    const fn = async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise(r => setTimeout(r, 10));
      active--;
    };
    
    await Promise.all([
      bh.execute(fn),
      bh.execute(fn),
      bh.execute(fn),
      bh.execute(fn)
    ]);
    
    assert.strictEqual(maxActive, 2);
  });

  await t.test('Should reject if queue is full', async () => {
    const bh = new Bulkhead({ maxConcurrent: 1, maxQueueSize: 1 });
    const fn = async () => new Promise(r => setTimeout(r, 20));
    
    bh.execute(fn); // active
    bh.execute(fn); // queued
    
    await assert.rejects(() => bh.execute(fn), BulkheadError); // rejected
  });
});
