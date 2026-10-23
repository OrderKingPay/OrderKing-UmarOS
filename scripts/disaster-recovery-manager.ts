import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  retentionDays: number;
}

export class DisasterRecoveryManager {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
    if (!existsSync(this.config.backupDir)) {
      mkdirSync(this.config.backupDir, { recursive: true });
    }
  }

  private cliConnection(): { connection: string; env: NodeJS.ProcessEnv } {
    const url = new URL(this.config.databaseUrl);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) {
      throw new Error("Invalid PostgreSQL URL");
    }
    if (["no-verify", "disable"].includes(url.searchParams.get("sslmode")?.toLowerCase() ?? "")) {
      throw new Error("Database backup requires verified TLS");
    }
    // Keep passwords out of OS process argument lists and shell commands.
    const password = decodeURIComponent(url.password);
    url.password = "";
    return {
      connection: url.toString(),
      env: password ? { ...process.env, PGPASSWORD: password } : { ...process.env },
    };
  }

  async backup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(this.config.backupDir, `backup-${timestamp}.dump`);

    return new Promise((resolve, reject) => {
      const { connection, env } = this.cliConnection();
      const dump = spawn('pg_dump', ['--dbname', connection, '--file', backupFile, '--format=c'], { shell: false, env });
      dump.on('error', reject);

      dump.stdout.on('data', (data) => console.log(data.toString()));
      dump.stderr.on('data', (data) => console.error(data.toString()));

      dump.on('close', (code) => {
        if (code === 0) {
          resolve(backupFile);
        } else {
          reject(new Error(`pg_dump exited with code ${code}`));
        }
      });
    });
  }

  async restore(backupFile: string): Promise<void> {
    if (process.env.ORDERKING_RESTORE_APPROVED !== "YES_DESTRUCTIVE_RESTORE") {
      throw new Error("Explicit approval required before any destructive database restore");
    }
    if (!existsSync(backupFile)) throw new Error("Backup file not found");
    return new Promise((resolve, reject) => {
      const { connection, env } = this.cliConnection();
      const restoreProcess = spawn('pg_restore', ['--dbname', connection, '--clean', backupFile], { shell: false, env });
      restoreProcess.on('error', reject);

      restoreProcess.stdout.on('data', (data) => console.log(data.toString()));
      restoreProcess.stderr.on('data', (data) => console.error(data.toString()));

      restoreProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pg_restore exited with code ${code}`));
        }
      });
    });
  }
}

// Example usage
if (require.main === module) {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    throw new Error("DATABASE_URL is required for backups. No backup was attempted.");
  }
  const manager = new DisasterRecoveryManager({
    databaseUrl: dbUrl,
    backupDir: join(__dirname, '../backups'),
    retentionDays: 7
  });

  manager.backup()
    .then(file => console.log(`Backup completed successfully: ${file}`))
    .catch(() => { console.error('Backup failed; check protected logs.'); process.exitCode = 1; });
}
