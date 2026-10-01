
import { createServerFn } from '@tanstack/react-start';
import type { MarginDashboardSnapshot, StrategicBusinessProposal, BroadcastNetworkStatus, BroadcastExecutionReceipt } from './UmarOS_Master_Dashboard';
import { getSql } from "@/lib/db";

export const getMarginSnapshotFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    let baseSales = 0;
    let distSales = 0;
    try {
      const sql = await getSql();
      const res = await sql`SELECT SUM(total_paise) as total FROM orders WHERE status = 'delivered'`;
      if (res && res[0] && res[0].total) {
        baseSales = Number(res[0].total);
      }
    } catch (e) {
      // Safe fallback if table doesn't exist yet
    }
    return {
      baseMarginBps: 1200,
      distantMarginBps: 1500,
      loyaltyShareBps: 100,
      verifiedBaseSalesPaise: baseSales,
      verifiedDistantSalesPaise: distSales,
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
      verifiedBaseSalesPaise: 0,
      verifiedDistantSalesPaise: 0,
      periodLabel: 'Today',
      updatedAt: new Date().toISOString()
    } as MarginDashboardSnapshot;
  });

export const listStrategicProposalsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    return [] as StrategicBusinessProposal[]; // REALITY: No AI proposals exist yet in DB
  });

export const executeStrategicProposalFn = createServerFn({ method: 'POST' })
  .inputValidator((id: string) => id)
  .handler(async ({ data }) => {
    throw new Error("Cannot execute non-existent proposal.");
  });

export const getBroadcastStatusFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    let subs = 0;
    try {
      const sql = await getSql();
      const res = await sql`SELECT COUNT(*) as c FROM push_subscriptions`;
      if (res && res[0] && res[0].c) subs = Number(res[0].c);
    } catch (e) {}
    
    return { 
      enabled: false, 
      providerReady: false, 
      providerName: 'FCM', 
      complianceStatus: 'PENDING', 
      reachableDevices: subs, 
      subscribedRecipients: subs, 
      lastBroadcastAt: new Date().toISOString(), 
      state: 'IDLE', 
      deliveryCostPaise: 0, 
      channels: ['WEB_PUSH'] 
    } as BroadcastNetworkStatus;
  });

export const executeGlobalBroadcastFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    throw new Error("FCM/Broadcast provider not configured yet.");
  });

