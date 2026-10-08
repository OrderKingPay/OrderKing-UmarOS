import { exec } from 'child_process';
import { promisify } from 'util';
import { createBackup, restoreBackup } from './sandbox-manager';

const execAsync = promisify(exec);

export async function applyPatchWithSafety(filePath: string, modifierFn: (filePath: string) => void): Promise<void> {
  const backupPath = await createBackup(filePath);
  try {
    modifierFn(filePath);
    await execAsync('npx tsc --noEmit');
  } catch (error) {
    await restoreBackup(backupPath, filePath);
    throw new Error(`Patch failed, restored backup. Error: ${error instanceof Error ? error.message : error}`);
  }
}
