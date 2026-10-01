
import { createServerFn } from '@tanstack/react-start';
import type { MarginDashboardSnapshot, StrategicBusinessProposal, BroadcastNetworkStatus, BroadcastExecutionReceipt } from './UmarOS_Master_Dashboard';

export const getMarginSnapshotFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    return {
      baseMarginBps: 1200,
      distantMarginBps: 1500,
      loyaltyShareBps: 100,
      verifiedBaseSalesPaise: 4500000,
      verifiedDistantSalesPaise: 1200000,
      periodLabel: 'Today',
      updatedAt: new Date().toISOString()
    } as MarginDashboardSnapshot;
  });

export const updateMarginsFn = createServerFn({ method: 'POST' })
  .inputValidator((val: { baseMarginBps: number; distantMarginBps: number; }) => val)
  .handler(async ({ data }) => {
    return {
      baseMarginBps: data.baseMarginBps,
      distantMarginBps: data.distantMarginBps,
      loyaltyShareBps: 100,
      verifiedBaseSalesPaise: 4500000,
      verifiedDistantSalesPaise: 1200000,
      periodLabel: 'Today',
      updatedAt: new Date().toISOString()
    } as MarginDashboardSnapshot;
  });

export const listStrategicProposalsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    return [
      { id: 'prop-1', title: 'Weekend Push', problem: 'Low volume', solution: '20% off all orders', scopeLabel: 'Global', source: 'AI', risk: 'LOW', confidencePct: 92, estimatedImpactPaise: 15000000, status: 'PENDING', createdAt: new Date().toISOString(), evidence: [] },
    ] as StrategicBusinessProposal[];
  });

export const executeStrategicProposalFn = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    return { id: data, title: 'Executed', problem: '', solution: '', scopeLabel: 'Global', source: 'AI', risk: 'LOW', confidencePct: 100, estimatedImpactPaise: 0, status: 'EXECUTED', createdAt: new Date().toISOString(), evidence: [] } as StrategicBusinessProposal;
  });

export const getBroadcastStatusFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    return { enabled: true, providerReady: true, providerName: 'FCM', complianceStatus: 'COMPLIANT', reachableDevices: 4500, subscribedRecipients: 4500, lastBroadcastAt: new Date().toISOString(), state: 'IDLE', deliveryCostPaise: 25000, channels: ['WEB_PUSH'] } as BroadcastNetworkStatus;
  });

export const executeGlobalBroadcastFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    return { id: 'broadcast-1', acceptedAt: new Date().toISOString(), queuedRecipients: 4500, provider: 'FCM', status: 'QUEUED' } as BroadcastExecutionReceipt;
  });

