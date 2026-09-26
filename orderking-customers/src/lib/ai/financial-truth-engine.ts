// HDmaster Founder AI — Zero-Fabrication Financial Truth Engine
// Implements Directive §2 (Real-Money Operating Engine), §15 (Economic Optimization), & §16 (Zero-Fabrication Accounting)

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

export interface UnitEconomics {
  grossRevenueInr: number;
  platformFeesInr: number;
  paymentGatewayFeesInr: number;
  infrastructureCostInr: number;
  aiApiCostInr: number;
  estimatedLaborInr: number;
  netContributionInr: number;
  marginPercentage: number;
}

export interface FinancialTruthRecord {
  id: string;
  title: string;
  clientName: string;
  category: "client_services" | "freelance_contract" | "saas_subscription" | "digital_product" | "consulting_retainer";
  stage: FinancialStage;
  estimatedValueInr: number;
  invoicedAmountInr: number;
  confirmedReceivedInr: number;
  economics: UnitEconomics;
  sourceEvidence: string;
  invoiceId?: string;
  paymentTxnRef?: string;
  currency: string;
  createdAt: string;
  verifiedAt?: string;
}

/**
 * Calculates strict, transparent unit economics
 * Formula: Net Contribution = Revenue - (Platform Fees + Gateway Fees + Infra + AI API + Labor)
 */
export function calculateUnitEconomics(
  revenueInr: number,
  platformFeePct = 0, // 0% on OrderKing direct UPI
  gatewayFeePct = 0,   // 0% on UPI VPA
  infraCostInr = 150,
  aiApiCostInr = 45,
  laborCostInr = 500
): UnitEconomics {
  const platformFeesInr = Math.round((revenueInr * platformFeePct) / 100);
  const paymentGatewayFeesInr = Math.round((revenueInr * gatewayFeePct) / 100);
  const totalDeductions = platformFeesInr + paymentGatewayFeesInr + infraCostInr + aiApiCostInr + laborCostInr;
  const netContributionInr = Math.max(0, revenueInr - totalDeductions);
  const marginPercentage = revenueInr > 0 ? Math.round((netContributionInr / revenueInr) * 100) : 0;

  return {
    grossRevenueInr: revenueInr,
    platformFeesInr,
    paymentGatewayFeesInr,
    infrastructureCostInr: infraCostInr,
    aiApiCostInr,
    estimatedLaborInr: laborCostInr,
    netContributionInr,
    marginPercentage,
  };
}

// Initial Curated Opportunities with Truthful Accounting Statuses
export const INITIAL_FINANCIAL_RECORDS: FinancialTruthRecord[] = [];


export interface FinancialTelemetrySummary {
  actualConfirmedRevenueInr: number;
  invoicedPendingInr: number;
  projectedPipelineInr: number;
  activeOpportunitiesCount: number;
  confirmedTransactionsCount: number;
  averageContributionMarginPct: number;
}

/**
 * Calculates strict, zero-fabrication financial truth totals
 * Crucial Rule: actualConfirmedRevenueInr ONLY counts records where stage === "REVENUE_RECORDED" or "PAYMENT_CONFIRMED"
 */
export function calculateFinancialTelemetry(records: FinancialTruthRecord[]): FinancialTelemetrySummary {
  let actualConfirmed = 0;
  let invoicedPending = 0;
  let projected = 0;
  let confirmedCount = 0;
  let totalMargin = 0;

  for (const r of records) {
    if (r.stage === "PAYMENT_CONFIRMED" || r.stage === "REVENUE_RECORDED") {
      actualConfirmed += r.confirmedReceivedInr;
      confirmedCount++;
    } else if (r.stage === "INVOICED" || r.stage === "PAYMENT_PENDING") {
      invoicedPending += r.invoicedAmountInr;
    } else if (r.stage !== "CANCELLED" && r.stage !== "REFUNDED") {
      projected += r.estimatedValueInr;
    }
    totalMargin += r.economics.marginPercentage;
  }

  const avgMargin = records.length > 0 ? Math.round(totalMargin / records.length) : 0;

  return {
    actualConfirmedRevenueInr: actualConfirmed,
    invoicedPendingInr: invoicedPending,
    projectedPipelineInr: projected,
    activeOpportunitiesCount: records.length,
    confirmedTransactionsCount: confirmedCount,
    averageContributionMarginPct: avgMargin,
  };
}
