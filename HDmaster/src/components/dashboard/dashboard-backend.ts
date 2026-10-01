import {
  loadSettings,
  saveSettingsFn,
  loadPendingApprovalsFn,
  resolveFounderApprovalFn,
} from "@/lib/orderking/actions";
import type {
  MarginDashboardSnapshot,
  StrategicBusinessProposal,
  BroadcastNetworkStatus,
  BroadcastExecutionReceipt,
} from "./UmarOS_Master_Dashboard";

export async function getMarginSnapshot(): Promise<MarginDashboardSnapshot> {
  const result = await loadSettings();
  if (!result.ok) throw new Error(result.error);

  const settings = result.data;
  return {
    baseMarginBps: Number(settings.commissionBps),
    distantMarginBps: Number(settings.longDistanceCommissionBps),
    loyaltyShareBps: null,
    verifiedBaseSalesPaise: null,
    verifiedDistantSalesPaise: null,
    periodLabel: "Current platform policy",
    updatedAt: new Date().toISOString(),
  };
}

export async function updateMargins(input: {
  baseMarginBps: number;
  distantMarginBps: number;
}): Promise<MarginDashboardSnapshot> {
  if (!Number.isInteger(input.baseMarginBps) || !Number.isInteger(input.distantMarginBps)) {
    throw new Error("INVALID_MARGIN_POLICY");
  }
  if (input.baseMarginBps < 0 || input.baseMarginBps > 10000) {
    throw new Error("BASE_MARGIN_OUT_OF_RANGE");
  }
  if (input.distantMarginBps < 0 || input.distantMarginBps > 10000) {
    throw new Error("DISTANT_MARGIN_OUT_OF_RANGE");
  }

  const current = await loadSettings();
  if (!current.ok) throw new Error(current.error);

  const saved = await saveSettingsFn({
    settings: {
      ...current.data,
      commissionBps: input.baseMarginBps,
      townCommissionBps: input.baseMarginBps,
      longDistanceCommissionBps: input.distantMarginBps,
    },
    reason: "Founder updated margin policy from Umar OS Master Dashboard",
  });

  if (!saved.ok) throw new Error(saved.error);
  return getMarginSnapshot();
}

export async function listStrategicProposals(): Promise<StrategicBusinessProposal[]> {
  const result = await loadPendingApprovalsFn();
  if (!result.ok) throw new Error(result.error);

  return result.data.map((item: any) => {
    let details: Record<string, unknown> = {};
    try {
      details = JSON.parse(item.detailsJson || "{}");
    } catch {
      details = {};
    }

    return {
      id: item.id,
      title: String(item.action || "Founder approval request"),
      problem: String(
        details.problem ??
          details.why ??
          details.description ??
          "Founder approval requested by the existing approval engine.",
      ),
      solution: String(
        details.solution ??
          details.expectedResult ??
          item.notes ??
          item.action ??
          "Review the requested action.",
      ),
      scopeLabel: String(item.module || "Founder approval"),
      source: String(item.requestedBy || "Founder Approval Engine"),
      risk: Number(item.amountPaise ?? 0) > 0 ? "HIGH" : "MEDIUM",
      status: "PENDING",
      estimatedImpactPaise: item.amountPaise ?? null,
      createdAt: item.requestedAt,
      evidence: [
        "Persisted founder approval record",
        item.module,
        item.requestedBy,
      ].filter(Boolean),
    } satisfies StrategicBusinessProposal;
  });
}

export async function executeStrategicProposal(
  proposalId: string,
): Promise<StrategicBusinessProposal> {
  const result = await resolveFounderApprovalFn({
    id: proposalId,
    decision: "APPROVED",
  });
  if (!result.ok) throw new Error(result.error);

  const remaining = await listStrategicProposals();
  const approved = remaining.find((item) => item.id === proposalId);

  return {
    ...(approved ?? {
      id: proposalId,
      title: "Founder approval",
      problem: "Approval record resolved.",
      solution: "Approval state persisted; downstream execution remains governed by its registered action.",
      scopeLabel: "Founder approval",
      source: "Founder Approval Engine",
      risk: "MEDIUM",
      estimatedImpactPaise: null,
      createdAt: new Date().toISOString(),
      evidence: ["Approval state persisted"],
    }),
    status: "APPROVED",
  };
}

export async function getBroadcastStatus(): Promise<BroadcastNetworkStatus> {
  return {
    enabled: false,
    providerReady: false,
    providerName: null,
    complianceStatus: "UNKNOWN",
    reachableDevices: null,
    subscribedRecipients: null,
    lastBroadcastAt: null,
    state: "IDLE",
    deliveryCostPaise: null,
    channels: [],
  };
}

export async function executeGlobalBroadcast(): Promise<BroadcastExecutionReceipt> {
  throw new Error("GLOBAL_BROADCAST_PROVIDER_NOT_CONNECTED");
}

export const engine = {
  getMarginSnapshot,
  updateMargins,
  listStrategicProposals,
  executeStrategicProposal,
  getBroadcastStatus,
  executeGlobalBroadcast,
};
