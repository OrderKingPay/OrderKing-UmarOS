import Docker from 'dockerode';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

const docker = new Docker(); // Connects to the local Docker socket

export interface RunOptions {
    code: string;
    image?: string;
    timeoutMs?: number;
    memoryLimitMb?: number;
}

export interface RunResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

export class SecureContainment {
    private docker: Docker;

    constructor(dockerInstance?: any) {
        this.docker = dockerInstance || new Docker();
    }

    /**
     * Executes arbitrary code in an ephemeral Docker container.
     */
    async runInContainer(options: RunOptions): Promise<RunResult> {
        const image = options.image || 'node:18-alpine';
        const timeoutMs = options.timeoutMs || 5000;
        const memoryLimitMb = options.memoryLimitMb || 128;

        // 1. Create a temporary directory to mount
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'secure-containment-'));
        const scriptPath = path.join(tmpDir, 'script.js');
        await fs.writeFile(scriptPath, options.code);

        // Docker needs the path formatted properly, but Node's path module handles it on Windows.
        // On Docker Desktop for Windows, standard absolute paths usually work in Binds.
        
        // 2. Create the container
        const container = await this.docker.createContainer({
            Image: image,
            Cmd: ['node', '/sandbox/script.js'],
            HostConfig: {
                Binds: [`${tmpDir}:/sandbox:ro`], // Read-only mount
                Memory: memoryLimitMb * 1024 * 1024,
                NetworkMode: 'none', // No network access
                AutoRemove: false, // We'll remove it manually to ensure we can fetch logs if it dies
            },
            AttachStdout: true,
            AttachStderr: true,
            Tty: false
        });

        let timeoutHandle: NodeJS.Timeout | null = null;

        try {
            // 3. Start the container
            await container.start();

            // 4. Capture logs
            const stream = await container.logs({
                follow: true,
                stdout: true,
                stderr: true
            });

            const logPromise = new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
                let stdout = '';
                let stderr = '';
                this.docker.modem.demuxStream(
                    stream,
                    { write: (chunk: Buffer) => { stdout += chunk.toString(); } },
                    { write: (chunk: Buffer) => { stderr += chunk.toString(); } }
                );
                stream.on('end', () => resolve({ stdout, stderr }));
                stream.on('error', reject);
            });

            // 5. Wait for the container to exit, with a timeout
            const waitPromise = container.wait();
            
            const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutHandle = setTimeout(() => {
                    reject(new Error(`Container execution timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            });

            const waitResult = await Promise.race([waitPromise, timeoutPromise]);
            const logs = await logPromise;

            return {
                stdout: logs.stdout,
                stderr: logs.stderr,
                exitCode: waitResult.StatusCode
            };
        } finally {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
            // 6. Cleanup
            try {
                await container.remove({ force: true });
            } catch (err) {
                console.error('Failed to remove container:', err);
            }
            try {
                await fs.rm(tmpDir, { recursive: true, force: true });
            } catch (err) {
                console.error('Failed to clean up temp directory:', err);
            }
        }
    }
}
