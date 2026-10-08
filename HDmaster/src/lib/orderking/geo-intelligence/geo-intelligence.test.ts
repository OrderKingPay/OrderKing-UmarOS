import test from 'node:test';
import assert from 'node:assert';
import { GeographicIntelligenceEngine } from './index.ts';

test('Geographic Intelligence Engine - Adjusts to local context', () => {
  const engine = new GeographicIntelligenceEngine();
  
  const resultRain = engine.analyzeLocalDemand({
    country: 'IND', state: 'MH', city: 'Mumbai', locality: 'Bandra', isRural: false, weather: 'RAIN'
  }, 100);
  
  assert.strictEqual(resultRain.isServiceable, true);
  assert.strictEqual(resultRain.recommendedDeliveryFeeMultiplier, 1.5);
  
  const resultExtreme = engine.analyzeLocalDemand({
    country: 'IND', state: 'MH', city: 'Mumbai', locality: 'Bandra', isRural: false, weather: 'EXTREME'
  }, 100);
  
  assert.strictEqual(resultExtreme.isServiceable, false); // Safety boundary enforced
});
