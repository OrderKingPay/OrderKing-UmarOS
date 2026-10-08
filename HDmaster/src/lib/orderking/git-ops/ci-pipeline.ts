import { execSync } from 'child_process';

export interface PipelineStep {
  name: string;
  command: string;
}

export interface StepResult {
  name: string;
  success: boolean;
  durationMs: number;
  stdout: string;
  stderr: string;
}

export interface PipelineResult {
  success: boolean;
  totalDurationMs: number;
  stepResults: StepResult[];
}

export class CIPipeline {
  runPipeline(repoPath: string, steps: PipelineStep[]): PipelineResult {
    const stepResults: StepResult[] = [];
    const startTime = Date.now();
    let success = true;

    for (const step of steps) {
      const stepStartTime = Date.now();
      let stepStdout = '';
      let stepStderr = '';
      let stepSuccess = false;

      try {
        const output = execSync(step.command, { 
          cwd: repoPath, 
          stdio: ['pipe', 'pipe', 'pipe'], 
          encoding: 'utf-8' 
        });
        stepStdout = output;
        stepSuccess = true;
      } catch (error: any) {
        stepStdout = error.stdout || '';
        stepStderr = error.stderr || error.message || '';
        stepSuccess = false;
        success = false;
      }

      stepResults.push({
        name: step.name,
        success: stepSuccess,
        durationMs: Date.now() - stepStartTime,
        stdout: stepStdout.trim(),
        stderr: stepStderr.trim(),
      });

      if (!stepSuccess) {
        break; // Stop on first failure
      }
    }

    return {
      success,
      totalDurationMs: Date.now() - startTime,
      stepResults,
    };
  }
}
