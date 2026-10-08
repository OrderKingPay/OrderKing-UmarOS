export type TaskStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

export interface Task {
  id: string;
  priority: number;
  status: TaskStatus;
  artifacts: any[];
  context: Record<string, any>;
}

export class TaskStore {
  private tasks = new Map<string, Task>();

  create(data: { id?: string; priority: number; artifacts?: any[]; context?: Record<string, any> }): Task {
    const id = data.id || Math.random().toString(36).substring(2, 9);
    const task: Task = {
      id,
      priority: data.priority,
      status: 'pending',
      artifacts: data.artifacts || [],
      context: data.context || {}
    };
    this.tasks.set(id, task);
    return task;
  }

  pause(id: string): void {
    const task = this.tasks.get(id);
    if (task && task.status === 'running') {
      task.status = 'paused';
    }
  }

  resume(id: string): void {
    const task = this.tasks.get(id);
    if (task && task.status === 'paused') {
      task.status = 'running';
    }
  }

  getActive(): Task[] {
    return Array.from(this.tasks.values()).filter(t => t.status === 'running');
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  updateStatus(id: string, status: TaskStatus): void {
    const task = this.tasks.get(id);
    if (task) {
      task.status = status;
    }
  }
}
