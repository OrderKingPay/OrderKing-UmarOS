import test from 'node:test';
import assert from 'node:assert';
import { TaskDecomposer, Step } from './task-decomposer';
import { Orchestrator } from './orchestrator';

test('TaskDecomposer - setup project', () => {
  const decomposer = new TaskDecomposer();
  const plan = decomposer.decompose('setup project');
  assert.strictEqual(plan.steps.length, 4);
  assert.strictEqual(plan.steps[0].id, 'init-repo');
  assert.deepStrictEqual(plan.steps[2].dependencies, ['install-deps']);
  assert.strictEqual(plan.steps[2].parallelizable, true);
  assert.strictEqual(plan.steps[3].parallelizable, true);
});

test('TaskDecomposer - generic then', () => {
  const decomposer = new TaskDecomposer();
  const plan = decomposer.decompose('echo hello then echo world');
  assert.strictEqual(plan.steps.length, 2);
  assert.strictEqual(plan.steps[0].id, 'step-0');
  assert.strictEqual(plan.steps[1].id, 'step-1');
  assert.deepStrictEqual(plan.steps[1].dependencies, ['step-0']);
});

test('TaskDecomposer - generic and', () => {
  const decomposer = new TaskDecomposer();
  const plan = decomposer.decompose('build frontend and build backend');
  assert.strictEqual(plan.steps.length, 2);
  assert.strictEqual(plan.steps[0].parallelizable, true);
  assert.strictEqual(plan.steps[1].parallelizable, true);
  assert.deepStrictEqual(plan.steps[0].dependencies, []);
  assert.deepStrictEqual(plan.steps[1].dependencies, []);
});

test('Orchestrator - success scenario', async () => {
  const orchestrator = new Orchestrator();
  const steps: Step[] = [
    { id: 'A', description: 'Step A', requiredCapabilities: [], dependencies: [], parallelizable: false, status: 'pending', execute: async () => {} },
    { id: 'B', description: 'Step B', requiredCapabilities: [], dependencies: ['A'], parallelizable: true, status: 'pending', execute: async () => {} },
    { id: 'C', description: 'Step C', requiredCapabilities: [], dependencies: ['A'], parallelizable: true, status: 'pending', execute: async () => {} }
  ];

  const result = await orchestrator.execute({ objective: 'Test', steps });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.completedSteps.length, 3);
  assert.strictEqual(steps[1].status, 'completed');
  assert.strictEqual(steps[2].status, 'completed');
});

test('Orchestrator - topological sort cycle detection', async () => {
  const orchestrator = new Orchestrator();
  const steps: Step[] = [
    { id: 'A', description: 'A', requiredCapabilities: [], dependencies: ['B'], parallelizable: false, status: 'pending' },
    { id: 'B', description: 'B', requiredCapabilities: [], dependencies: ['A'], parallelizable: false, status: 'pending' }
  ];

  await assert.rejects(
    async () => orchestrator.execute({ objective: 'Test cycle', steps }),
    /Cycle detected in dependencies/
  );
});

test('Orchestrator - retry and failure', async () => {
  const orchestrator = new Orchestrator();
  let attempts = 0;
  const steps: Step[] = [
    {
      id: 'A',
      description: 'Fail step',
      requiredCapabilities: [],
      dependencies: [],
      parallelizable: false,
      status: 'pending',
      maxRetries: 2,
      execute: async () => {
        attempts++;
        throw new Error('Expected failure');
      }
    },
    {
      id: 'B',
      description: 'Should not run',
      requiredCapabilities: [],
      dependencies: ['A'],
      parallelizable: false,
      status: 'pending'
    }
  ];

  const result = await orchestrator.execute({ objective: 'Fail test', steps });
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.failedSteps.includes('A'), true);
  assert.strictEqual(attempts, 3); // 1 initial + 2 retries
  assert.strictEqual(steps[1].status, 'pending'); // B never ran
});

test('Orchestrator - full integration', async () => {
  const decomposer = new TaskDecomposer();
  const orchestrator = new Orchestrator();
  
  const plan = decomposer.decompose('setup project');
  let execCount = 0;
  plan.steps.forEach(s => {
    s.execute = async () => { execCount++; };
  });

  const result = await orchestrator.execute(plan);
  assert.strictEqual(result.success, true);
  assert.strictEqual(execCount, 4);
});
