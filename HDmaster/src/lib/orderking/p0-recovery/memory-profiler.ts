import v8 from 'v8';

let intervalId: NodeJS.Timeout | null = null;

/**
 * Monitors the V8 heap memory usage.
 * Triggers garbage collection or gracefully crashes for PM2 to recover if usage > 90%.
 */
export function monitorHeap(): void {
    console.log('[MemoryProfiler] Starting heap monitoring');
    
    if (intervalId) {
        clearInterval(intervalId);
    }

    // Check memory every 10 seconds
    intervalId = setInterval(() => {
        const memUsage = process.memoryUsage();
        const heapUsed = memUsage.heapUsed;
        const heapTotal = memUsage.heapTotal;
        
        const utilization = heapUsed / heapTotal;
        
        console.log(`[MemoryProfiler] Heap utilization: ${(utilization * 100).toFixed(2)}%`);
        
        if (utilization > 0.90) {
            console.warn('[MemoryProfiler] Heap utilization exceeded 90%!');
            
            if (global.gc) {
                console.log('[MemoryProfiler] Triggering V8 Garbage Collection...');
                global.gc();
            } else {
                console.error('[MemoryProfiler] Garbage collection not exposed (use node --expose-gc). Crashing gracefully for PM2 recovery...');
                // Exit with code 1 to let PM2 or Docker restart the process
                process.exit(1);
            }
        }
    }, 10000);
}

export function stopHeapMonitoring(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}
