import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CommandResult {
  stdout: string;
  stderr: string;
}

export class TerminalExecutor {
  async runCommand(command: string, cwd?: string): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await execAsync(command, { cwd });
      return { stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (error: any) {
      throw new Error(`Command execution failed: ${error.message}\nStderr: ${error.stderr}`);
    }
  }
}
