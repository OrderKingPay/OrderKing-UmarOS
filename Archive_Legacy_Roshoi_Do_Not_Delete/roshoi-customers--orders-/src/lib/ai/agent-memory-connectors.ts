// HDmaster Founder AI — Universal Connector Architecture & Layered Agent Memory
// Implements Directive §18 (Universal Connector Architecture), §19 (Provider Fallback), & §20 (Agent Memory)

export interface Connector {
  id: string;
  name: string;
  category: "ai_provider" | "payments" | "search" | "cloud" | "database" | "communication";
  capabilities: string[];
  authenticate: () => Promise<{ success: boolean; message: string }>;
  execute: (action: string, input: any) => Promise<any>;
  healthCheck: () => Promise<{ healthy: boolean; latencyMs: number }>;
}

/**
 * 3-Tier Provider Fallback Pipeline (§19)
 * Primary -> Secondary -> Tertiary -> Safe Failure with Human Notice
 */
export async function executeWithFallback<T>(
  actionName: string,
  input: any,
  providers: Array<{ name: string; fn: () => Promise<T> }>
): Promise<{ success: boolean; data: T | null; providerUsed: string; error?: string }> {
  let lastError = "";

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i]!;
    try {
      const data = await p.fn();
      return { success: true, data, providerUsed: p.name };
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.warn(`[HDmaster Fallback] Provider ${p.name} failed for ${actionName}: ${lastError}`);
    }
  }

  return {
    success: false,
    data: null,
    providerUsed: "NONE",
    error: `All ${providers.length} fallback providers failed for ${actionName}. Last error: ${lastError}`,
  };
}

export interface LayeredAgentMemory {
  founderPreferences: {
    preferredUpiVpa: string;
    pilotTown: string;
    minHourlyUsd: number;
    autoApproveLowRisk: boolean;
  };
  clientNotes: Record<string, string>;
  projectContexts: Record<string, { currentMilestone: string; blockers: string[] }>;
  recentAuditLogs: Array<{ action: string; timestamp: string; verified: boolean }>;
}

export const INITIAL_AGENT_MEMORY: LayeredAgentMemory = {
  founderPreferences: {
    preferredUpiVpa: "orderking@okhdfcbank",
    pilotTown: "Karimganj / Sribhumi",
    minHourlyUsd: 85,
    autoApproveLowRisk: true,
  },
  clientNotes: {
    "Royal Darbar Palace": "Sensitive to aggregator commission rates. Values direct customer database ownership.",
    "Apex Retailers": "Requires double-entry ledger proof for GST compliance audits.",
  },
  projectContexts: {
    "PRJ-001": {
      currentMilestone: "Milestone 2: Backend & UPI QR Integration",
      blockers: [],
    },
  },
  recentAuditLogs: [
    { action: "INVOICE_GENERATED_INV-RD-901", timestamp: "2026-09-21 11:15 IST", verified: true },
    { action: "PAYMENT_CONFIRMED_FEV-101", timestamp: "2026-09-20 18:42 IST", verified: true },
  ],
};
