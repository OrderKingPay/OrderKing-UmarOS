import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface ContainerConfig {
    image: string;
    name: string;
    ports?: string[];
    env?: Record<string, string>;
}

export class ContainerManager {
    async startContainer(config: ContainerConfig): Promise<string> {
        let command = `docker run -d --name ${config.name}`;
        
        if (config.ports) {
            for (const port of config.ports) {
                command += ` -p ${port}`;
            }
        }

        if (config.env) {
            for (const [key, value] of Object.entries(config.env)) {
                command += ` -e ${key}="${value}"`;
            }
        }

        command += ` ${config.image}`;

        try {
            const { stdout } = await execAsync(command);
            return stdout.trim();
        } catch (error: any) {
            throw new Error(`Failed to start container: ${error.message}`);
        }
    }

    async stopContainer(name: string): Promise<void> {
        try {
            await execAsync(`docker stop ${name}`);
            await execAsync(`docker rm ${name}`);
        } catch (error: any) {
            throw new Error(`Failed to stop container: ${error.message}`);
        }
    }

    async getContainerStatus(name: string): Promise<string> {
        try {
            const { stdout } = await execAsync(`docker inspect --format='{{.State.Status}}' ${name}`);
            return stdout.trim();
        } catch (error: any) {
            throw new Error(`Failed to get container status: ${error.message}`);
        }
    }
    
    async listRunningContainers(): Promise<string[]> {
         try {
             const { stdout } = await execAsync(`docker ps --format '{{.Names}}'`);
             return stdout.trim().split('\n').filter(Boolean);
         } catch (error: any) {
             throw new Error(`Failed to list containers: ${error.message}`);
         }
    }
}
