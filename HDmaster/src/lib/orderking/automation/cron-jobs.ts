// @ts-nocheck
import { payoutQueue } from './queue-setup';

export const scheduleMidnightSettlement = async () => {
  // Use BullMQ repeatable jobs to trigger `payout-scheduler` every midnight
  await payoutQueue.add(
    'midnight-settlement',
    { action: 'settle' },
    {
      repeat: { pattern: '0 0 * * *', 
        pattern: '0 0 * * *', // cron expression for midnight
      },
    }
  );
  console.log('Scheduled midnight settlement job');
};
