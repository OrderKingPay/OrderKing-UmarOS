// Founder Approval Governor (Directive 17)
// Minimizes founder interruptions by categorizing actions into LOW, MEDIUM, and HIGH risk.
// High-Risk Actions (spending money, signing contracts, financial transfers, irreversible deletion, sensitive disclosures)
// require explicit Founder Approval with structured preview: WHAT, WHY, WHO, COST, EXPECTED RESULT, RISK, PREVIEW, APPROVE / REJECT.

export type ActionRiskCategory = "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK";

export interface FounderApprovalCard {
  id: string;
  action: string;
  riskCategory: ActionRiskCategory;
  what: string;
  why: string;
  who: string;
  costInr: number;
  expectedResult: string;
  riskDescription: string;
  previewPayload: Record<string, unknown>;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "AUTO_EXECUTED";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export class FounderApprovalGovernor {
  private approvalQueue: Map<string, FounderApprovalCard> = new Map();

  constructor() {
    this.seedPendingApproval();
  }

  private seedPendingApproval() {
    const card1: FounderApprovalCard = {
      id: "APPR-101",
      action: "sign_and_execute_client_contract",
      riskCategory: "HIGH_RISK",
      what: "Sign Contract CTR-982103 for Assam Valley Organic Tea Next.js 15 Storefront.",
      why: "Client agreed to commercial terms (₹2,99,999) and 50% milestone advance.",
      who: "Assam Valley Organic Tea & Spices (Mr. Pranab Barua)",
      costInr: 0,
      expectedResult: "Legally binding agreement formed; triggers generation of 50% advance invoice (₹1,49,999).",
      riskDescription: "HIGH_RISK: Legal delivery commitment and 21-day SLA binding.",
      previewPayload: {
        contractId: "CTR-982103",
        amountInr: 299999,
        advanceInr: 149999,
        timelineDays: 21,
      },
      status: "PENDING_APPROVAL",
      createdAt: "2026-09-22 07:00",
    };

    this.approvalQueue.set(card1.id, card1);
  }

  evaluateAction(params: {
    action: string;
    what: string;
    why: string;
    who: string;
    costInr?: number;
    expectedResult: string;
    riskCategory: ActionRiskCategory;
    previewPayload: Record<string, unknown>;
  }): { requiresApproval: boolean; approvalCard?: FounderApprovalCard; autoExecuted: boolean } {
    if (params.riskCategory === "LOW_RISK") {
      return { requiresApproval: false, autoExecuted: true };
    }

    const id = `APPR-${Date.now().toString().slice(-4)}`;
    const card: FounderApprovalCard = {
      id,
      action: params.action,
      riskCategory: params.riskCategory,
      what: params.what,
      why: params.why,
      who: params.who,
      costInr: params.costInr || 0,
      expectedResult: params.expectedResult,
      riskDescription:
        params.riskCategory === "HIGH_RISK"
          ? "HIGH RISK: Requires explicit founder sign-off before proceeding."
          : "MEDIUM RISK: Prepared per policy; awaiting confirmation.",
      previewPayload: params.previewPayload,
      status: "PENDING_APPROVAL",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    this.approvalQueue.set(id, card);
    return { requiresApproval: true, approvalCard: card, autoExecuted: false };
  }

  approve(id: string, founderId: string = "founder-01"): FounderApprovalCard {
    const card = this.approvalQueue.get(id);
    if (!card) throw new Error(`Approval card ${id} not found.`);
    card.status = "APPROVED";
    card.resolvedAt = new Date().toISOString().replace("T", " ").slice(0, 16);
    card.resolvedBy = founderId;
    return card;
  }

  reject(id: string, founderId: string = "founder-01"): FounderApprovalCard {
    const card = this.approvalQueue.get(id);
    if (!card) throw new Error(`Approval card ${id} not found.`);
    card.status = "REJECTED";
    card.resolvedAt = new Date().toISOString().replace("T", " ").slice(0, 16);
    card.resolvedBy = founderId;
    return card;
  }

  getPendingApprovals(): FounderApprovalCard[] {
    return Array.from(this.approvalQueue.values()).filter((c) => c.status === "PENDING_APPROVAL");
  }

  getAllApprovals(): FounderApprovalCard[] {
    return Array.from(this.approvalQueue.values());
  }
}

export const founderApprovalGovernor = new FounderApprovalGovernor();
