import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function scaleDeployment(deployment: string, replicas: number): Promise<string> {
    try {
        const { stdout } = await execAsync(`kubectl scale deployment ${deployment} --replicas=${replicas}`);
        return stdout;
    } catch (error) {
        console.error('K8s scale error:', error);
        throw error;
    }
}

export async function monitorAndScale(deployment: string, threshold: number): Promise<void> {
    // Simulated DB CPU load
    const currentLoad = Math.random() * 100;
    console.log(`Current DB CPU load: ${currentLoad.toFixed(2)}%`);

    if (currentLoad > threshold) {
        console.log(`Load exceeded threshold of ${threshold}%. Scaling...`);
        const newReplicas = Math.ceil(currentLoad / 20); // Arbitrary scaling logic
        const result = await scaleDeployment(deployment, newReplicas);
        console.log(result);
    } else {
        console.log('Load is within normal limits.');
    }
}
