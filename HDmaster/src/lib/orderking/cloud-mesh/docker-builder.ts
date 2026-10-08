import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function buildAndPushDocker(tag: string = 'umar-os'): Promise<string> {
  try {
    const { stdout: buildOut } = await execAsync(`docker build -t ${tag} .`);
    console.log('Build Output:', buildOut);
    
    const { stdout: pushOut } = await execAsync(`docker push ${tag}`);
    console.log('Push Output:', pushOut);
    
    return `Successfully built and pushed ${tag}`;
  } catch (error) {
    console.error('Docker Error:', error);
    throw error;
  }
}
