import { describe, it } from 'node:test';
import assert from 'node:assert';
import { InteractiveTaskQueue } from './interactive-task-queue.ts';

describe('InteractiveTaskQueue', () => {
  it('should allow agent to request approval and human to approve', async () => {
    const queue = new InteractiveTaskQueue();

    // The agent request will block until resolved.
    // We run it asynchronously to not block the test runner thread.
    const agentPromise = queue.requestApproval('agent-1', 'DEPLOY', { target: 'prod' });

    // Ensure task is enqueued
    const pendingTasks = queue.getPendingTasks();
    assert.strictEqual(pendingTasks.length, 1);
    const task = pendingTasks[0];
    assert.strictEqual(task.agentId, 'agent-1');
    assert.strictEqual(task.type, 'DEPLOY');
    assert.deepStrictEqual(task.payload, { target: 'prod' });
    assert.strictEqual(task.status, 'pending');

    // Human approves the task
    queue.approveTask(task.id, 'human-admin', 'Looks good to go');

    // The agent promise should now resolve
    const result = await agentPromise;
    assert.strictEqual(result.approved, true);
    assert.strictEqual(result.comment, 'Looks good to go');

    // Queue should have no pending tasks
    assert.strictEqual(queue.getPendingTasks().length, 0);
    
    // Check task state
    const resolvedTask = queue.getTask(task.id);
    assert.strictEqual(resolvedTask?.status, 'approved');
    assert.strictEqual(resolvedTask?.resolvedBy, 'human-admin');
  });

  it('should allow human to reject task', async () => {
    const queue = new InteractiveTaskQueue();

    const agentPromise = queue.requestApproval('agent-1', 'DELETE_DB', { name: 'users' });

    const pendingTasks = queue.getPendingTasks();
    assert.strictEqual(pendingTasks.length, 1);
    const task = pendingTasks[0];

    // Human rejects the task
    queue.rejectTask(task.id, 'human-admin', 'Not allowed!');

    const result = await agentPromise;
    assert.strictEqual(result.approved, false);
    assert.strictEqual(result.comment, 'Not allowed!');

    // Check task state
    const resolvedTask = queue.getTask(task.id);
    assert.strictEqual(resolvedTask?.status, 'rejected');
    assert.strictEqual(resolvedTask?.resolvedBy, 'human-admin');
  });

  it('should allow pausing and resuming agents', async () => {
    const queue = new InteractiveTaskQueue();

    queue.pauseAgent('agent-1');
    assert.strictEqual(queue.getAgentStatus('agent-1'), 'paused');

    // Agent request should fail if paused
    await assert.rejects(
      queue.requestApproval('agent-1', 'ANY', {}),
      /Agent agent-1 is currently paused/
    );

    // Resume agent
    queue.resumeAgent('agent-1');
    assert.strictEqual(queue.getAgentStatus('agent-1'), 'active');

    // Should now be able to request
    const agentPromise = queue.requestApproval('agent-1', 'ANY', {});
    assert.strictEqual(queue.getPendingTasks().length, 1);
    queue.approveTask(queue.getPendingTasks()[0].id, 'human', 'ok');
    await agentPromise;
  });
});
