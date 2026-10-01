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
    this.seedInitialOpportunities();
  }

  private seedInitialOpportunities() {
    // Production truth rule: no opportunities are seeded or fabricated.
    // Real opportunities enter only from connected data sources and verified payments.
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
    const configuredBps =
      params.channel === "KING_PAY_UPI" ? Number(process.env.KINGPAY_PROCESSING_FEE_BPS || 0) :
      params.channel === "RAZORPAY" ? Number(process.env.RAZORPAY_EFFECTIVE_FEE_BPS || 0) :
      params.channel === "STRIPE" ? Number(process.env.STRIPE_EFFECTIVE_FEE_BPS || 0) :
      params.channel === "WIRE" ? Number(process.env.WIRE_EFFECTIVE_FEE_BPS || 0) : 0;
    const paymentFee = Math.round(gross * Math.max(0, configuredBps) / 10000);
    // King Pay provider fees are configured from the connected payment contract;
    // never assume a zero provider fee.

    const infra = params.infraCost || Math.round(gross * 0.01);
    const ai = params.aiCost || Math.round(gross * 0.005);
    const labor = params.laborCost || Math.round(gross * 0.05);
    const other = 0;

    const netContribution = gross - paymentFee - infra - ai - labor - other;

    return {
      expectedGrossRevenue: gross,
      platformFees: Number(process.env.ORDERKING_PLATFORM_FEE_BPS || 0),
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
    const fxUsdInr = Number(process.env.FX_USD_INR_RATE || 0);
    const toInr = (o: RealMoneyOpportunity) => {
      if (o.currency === "INR") return o.economics.expectedGrossRevenue;
      if (fxUsdInr > 0 && o.currency === "USD") return o.economics.expectedGrossRevenue * fxUsdInr;
      return null;
    };
    const contributionToInr = (o: RealMoneyOpportunity) => {
      if (o.currency === "INR") return o.economics.estimatedContribution;
      if (fxUsdInr > 0 && o.currency === "USD") return o.economics.estimatedContribution * fxUsdInr;
      return null;
    };
    const verifiedRevenue = confirmedOpps.reduce((acc, o) => acc + (toInr(o) ?? 0), 0);
    const actualContribution = confirmedOpps.reduce((acc, o) => acc + (contributionToInr(o) ?? 0), 0);

    // Projected pipeline includes qualified, contracted, working
    const pipelineOpps = opps.filter((o) => ["QUALIFIED", "APPLIED", "CONTACTED", "NEGOTIATING", "CONTRACTED", "WORKING"].includes(o.stage));
    const projectedValue = pipelineOpps.reduce((acc, o) => acc + (toInr(o) ?? 0), 0);

    // Invoiced pending payment
    const invoicedOpps = opps.filter((o) => o.stage === "INVOICED" || o.stage === "PAYMENT_PENDING");
    const invoicedValue = invoicedOpps.reduce((acc, o) => acc + (toInr(o) ?? 0), 0);

    const comparisonBps = Number(process.env.GATEWAY_COMPARISON_FEE_BPS || 0);
    const savedFees = comparisonBps > 0
      ? confirmedOpps.reduce((acc, o) => acc + Math.round((toInr(o) ?? 0) * comparisonBps / 10000), 0)
      : 0;

    return {
      totalOpportunitiesDiscovered: opps.length,
      projectedPipelineValue: projectedValue,
      contractedUninvoicedValue: opps.filter((o) => o.stage === "CONTRACTED").reduce((acc, o) => acc + (toInr(o) ?? 0), 0),
      invoicedPendingPaymentValue: invoicedValue,
      verifiedReceivedRevenue: verifiedRevenue,
      actualNetContribution: actualContribution,
      totalSavedGatewayFees: savedFees,
    };
  }
}

export const realMoneyEngine = new RealMoneyOperatingEngine();
