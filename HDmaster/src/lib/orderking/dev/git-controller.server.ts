import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getGitStatus(): Promise<string> {
  try {
    const { stdout } = await execAsync('git status');
    return stdout;
  } catch (error: any) {
    throw new Error(`Failed to get git status: ${error.stderr || error.message}`);
  }
}

export async function getGitLog(limit: number = 10): Promise<string> {
  try {
    const { stdout } = await execAsync(`git log -n ${limit} --oneline`);
    return stdout;
  } catch (error: any) {
    throw new Error(`Failed to get git log: ${error.stderr || error.message}`);
  }
}

export async function commitAndPush(message: string): Promise<string> {
  try {
    await execAsync('git add .');
    const { stdout: commitStdout } = await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`);
    const { stdout: pushStdout } = await execAsync('git push');
    return `${commitStdout}\n${pushStdout}`;
  } catch (error: any) {
    throw new Error(`Failed to commit and push: ${error.stderr || error.message}`);
  }
}
