import { Queue, QueueOptions } from 'bullmq';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const queueOptions: QueueOptions = {
  connection: {
    url: redisUrl,
  },
};

export const payoutQueue = new Queue('payouts', queueOptions);
export const notificationQueue = new Queue('notifications', queueOptions);
