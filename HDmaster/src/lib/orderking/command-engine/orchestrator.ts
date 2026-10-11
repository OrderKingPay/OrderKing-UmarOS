import { TaskPlan, Step } from './task-decomposer';

export interface ExecutionResult {
  success: boolean;
  totalDurationMs: number;
  failedSteps: string[];
  completedSteps: string[];
}

export class Orchestrator {
  private topologicalSort(steps: Step[]): Step[][] {
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const stepMap = new Map<string, Step>();

    for (const step of steps) {
      stepMap.set(step.id, step);
      inDegree.set(step.id, 0);
      if (!adj.has(step.id)) {
        adj.set(step.id, []);
      }
    }

    for (const step of steps) {
      for (const dep of step.dependencies) {
        if (!adj.has(dep)) {
          adj.set(dep, []);
        }
        adj.get(dep)!.push(step.id);
        inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
      }
    }

    const queue: string[] = [];
    for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(id);
    }

    const levels: Step[][] = [];
    let count = 0;

    while (queue.length > 0) {
      const levelSize = queue.length;
      const currentLevel: Step[] = [];
      for (let i = 0; i < levelSize; i++) {
        const current = queue.shift()!;
        currentLevel.push(stepMap.get(current)!);
        count++;

        for (const neighbor of (adj.get(current) || [])) {
          inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
          if (inDegree.get(neighbor) === 0) {
            queue.push(neighbor);
          }
        }
      }
      levels.push(currentLevel);
    }

    if (count !== steps.length) {
      throw new Error("Cycle detected in dependencies");
    }

    return levels;
  }

  private async runStep(step: Step, completedSteps: string[], failedSteps: string[]): Promise<void> {
    step.status = 'running';
    const stepStartTime = Date.now();
    let retries = 0;
    const maxRetries = step.maxRetries ?? 3;
    let success = false;

    while (retries <= maxRetries && !success) {
      step.retryCount = retries;
      try {
        if (step.execute) {
          await step.execute();
        } else {
          // Default fallback execution behavior
          await new Promise(resolve => setTimeout(resolve, 5));
        }
        success = true;
      } catch (err: any) {
        if (retries >= maxRetries) {
          step.error = err.message || 'Unknown error';
          break;
        }
        retries++;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    step.durationMs = Date.now() - stepStartTime;
    if (success) {
      step.status = 'completed';
      completedSteps.push(step.id);
    } else {
      step.status = 'failed';
      failedSteps.push(step.id);
    }
  }

  async execute(plan: TaskPlan): Promise<ExecutionResult> {
    const startTime = Date.now();
    const levels = this.topologicalSort(plan.steps);
    const completedSteps: string[] = [];
    const failedSteps: string[] = [];

    for (const level of levels) {
      const parallelSteps = level.filter(s => s.parallelizable);
      const sequentialSteps = level.filter(s => !s.parallelizable);

      // Run sequential steps one by one
      for (const step of sequentialSteps) {
        await this.runStep(step, completedSteps, failedSteps);
        if (step.status === 'failed') break;
      }

      if (failedSteps.length > 0) break; // Level failed

      // Run parallelizable steps concurrently
      if (parallelSteps.length > 0) {
        const promises = parallelSteps.map(step => this.runStep(step, completedSteps, failedSteps));
        await Promise.all(promises);
      }

      if (failedSteps.length > 0) break; // Level failed
    }

    const totalDurationMs = Date.now() - startTime;
    return {
      success: failedSteps.length === 0,
      totalDurationMs,
      completedSteps,
      failedSteps
    };
  }
}
