import { Task, TaskStore } from './task-store';

export type PreemptionAction = 'run' | 'queue' | 'preempt';

export interface PreemptionDecision {
  action: PreemptionAction;
  preemptedTaskIds?: string[];
}

export class PriorityQueue<T> {
  private heap: { element: T; priority: number; order: number }[] = [];
  private counter = 0;

  enqueue(element: T, priority: number): void {
    this.heap.push({ element, priority, order: this.counter++ });
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop()?.element;

    const max = this.heap[0].element;
    this.heap[0] = this.heap.pop()!;
    this.sinkDown(0);
    return max;
  }

  get length(): number {
    return this.heap.length;
  }

  private compare(i: number, j: number): number {
    const a = this.heap[i];
    const b = this.heap[j];
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return b.order - a.order;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(parentIndex, index) >= 0) break;
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let leftChildIndex = 2 * index + 1;
      let rightChildIndex = 2 * index + 2;
      let swap = null;

      if (leftChildIndex < length) {
        if (this.compare(leftChildIndex, index) > 0) {
          swap = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        const checkIndex = swap === null ? index : swap;
        if (this.compare(rightChildIndex, checkIndex) > 0) {
          swap = rightChildIndex;
        }
      }

      if (swap === null) break;
      [this.heap[index], this.heap[swap]] = [this.heap[swap], this.heap[index]];
      index = swap;
    }
  }
}

export class PreemptionEngine {
  private concurrencyLimit: number;
  private queue: PriorityQueue<Task>;

  constructor(concurrencyLimit: number = 1) {
    this.concurrencyLimit = concurrencyLimit;
    this.queue = new PriorityQueue<Task>();
  }

  submit(newTask: Task, store: TaskStore): PreemptionDecision {
    const activeTasks = store.getActive();

    if (activeTasks.length < this.concurrencyLimit) {
      store.updateStatus(newTask.id, 'running');
      return { action: 'run' };
    }

    const lowerPriorityTasks = activeTasks
      .filter(t => t.priority < newTask.priority)
      .sort((a, b) => a.priority - b.priority);

    if (lowerPriorityTasks.length === 0) {
      this.queue.enqueue(newTask, newTask.priority);
      return { action: 'queue' };
    }

    const tasksToPreempt = lowerPriorityTasks.slice(0, 1);
    const preemptedTaskIds = [];

    for (const task of tasksToPreempt) {
      store.pause(task.id);
      this.queue.enqueue(task, task.priority);
      preemptedTaskIds.push(task.id);
    }
    
    store.updateStatus(newTask.id, 'running');

    return { 
      action: 'preempt', 
      preemptedTaskIds 
    };
  }

  next(store: TaskStore): Task | undefined {
    const activeTasks = store.getActive();
    if (activeTasks.length < this.concurrencyLimit) {
      const nextTask = this.queue.dequeue();
      if (nextTask) {
        if (nextTask.status === 'paused') {
          store.resume(nextTask.id);
        } else {
          store.updateStatus(nextTask.id, 'running');
        }
        return nextTask;
      }
    }
    return undefined;
  }
}
