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

  async backup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(this.config.backupDir, `backup-${timestamp}.sql`);

    return new Promise((resolve, reject) => {
      const dump = spawn('pg_dump', ['--dbname', this.config.databaseUrl, '--file', backupFile, '--format=c'], { shell: process.platform === 'win32' });

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
    return new Promise((resolve, reject) => {
      const restoreProcess = spawn('pg_restore', ['--dbname', this.config.databaseUrl, '--clean', backupFile], { shell: process.platform === 'win32' });

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
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/orderking';
  const manager = new DisasterRecoveryManager({
    databaseUrl: dbUrl,
    backupDir: join(__dirname, '../backups'),
    retentionDays: 7
  });

  manager.backup()
    .then(file => console.log(`Backup completed successfully: ${file}`))
    .catch(err => console.error('Backup failed:', err));
}
