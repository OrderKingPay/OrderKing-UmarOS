import { execSync } from 'child_process';

export class GitClient {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  private run(command: string): string {
    return execSync(command, { 
      cwd: this.repoPath, 
      encoding: 'utf-8', 
      stdio: ['pipe', 'pipe', 'pipe'] 
    }).trim();
  }

  status(): string {
    return this.run('git status --short');
  }

  log(n: number = 10): string {
    return this.run(`git log -n ${n} --oneline`);
  }

  diff(): string {
    return this.run('git diff');
  }

  commit(msg: string): string {
    const escapedMsg = msg.replace(/"/g, '\\"');
    return this.run(`git commit -m "${escapedMsg}"`);
  }

  branch(): string {
    return this.run('git branch');
  }

  createBranch(name: string): string {
    return this.run(`git checkout -b ${name}`);
  }
}
