import { Worker, WorkerOptions, Job } from 'bullmq';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const workerOptions: WorkerOptions = {
  connection: {
    url: redisUrl,
  },
};

// Mocking the scheduler and router for now
const processPayoutScheduler = async (job: Job) => {
  console.log(`[PayoutWorker] Processing job ${job.id}`, job.data);
};

const processNotificationRouter = async (job: Job) => {
  console.log(`[NotificationWorker] Processing job ${job.id}`, job.data);
};

export const startWorkers = () => {
  const payoutWorker = new Worker(
    'payouts',
    async (job: Job) => {
      await processPayoutScheduler(job);
    },
    { ...workerOptions, concurrency: 5 }
  );

  payoutWorker.on('completed', (job: Job) => {
    console.log(`Payout job ${job.id} completed.`);
  });

  payoutWorker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`Payout job ${job?.id} failed:`, err);
  });

  const notificationWorker = new Worker(
    'notifications',
    async (job: Job) => {
      await processNotificationRouter(job);
    },
    { ...workerOptions, concurrency: 10 }
  );

  notificationWorker.on('completed', (job: Job) => {
    console.log(`Notification job ${job.id} completed.`);
  });

  notificationWorker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`Notification job ${job?.id} failed:`, err);
  });

  console.log('BullMQ workers started.');
  return { payoutWorker, notificationWorker };
};
