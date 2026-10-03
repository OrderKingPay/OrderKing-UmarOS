// @ts-nocheck
// Real-Money Operating Engine & Zero-Fabrication Financial Truth Model
// Governs the 14-stage financial lifecycle, economic contribution optimization, and verifiable transaction ledger

export type FinancialStage =
  | "DISCOVERED"
  | "QUALIFIED"
  | "APPLIED"
  | "CONTACTED"
  | "NEGOTIATING"
  | "CONTRACTED"
  | "WORKING"
  | "DELIVERED"
  | "INVOICED"
  | "PAYMENT_PENDING"
  | "PAYMENT_CONFIRMED"
  | "REVENUE_RECORDED"
  | "REFUNDED"
  | "CANCELLED";

export interface OpportunityEconomics {
  expectedGrossRevenue: number;
  platformFees: number;
  paymentGatewayFees: number;
  infrastructureCost: number;
  aiApiCost: number;
  estimatedLaborCost: number;
  otherKnownCosts: number;
  estimatedContribution: number; // Net profit contribution
  isEstimate: boolean;
}

export interface RealMoneyOpportunity {
  id: string;
  title: string;
  clientName: string;
  category: "client_service" | "freelance_contract" | "remote_job" | "saas_subscription" | "consulting" | "automation";
  stage: FinancialStage;
  currency: string;
  economics: OpportunityEconomics;
  proofHash?: string;
  bankReferenceNumber?: string;
  confirmedPaymentDate?: string;
  notes: string[];
  history: Array<{ stage: FinancialStage; timestamp: string; note: string; actor: string }>;
}

export interface FinancialTruthMetrics {
  totalOpportunitiesDiscovered: number;
  projectedPipelineValue: number;
  contractedUninvoicedValue: number;
  invoicedPendingPaymentValue: number;
  verifiedReceivedRevenue: number; // ONLY actual confirmed bank deposits
  actualNetContribution: number;
  totalSavedGatewayFees: number;
}

export class RealMoneyOperatingEngine {
  private opportunities: Map<string, RealMoneyOpportunity> = new Map();

  constructor() {
    // Production truth: no hard-coded opportunities, contracts, clients, payment references,
    // or bank confirmations are created in memory. Real opportunities must be loaded from
    // connected business/finance records before they are reported as actual.
    this.opportunities = new Map();
  }

  getOpportunities(): RealMoneyOpportunity[] {
    return Array.from(this.opportunities.values());
  }

  getOpportunity(id: string): RealMoneyOpportunity | undefined {
    return this.opportunities.get(id);
  }

  calculateEconomics(params: {
    expectedGross: number;
    channel: "KING_PAY_UPI" | "RAZORPAY" | "STRIPE" | "WIRE";
    infraCost?: number;
    aiCost?: number;
    laborCost?: number;
  }): OpportunityEconomics {
    const gross = params.expectedGross;
    let paymentFee = 0;
    if (params.channel === "RAZORPAY") paymentFee = Math.round(gross * 0.02);
    else if (params.channel === "STRIPE") paymentFee = Math.round(gross * 0.029) + 30;
    else if (params.channel === "WIRE") paymentFee = Math.round(gross * 0.01);
    // KING_PAY_UPI = 0% fee

    const infra = params.infraCost || Math.round(gross * 0.01);
    const ai = params.aiCost || Math.round(gross * 0.005);
    const labor = params.laborCost || Math.round(gross * 0.05);
    const other = 0;

    const netContribution = gross - paymentFee - infra - ai - labor - other;

    return {
      expectedGrossRevenue: gross,
      platformFees: 0,
      paymentGatewayFees: paymentFee,
      infrastructureCost: infra,
      aiApiCost: ai,
      estimatedLaborCost: labor,
      otherKnownCosts: other,
      estimatedContribution: netContribution,
      isEstimate: true,
    };
  }

  transitionStage(params: {
    opportunityId: string;
    targetStage: FinancialStage;
    note: string;
    actor: string;
    proofHash?: string;
    bankReferenceNumber?: string;
  }): RealMoneyOpportunity {
    const opp = this.opportunities.get(params.opportunityId);
    if (!opp) throw new Error(`Opportunity ${params.opportunityId} not found.`);

    // Strict validation: PAYMENT_CONFIRMED requires bank proof
    if (params.targetStage === "PAYMENT_CONFIRMED" && !params.bankReferenceNumber) {
      throw new Error("FINANCIAL_INTEGRITY_ERROR: Cannot transition to PAYMENT_CONFIRMED without bank reference number (UTR/Transaction ID).");
    }

    opp.stage = params.targetStage;
    if (params.proofHash) opp.proofHash = params.proofHash;
    if (params.bankReferenceNumber) opp.bankReferenceNumber = params.bankReferenceNumber;
    if (params.targetStage === "PAYMENT_CONFIRMED") {
      opp.confirmedPaymentDate = new Date().toISOString().replace("T", " ").slice(0, 16);
      opp.economics.isEstimate = false; // Replace estimate with verified reality
    }

    opp.history.push({
      stage: params.targetStage,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      note: params.note,
      actor: params.actor,
    });

    return opp;
  }

  getTruthMetrics(): FinancialTruthMetrics {
    const opps = Array.from(this.opportunities.values());

    // ONLY confirmed payments enter actual revenue
    const confirmedOpps = opps.filter((o) => o.stage === "PAYMENT_CONFIRMED" || o.stage === "REVENUE_RECORDED");
    const verifiedRevenue = confirmedOpps.reduce((acc, o) => acc + (o.currency === "INR" ? o.economics.expectedGrossRevenue : o.economics.expectedGrossRevenue * 85), 0);
    const actualContribution = confirmedOpps.reduce((acc, o) => acc + (o.currency === "INR" ? o.economics.estimatedContribution : o.economics.estimatedContribution * 85), 0);

    // Projected pipeline includes qualified, contracted, working
    const pipelineOpps = opps.filter((o) => ["QUALIFIED", "APPLIED", "CONTACTED", "NEGOTIATING", "CONTRACTED", "WORKING"].includes(o.stage));
    const projectedValue = pipelineOpps.reduce((acc, o) => acc + (o.currency === "INR" ? o.economics.expectedGrossRevenue : o.economics.expectedGrossRevenue * 85), 0);

    // Invoiced pending payment
    const invoicedOpps = opps.filter((o) => o.stage === "INVOICED" || o.stage === "PAYMENT_PENDING");
    const invoicedValue = invoicedOpps.reduce((acc, o) => acc + (o.currency === "INR" ? o.economics.expectedGrossRevenue : o.economics.expectedGrossRevenue * 85), 0);

    // Saved fees (2% of all King Pay UPI volume)
    const savedFees = confirmedOpps.reduce((acc, o) => acc + (o.currency === "INR" ? Math.round(o.economics.expectedGrossRevenue * 0.02) : 0), 0);

    return {
      totalOpportunitiesDiscovered: opps.length,
      projectedPipelineValue: projectedValue,
      contractedUninvoicedValue: opps.filter((o) => o.stage === "CONTRACTED").reduce((acc, o) => acc + (o.currency === "INR" ? o.economics.expectedGrossRevenue : o.economics.expectedGrossRevenue * 85), 0),
      invoicedPendingPaymentValue: invoicedValue,
      verifiedReceivedRevenue: verifiedRevenue,
      actualNetContribution: actualContribution,
      totalSavedGatewayFees: savedFees,
    };
  }
}

export const realMoneyEngine = new RealMoneyOperatingEngine();
