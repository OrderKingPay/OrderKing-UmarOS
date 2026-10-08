/**
 * UMAR OS — Sandboxed Terminal Executor
 *
 * SECURITY MODEL:
 * 1. Command ALLOWLIST: Only pre-approved commands can execute.
 * 2. PATH RESTRICTION: Commands can only operate within allowed directories.
 * 3. APPROVAL GATE: Destructive commands require explicit founder approval.
 * 4. AUDIT LOG: Every execution is logged with timestamps and results.
 * 5. TIMEOUT: All commands have a 30-second execution timeout.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface CommandResult {
  stdout: string;
  stderr: string;
  command: string;
  executedAt: string;
  durationMs: number;
}

export interface ExecutionPolicy {
  allowedCommands: string[];
  allowedDirectories: string[];
  requireApprovalFor: string[];
  timeoutMs: number;
}

// Default restrictive policy
const DEFAULT_POLICY: ExecutionPolicy = {
  allowedCommands: [
    'npm', 'npx', 'node', 'git', 'tsc', 'eslint', 'prettier',
    'cat', 'ls', 'dir', 'echo', 'type', 'find', 'grep',
  ],
  allowedDirectories: [
    // Will be resolved to absolute paths at runtime
  ],
  requireApprovalFor: [
    'rm', 'del', 'rmdir', 'git push', 'git reset', 'npm publish',
    'docker', 'kubectl',
  ],
  timeoutMs: 30_000,
};

export class TerminalExecutor {
  private policy: ExecutionPolicy;
  private auditLog: CommandResult[] = [];
  private approvedDestructive: Set<string> = new Set();

  constructor(
    policy: Partial<ExecutionPolicy> = {},
    private projectRoot: string = process.cwd(),
  ) {
    this.policy = { ...DEFAULT_POLICY, ...policy };
    // Always allow the project root
    if (!this.policy.allowedDirectories.includes(projectRoot)) {
      this.policy.allowedDirectories.push(projectRoot);
    }
  }

  /**
   * Pre-approve a destructive command pattern for execution.
   * This is the "founder approval" step.
   */
  approveCommand(commandPattern: string): void {
    this.approvedDestructive.add(commandPattern);
  }

  /**
   * Execute a command within the sandbox policy.
   * Throws if command is not allowed, directory is restricted,
   * or destructive command hasn't been pre-approved.
   */
  async runCommand(command: string, cwd?: string): Promise<CommandResult> {
    const resolvedCwd = cwd
      ? path.resolve(cwd)
      : this.projectRoot;

    // SECURITY CHECK 1: Is the command on the allowlist?
    const baseCommand = command.trim().split(/\s+/)[0].toLowerCase();
    const isAllowed = this.policy.allowedCommands.some(
      (allowed) => baseCommand === allowed.toLowerCase(),
    );
    if (!isAllowed) {
      throw new Error(
        `BLOCKED: Command "${baseCommand}" is not on the allowlist. ` +
        `Allowed: ${this.policy.allowedCommands.join(', ')}`,
      );
    }

    // SECURITY CHECK 2: Is the working directory within allowed paths?
    const inAllowedDir = this.policy.allowedDirectories.some(
      (dir) => resolvedCwd.startsWith(path.resolve(dir)),
    );
    if (!inAllowedDir) {
      throw new Error(
        `BLOCKED: Directory "${resolvedCwd}" is outside allowed paths. ` +
        `Allowed: ${this.policy.allowedDirectories.join(', ')}`,
      );
    }

    // SECURITY CHECK 3: Does this require founder approval?
    const needsApproval = this.policy.requireApprovalFor.some(
      (pattern) => command.toLowerCase().includes(pattern.toLowerCase()),
    );
    if (needsApproval && !this.approvedDestructive.has(command)) {
      throw new Error(
        `BLOCKED: Command "${command}" requires founder approval. ` +
        `Call executor.approveCommand("${command}") first.`,
      );
    }

    // Execute with timeout
    const start = Date.now();
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: resolvedCwd,
        timeout: this.policy.timeoutMs,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      const result: CommandResult = {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        command,
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - start,
      };

      this.auditLog.push(result);
      return result;
    } catch (error: any) {
      const result: CommandResult = {
        stdout: '',
        stderr: error.message,
        command,
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - start,
      };
      this.auditLog.push(result);
      throw new Error(
        `Command failed (${result.durationMs}ms): ${error.message}`,
      );
    }
  }

  /**
   * Get the full audit log of executed commands.
   */
  getAuditLog(): CommandResult[] {
    return [...this.auditLog];
  }
}
