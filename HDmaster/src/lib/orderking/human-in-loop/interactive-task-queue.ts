import { randomUUID } from 'crypto';

export type TaskStatus = 'pending' | 'approved' | 'rejected';
export type AgentStatus = 'active' | 'paused';

export interface InteractiveTask {
  id: string;
  agentId: string;
  type: string;
  payload: Record<string, any>;
  evidence?: Record<string, any>;
  status: TaskStatus;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  comment?: string;
}

export class InteractiveTaskQueue {
  private tasks: Map<string, InteractiveTask> = new Map();
  private agentStatuses: Map<string, AgentStatus> = new Map();
  private taskResolvers: Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }> = new Map();

  /**
   * Agent requests approval for an action.
   * Returns a promise that resolves when a human approves or rejects the task.
   */
  async requestApproval(
    agentId: string,
    type: string,
    payload: Record<string, any>,
    evidence?: Record<string, any>
  ): Promise<{ approved: boolean; comment?: string }> {
    // If agent is paused, we could block here or reject.
    // For now, allow task creation but it's up to the agent to wait.
    if (this.getAgentStatus(agentId) === 'paused') {
      throw new Error(`Agent ${agentId} is currently paused.`);
    }

    const id = randomUUID();
    const task: InteractiveTask = {
      id,
      agentId,
      type,
      payload,
      evidence,
      status: 'pending',
      createdAt: new Date(),
    };

    this.tasks.set(id, task);

    return new Promise((resolve, reject) => {
      this.taskResolvers.set(id, { resolve, reject });
    });
  }

  getPendingTasks(): InteractiveTask[] {
    return Array.from(this.tasks.values()).filter((t) => t.status === 'pending');
  }

  getTask(taskId: string): InteractiveTask | undefined {
    return this.tasks.get(taskId);
  }

  approveTask(taskId: string, humanId: string, comment?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    if (task.status !== 'pending') throw new Error(`Task ${taskId} is already ${task.status}`);

    task.status = 'approved';
    task.resolvedAt = new Date();
    task.resolvedBy = humanId;
    task.comment = comment;

    const resolver = this.taskResolvers.get(taskId);
    if (resolver) {
      resolver.resolve({ approved: true, comment });
      this.taskResolvers.delete(taskId);
    }
  }

  rejectTask(taskId: string, humanId: string, comment?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    if (task.status !== 'pending') throw new Error(`Task ${taskId} is already ${task.status}`);

    task.status = 'rejected';
    task.resolvedAt = new Date();
    task.resolvedBy = humanId;
    task.comment = comment;

    const resolver = this.taskResolvers.get(taskId);
    if (resolver) {
      resolver.resolve({ approved: false, comment });
      this.taskResolvers.delete(taskId);
    }
  }

  pauseAgent(agentId: string): void {
    this.agentStatuses.set(agentId, 'paused');
  }

  resumeAgent(agentId: string): void {
    this.agentStatuses.set(agentId, 'active');
  }

  getAgentStatus(agentId: string): AgentStatus {
    return this.agentStatuses.get(agentId) || 'active';
  }
}
