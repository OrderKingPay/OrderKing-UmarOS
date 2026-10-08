import { payoutQueue } from './queue-setup';

export const scheduleMidnightSettlement = async () => {
  await payoutQueue.add(
    'midnight-settlement',
    { action: 'settle' }
  );
  console.log('Scheduled midnight settlement job');
};
