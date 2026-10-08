import { test } from 'node:test';
import * as assert from 'node:assert';
import { createHmac } from 'crypto';
import { ReplayProtector, DeadLetterQueue, WebhookIngestion } from './index';

test('ReplayProtector - should prevent replay attacks', () => {
  const protector = new ReplayProtector(1000); // 1s TTL
  const eventId = 'event-1';

  assert.strictEqual(protector.isReplay(eventId), false);
  protector.markProcessed(eventId);
  assert.strictEqual(protector.isReplay(eventId), true);
});

test('DeadLetterQueue - should enqueue and drain events', () => {
  const dlq = new DeadLetterQueue();
  dlq.enqueue({ provider: 'stripe', payload: '{}', error: new Error('test') });
  
  assert.strictEqual(dlq.size(), 1);
  const events = dlq.drain();
  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].provider, 'stripe');
  assert.strictEqual(dlq.size(), 0);
});

test('WebhookIngestion - should ingest valid webhook', () => {
  const ingestion = new WebhookIngestion();
  const secret = 'my-secret';
  ingestion.register('stripe', secret);

  const payload = JSON.stringify({ id: 'evt_123', type: 'charge.succeeded' });
  const signature = createHmac('sha256', secret).update(payload).digest('hex');

  const result = ingestion.ingest('stripe', payload, signature);
  assert.strictEqual(result.success, true);
});

test('WebhookIngestion - should reject invalid signature', () => {
  const ingestion = new WebhookIngestion();
  ingestion.register('stripe', 'my-secret');

  const payload = JSON.stringify({ id: 'evt_123' });
  const signature = 'invalid-signature';

  const result = ingestion.ingest('stripe', payload, signature);
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.error, 'Invalid signature');
  
  const dlq = ingestion.getDeadLetterQueue();
  assert.strictEqual(dlq.size(), 1);
});

test('WebhookIngestion - should detect replay', () => {
  const ingestion = new WebhookIngestion();
  const secret = 'my-secret';
  ingestion.register('stripe', secret);

  const payload = JSON.stringify({ id: 'evt_replay' });
  const signature = createHmac('sha256', secret).update(payload).digest('hex');

  const result1 = ingestion.ingest('stripe', payload, signature);
  assert.strictEqual(result1.success, true);
  assert.strictEqual(result1.isReplay, undefined);

  const result2 = ingestion.ingest('stripe', payload, signature);
  assert.strictEqual(result2.success, true);
  assert.strictEqual(result2.isReplay, true);
});
