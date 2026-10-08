import { promises as fs } from 'fs';
import * as path from 'path';

export class FileManager {
  async readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    return fs.readFile(filePath, { encoding });
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    return fs.writeFile(filePath, content, 'utf-8');
  }

  async deletePath(targetPath: string): Promise<void> {
    return fs.rm(targetPath, { recursive: true, force: true });
  }

  async listFiles(dirPath: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          return this.listFiles(fullPath);
        }
        return fullPath;
      })
    );
    return files.flat();
  }
}
