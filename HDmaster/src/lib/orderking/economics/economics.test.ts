import test from 'node:test';
import assert from 'node:assert';
import { MutualValueEconomicEngine } from './index.ts';

test('Mutual Value Economic Engine - Calculates transparent economics', () => {
  const engine = new MutualValueEconomicEngine();
  const result = engine.optimizeTransaction(100, 0.15, 20, 5);
  
  assert.strictEqual(result.grossValue, 115); // 100 + 20 - 5
  assert.strictEqual(result.partnerEarned, 85); // 100 * 0.85
  assert.strictEqual(result.riderEarned, 20); // delivery fee
  assert.strictEqual(result.customerSaved, 5); // subsidy
  assert.strictEqual(result.platformCost, 5);
  assert.strictEqual(result.founderEarned, 10); // 15 commission - 5 subsidy
});
