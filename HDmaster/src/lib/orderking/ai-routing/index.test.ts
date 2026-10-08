import { test } from 'node:test';
import * as assert from 'node:assert';
import { ModelRouter } from './index.ts';
import type { VirtualEndpoint } from './index.ts';

test('ModelRouter should route to the cheapest valid endpoint', async () => {
  const router = new ModelRouter();
  const response = await router.route('Hello', { maxCost: 0.05 });
  
  assert.strictEqual(response.provider, 'gemini');
  assert.strictEqual(response.cost, 0.005);
  assert.strictEqual(response.content, '[Gemini] Response to: Hello');
});

test('ModelRouter should respect requiresVision constraint', async () => {
  const router = new ModelRouter();
  // Anthropic default has no vision, so should skip Anthropic if it was the cheapest. 
  // We'll provide custom to clearly test
  const endpoints: VirtualEndpoint[] = [
    { name: 'cheap-no-vision', supportsVision: false, costPerRequest: 0.01, execute: async () => 'no-vision' },
    { name: 'expensive-vision', supportsVision: true, costPerRequest: 0.04, execute: async () => 'vision' },
  ];
  const customRouter = new ModelRouter(endpoints);
  
  const response = await customRouter.route('Describe image', { maxCost: 0.05, requiresVision: true });
  assert.strictEqual(response.provider, 'expensive-vision');
});

test('ModelRouter should fallback to next endpoint on failure', async () => {
  const endpoints: VirtualEndpoint[] = [
    { 
      name: 'failing-cheap', 
      supportsVision: true, 
      costPerRequest: 0.01, 
      execute: async () => { throw new Error('Timeout'); } 
    },
    { 
      name: 'working-expensive', 
      supportsVision: true, 
      costPerRequest: 0.02, 
      execute: async () => 'Success!' 
    },
  ];
  const router = new ModelRouter(endpoints);
  
  const response = await router.route('Hello', { maxCost: 0.05 });
  assert.strictEqual(response.provider, 'working-expensive');
  assert.strictEqual(response.content, 'Success!');
});

test('ModelRouter should throw if all endpoints fail', async () => {
  const endpoints: VirtualEndpoint[] = [
    { 
      name: 'fail-1', 
      supportsVision: true, 
      costPerRequest: 0.01, 
      execute: async () => { throw new Error('Error 1'); } 
    },
    { 
      name: 'fail-2', 
      supportsVision: true, 
      costPerRequest: 0.02, 
      execute: async () => { throw new Error('Error 2'); } 
    },
  ];
  const router = new ModelRouter(endpoints);
  
  try {
    await router.route('Hello', { maxCost: 0.05 });
    assert.fail('Should have thrown an error');
  } catch (err: any) {
    assert.ok(err.message.includes('All suitable endpoints failed. Last error: Error 2'));
  }
});

test('ModelRouter should throw if constraints cannot be met', async () => {
  const router = new ModelRouter();
  try {
    await router.route('Hello', { maxCost: 0.001 }); // all default endpoints cost > 0.001
    assert.fail('Should have thrown an error');
  } catch (err: any) {
    assert.strictEqual(err.message, 'No models available meeting the given constraints.');
  }
});
