import test from 'node:test';
import assert from 'node:assert';
import { LineageTracker } from './lineage-tracker';

test('LineageTracker - record and retrieve lineage', () => {
  const tracker = new LineageTracker();
  
  tracker.recordTransformation('A', 'B', 'map', { op: 'x2' });
  tracker.recordTransformation('B', 'C', 'filter', { criteria: '>10' });
  tracker.recordTransformation('D', 'C', 'merge');

  const lineageC = tracker.getLineage('C');
  assert.strictEqual(lineageC.length, 3);
  assert.ok(lineageC.some(e => e.sourceId === 'B' && e.targetId === 'C'));
  assert.ok(lineageC.some(e => e.sourceId === 'D' && e.targetId === 'C'));
  assert.ok(lineageC.some(e => e.sourceId === 'A' && e.targetId === 'B'));

  const descendantsA = tracker.getDescendants('A');
  assert.strictEqual(descendantsA.length, 2);
  assert.ok(descendantsA.some(e => e.sourceId === 'A' && e.targetId === 'B'));
  assert.ok(descendantsA.some(e => e.sourceId === 'B' && e.targetId === 'C'));
});

test('LineageTracker - cyclic dependency handling', () => {
  const tracker = new LineageTracker();
  tracker.recordTransformation('A', 'B', 'map');
  tracker.recordTransformation('B', 'C', 'map');
  tracker.recordTransformation('C', 'A', 'map');

  const lineage = tracker.getLineage('A');
  assert.strictEqual(lineage.length, 3);

  const descendants = tracker.getDescendants('A');
  assert.strictEqual(descendants.length, 3);
});

/* test('ImpactAnalyzer - analyzeImpact', () => { ... })
test('ImpactAnalyzer - findRoot', () => { ... }) */
