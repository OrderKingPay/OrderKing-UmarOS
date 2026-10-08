export interface RetryTask {
  id: string;
  type: string;
  payload: any;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
}

export type TaskHandler = (payload: any) => Promise<void>;

export class RetryQueueManager {
  private queue: RetryTask[] = [];
  private handlers: Map<string, TaskHandler> = new Map();
  private isProcessing = false;
  
  // Base delay in ms
  private baseDelay = 1000;

  constructor() {}

  registerHandler(type: string, handler: TaskHandler) {
    this.handlers.set(type, handler);
  }

  async enqueue(type: string, payload: any, maxAttempts = 5): Promise<string> {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const task: RetryTask = {
      id,
      type,
      payload,
      attempts: 0,
      maxAttempts,
      nextAttemptAt: Date.now(),
      status: 'pending'
    };
    
    this.queue.push(task);
    this.processQueue().catch(console.error); // start processing if not running
    
    return task.id;
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (true) {
        const now = Date.now();
        // find tasks that are pending or failed but ready to be retried
        const readyTasks = this.queue.filter(
          t => (t.status === 'pending' || t.status === 'failed') && 
               t.attempts < t.maxAttempts && 
               now >= t.nextAttemptAt
        );

        if (readyTasks.length === 0) {
          break; // nothing ready, stop processing loop
        }

        for (const task of readyTasks) {
          await this.processTask(task);
        }
      }
    } finally {
      this.isProcessing = false;
      // Schedule next check if there are still pending tasks in the future
      const pendingTasks = this.queue.filter(
        t => (t.status === 'pending' || t.status === 'failed') && t.attempts < t.maxAttempts
      );
      if (pendingTasks.length > 0) {
        const nextTime = Math.min(...pendingTasks.map(t => t.nextAttemptAt));
        const delay = Math.max(0, nextTime - Date.now());
        setTimeout(() => this.processQueue(), delay);
      }
    }
  }

  private async processTask(task: RetryTask) {
    task.status = 'processing';
    task.attempts++;
    
    const handler = this.handlers.get(task.type);
    if (!handler) {
      task.status = 'failed';
      return;
    }

    try {
      await handler(task.payload);
      task.status = 'completed';
    } catch (error) {
      console.error(`Task ${task.id} failed attempt ${task.attempts}:`, error);
      
      if (task.attempts >= task.maxAttempts) {
        task.status = 'failed';
      } else {
        task.status = 'failed';
        // Exponential backoff: baseDelay * (2 ^ (attempts - 1))
        const backoffMs = this.baseDelay * Math.pow(2, task.attempts - 1);
        // Add some jitter (±10%)
        const jitter = backoffMs * 0.1 * (Math.random() * 2 - 1);
        task.nextAttemptAt = Date.now() + backoffMs + jitter;
      }
    }
  }

  getTaskStatus(id: string): RetryTask | undefined {
    return this.queue.find(t => t.id === id);
  }
  
  getQueueLength(): number {
    return this.queue.length;
  }
}
