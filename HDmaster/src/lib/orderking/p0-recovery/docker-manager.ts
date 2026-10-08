import Docker from 'dockerode';

// Connects to local Docker daemon (handles Windows named pipes and Unix sockets)
const docker = new Docker({ 
    socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' 
});

/**
 * Restarts a Docker container using the Dockerode API.
 * @param containerName The name or ID of the container to restart
 */
export async function restartContainer(containerName: string): Promise<void> {
    try {
        console.log(`[DockerManager] Attempting to restart container: ${containerName}`);
        const container = docker.getContainer(containerName);
        await container.restart();
        console.log(`[DockerManager] Successfully restarted container: ${containerName}`);
    } catch (error) {
        console.error(`[DockerManager] Failed to restart container ${containerName}:`, error);
        throw error;
    }
}
