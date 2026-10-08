import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// Connect to Redis (assuming local/default for now, or configurable via env)
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
});

export class DistributedTaskQueue {
    private queue: Queue;
    private worker: Worker;
    private queueEvents: QueueEvents;

    constructor(private queueName: string = 'EnterpriseTaskQueue') {
        // 1. Initialize the BullMQ Queue
        this.queue = new Queue(this.queueName, { connection });
        this.queueEvents = new QueueEvents(this.queueName, { connection });

        // 2. Initialize the background worker (Zero main-thread blocking)
        // Concurrency > 1 allows processing multiple heavy jobs simultaneously in the background
        this.worker = new Worker(
            this.queueName,
            async (job: Job) => {
                return this.processJob(job);
            },
            { connection, concurrency: 5 }
        );

        this.setupListeners();
    }

    private setupListeners() {
        this.worker.on('completed', (job: Job, returnvalue: any) => {
            console.log(`[DistributedTaskQueue] Job ${job.id} completed! Triggering notification.`);
            // Push notification logic goes here when job finishes
            this.notifyUser(job.data.userId, `Your task ${job.name} is complete!`, returnvalue);
        });

        this.worker.on('failed', (job: Job | undefined, error: Error) => {
            console.error(`[DistributedTaskQueue] Job ${job?.id} failed:`, error);
        });
    }

    private async processJob(job: Job) {
        switch (job.name) {
            case 'generate-massive-pdf':
                return this.handleHeavyPdfGeneration(job.data);
            default:
                throw new Error(`Unknown job type: ${job.name}`);
        }
    }

    private async handleHeavyPdfGeneration(data: any) {
        // Simulated heavy asynchronous task (e.g., 10,000 page PDF)
        // In a real scenario, this delegates the heavy processing off the main thread.
        console.log(`[DistributedTaskQueue] Starting heavy PDF generation for client ${data.clientId}...`);
        
        // Simulate heavy work
        await new Promise((resolve) => setTimeout(resolve, 5000)); 
        
        return { 
            success: true, 
            fileUrl: `/downloads/invoices/${data.clientId}-massive.pdf`,
            pageCount: 10000 
        };
    }

    private notifyUser(userId: string, message: string, payload: any) {
        // In a real application, this would use WebSockets, Server-Sent Events, or Push API
        console.log(`[Notification -> User ${userId}]: ${message}`, payload);
    }

    /**
     * Enqueue a massive PDF generation job.
     * This returns immediately, offloading the work to the worker.
     */
    public async enqueuePdfGeneration(clientId: string, userId: string, invoiceData: any) {
        const job = await this.queue.add('generate-massive-pdf', {
            clientId,
            userId,
            invoiceData
        }, {
            attempts: 3, // Retry on failure
            backoff: { type: 'exponential', delay: 1000 }
        });
        
        console.log(`[DistributedTaskQueue] Enqueued PDF job with ID ${job.id}`);
        return job.id;
    }

    public async close() {
        await this.worker.close();
        await this.queueEvents.close();
        await this.queue.close();
    }
}

// Export a singleton instance for enterprise usage
export const enterpriseQueue = new DistributedTaskQueue();
