export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Step {
  id: string;
  description: string;
  requiredCapabilities: string[];
  dependencies: string[];
  parallelizable: boolean;
  status: StepStatus;
  maxRetries?: number;
  retryCount?: number;
  durationMs?: number;
  error?: string;
  execute?: () => Promise<void>;
}

export interface TaskPlan {
  objective: string;
  steps: Step[];
}

export class TaskDecomposer {
  decompose(founderCommand: string): TaskPlan {
    const objective = `Execute: ${founderCommand}`;
    const steps: Step[] = [];

    const lowerCmd = founderCommand.toLowerCase();
    
    // Pattern match 1: Setup project
    if (lowerCmd.includes('setup') && lowerCmd.includes('project')) {
      steps.push(
        { id: 'init-repo', description: 'Initialize repository', requiredCapabilities: ['git'], dependencies: [], parallelizable: false, status: 'pending' },
        { id: 'install-deps', description: 'Install dependencies', requiredCapabilities: ['npm'], dependencies: ['init-repo'], parallelizable: false, status: 'pending' },
        { id: 'lint', description: 'Lint code', requiredCapabilities: ['npm'], dependencies: ['install-deps'], parallelizable: true, status: 'pending' },
        { id: 'test', description: 'Run tests', requiredCapabilities: ['npm'], dependencies: ['install-deps'], parallelizable: true, status: 'pending' }
      );
    } 
    // Pattern match 2: Deploy database
    else if (lowerCmd.includes('deploy') && lowerCmd.includes('db')) {
      steps.push(
        { id: 'build-db', description: 'Build database image', requiredCapabilities: ['docker'], dependencies: [], parallelizable: true, status: 'pending' },
        { id: 'deploy-db', description: 'Deploy database', requiredCapabilities: ['kubernetes'], dependencies: ['build-db'], parallelizable: false, status: 'pending' }
      );
    } 
    // Pattern match 3: Generic 'then' chaining
    else if (lowerCmd.includes(' then ')) {
      const parts = founderCommand.split(/ then /i);
      let prevId: string | null = null;
      parts.forEach((part, index) => {
        const id = `step-${index}`;
        steps.push({
          id,
          description: part.trim(),
          requiredCapabilities: ['shell'],
          dependencies: prevId ? [prevId] : [],
          parallelizable: false,
          status: 'pending'
        });
        prevId = id;
      });
    }
    // Pattern match 4: Parallel 'and' grouping
    else if (lowerCmd.includes(' and ')) {
      const parts = founderCommand.split(/ and /i);
      parts.forEach((part, index) => {
        const id = `step-${index}`;
        steps.push({
          id,
          description: part.trim(),
          requiredCapabilities: ['shell'],
          dependencies: [],
          parallelizable: true,
          status: 'pending'
        });
      });
    }
    // Fallback: single step
    else {
      steps.push({
        id: 'step-0',
        description: founderCommand,
        requiredCapabilities: ['shell'],
        dependencies: [],
        parallelizable: false,
        status: 'pending'
      });
    }

    return { objective, steps };
  }
}
