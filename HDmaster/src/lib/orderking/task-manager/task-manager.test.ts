import test from 'node:test';
import assert from 'node:assert';
import { TaskStore } from './task-store';
import { PreemptionEngine, PriorityQueue } from './preemption-engine';

test('TaskStore - create, pause, resume, getActive', () => {
  const store = new TaskStore();
  
  const task = store.create({ id: 't1', priority: 5, artifacts: ['a1'], context: { x: 1 } });
  assert.strictEqual(task.id, 't1');
  assert.strictEqual(task.priority, 5);
  assert.strictEqual(task.status, 'pending');
  assert.deepStrictEqual(task.artifacts, ['a1']);
  assert.deepStrictEqual(task.context, { x: 1 });

  store.updateStatus('t1', 'running');
  assert.strictEqual(store.getActive().length, 1);
  assert.strictEqual(store.getActive()[0].id, 't1');

  store.pause('t1');
  assert.strictEqual(store.get('t1')?.status, 'paused');
  assert.strictEqual(store.getActive().length, 0);

  store.resume('t1');
  assert.strictEqual(store.get('t1')?.status, 'running');
  assert.strictEqual(store.getActive().length, 1);
});

test('PriorityQueue - max heap behavior with stability', () => {
  const pq = new PriorityQueue<{ id: string }>();
  pq.enqueue({ id: 't1' }, 5);
  pq.enqueue({ id: 't2' }, 10);
  pq.enqueue({ id: 't3' }, 1);
  pq.enqueue({ id: 't4' }, 7);
  pq.enqueue({ id: 't5' }, 7); // t4 and t5 have same priority

  assert.strictEqual(pq.dequeue()?.id, 't2'); // 10
  assert.strictEqual(pq.dequeue()?.id, 't4'); // 7 (inserted first)
  assert.strictEqual(pq.dequeue()?.id, 't5'); // 7
  assert.strictEqual(pq.dequeue()?.id, 't1'); // 5
  assert.strictEqual(pq.dequeue()?.id, 't3'); // 1
  assert.strictEqual(pq.dequeue(), undefined);
});

test('PreemptionEngine - submit under concurrency limit', () => {
  const store = new TaskStore();
  const engine = new PreemptionEngine(2);

  const t1 = store.create({ priority: 5 });
  const decision = engine.submit(t1, store);

  assert.strictEqual(decision.action, 'run');
  assert.strictEqual(t1.status, 'running');
});

test('PreemptionEngine - queues when full and lower priority', () => {
  const store = new TaskStore();
  const engine = new PreemptionEngine(1);

  const t1 = store.create({ priority: 8 });
  engine.submit(t1, store);
  assert.strictEqual(t1.status, 'running');

  const t2 = store.create({ priority: 5 });
  const decision2 = engine.submit(t2, store);
  
  assert.strictEqual(decision2.action, 'queue');
  assert.strictEqual(t2.status, 'pending');
});

test('PreemptionEngine - preempts lower priority task', () => {
  const store = new TaskStore();
  const engine = new PreemptionEngine(1);

  const t1 = store.create({ priority: 5 });
  engine.submit(t1, store);
  assert.strictEqual(t1.status, 'running');

  // t2 has higher priority, should preempt t1
  const t2 = store.create({ priority: 8 });
  const decision = engine.submit(t2, store);

  assert.strictEqual(decision.action, 'preempt');
  assert.deepStrictEqual(decision.preemptedTaskIds, [t1.id]);
  
  assert.strictEqual(t2.status, 'running');
  assert.strictEqual(t1.status, 'paused');
});

test('PreemptionEngine - next() resumes preempted task', () => {
  const store = new TaskStore();
  const engine = new PreemptionEngine(1);

  const t1 = store.create({ priority: 5, artifacts: ['file.txt'] });
  engine.submit(t1, store);

  const t2 = store.create({ priority: 8 });
  engine.submit(t2, store);

  assert.strictEqual(t1.status, 'paused');
  assert.strictEqual(t2.status, 'running');

  // t2 completes
  store.updateStatus(t2.id, 'completed');
  
  // engine schedules next
  const nextTask = engine.next(store);
  
  assert.strictEqual(nextTask?.id, t1.id);
  assert.strictEqual(t1.status, 'running');
  // ensures artifacts are preserved
  assert.deepStrictEqual(t1.artifacts, ['file.txt']);
});
