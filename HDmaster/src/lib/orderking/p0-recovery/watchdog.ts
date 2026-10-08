import { restartContainer } from './docker-manager';

let failureCount = 0;
let intervalId: NodeJS.Timeout | null = null;

/**
 * Starts the watchdog to monitor the target URL.
 * Pings every 5 seconds. If it fails 3 times, triggers container restart.
 * @param targetUrl URL of the API health route to monitor
 * @param containerName Name of the Docker container to restart on failure
 */
export function startWatchdog(targetUrl: string, containerName: string = 'orderking-api'): void {
    console.log(`[Watchdog] Starting watchdog for ${targetUrl}`);
    failureCount = 0;

    if (intervalId) {
        clearInterval(intervalId);
    }

    intervalId = setInterval(async () => {
        try {
            const response = await fetch(targetUrl);
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            console.log(`[Watchdog] Health check passed for ${targetUrl}`);
            failureCount = 0; // reset on success
        } catch (error: any) {
            failureCount++;
            console.warn(`[Watchdog] Health check failed for ${targetUrl} (${failureCount}/3): ${error.message}`);

            if (failureCount >= 3) {
                console.error(`[Watchdog] 3 consecutive failures. Triggering recovery...`);
                failureCount = 0; // reset to avoid immediate loop during restart
                
                try {
                    await restartContainer(containerName);
                } catch (restartError) {
                    console.error(`[Watchdog] Recovery failed. Waiting for next cycle...`);
                }
            }
        }
    }, 5000);
}

export function stopWatchdog(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}
