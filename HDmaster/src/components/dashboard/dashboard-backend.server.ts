import { createServerFn } from '@tanstack/react-start';
import {
  getMarginSnapshot,
  updateMargins,
  listStrategicProposals,
  executeStrategicProposal,
  getBroadcastStatus,
  executeGlobalBroadcast,
} from './dashboard-backend';

export const getMarginSnapshotFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await getMarginSnapshot();
  });

export const updateMarginsFn = createServerFn({ method: 'POST' })
  .inputValidator((val: { baseMarginBps: number; distantMarginBps: number; }) => val)
  .handler(async ({ data }) => {
    return await updateMargins(data);
  });

export const listStrategicProposalsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await listStrategicProposals();
  });

export const executeStrategicProposalFn = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    return await executeStrategicProposal(data);
  });

export const getBroadcastStatusFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    return await getBroadcastStatus();
  });

export const executeGlobalBroadcastFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    return await executeGlobalBroadcast();
  });
