import { copyFile, unlink } from 'fs/promises';
import { join, dirname, basename } from 'path';

export async function createBackup(filePath: string): Promise<string> {
  const backupPath = join(dirname(filePath), `.${basename(filePath)}.bak`);
  await copyFile(filePath, backupPath);
  return backupPath;
}

export async function restoreBackup(backupPath: string, originalPath: string): Promise<void> {
  await copyFile(backupPath, originalPath);
  await unlink(backupPath);
}
