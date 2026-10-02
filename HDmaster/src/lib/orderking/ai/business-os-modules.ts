// Business OS Modules.
// Truth rule: this synchronous facade never fabricates production business facts.
// Live database/provider adapters should supply measured data. When they are absent,
// these methods return explicit "LIVE_DATA_REQUIRED" states instead of demo figures.

export interface FinancialPnLReport {
  dataStatus: "LIVE_DATA_REQUIRED" | "MEASURED";
  period: string | null;
  grossMerchandiseValueInr: number;
  netRevenueInr: number;
  aggregatorSavingsInr: number;
  operatingExpensesInr: number;
  gstInputTaxCreditInr: number;
  netFounderProfitInr: number;
  cashRunwayMonths: number | null;
  retainedCapitalVaultInr: number;
}

export interface LawfulSalesLead {
  id: string;
  businessName: string;
  locality: string;
  currentCommissionRatePct: number | null;
  estimatedMonthlyOrders: number | null;
  annualAggregatorLossInr: number | null;
  recommendedOrderKingTier: "Basic 0%" | "Enterprise Pro" | "Custom Fleet" | "UNVERIFIED";
  verifiedContactChannel: string | null;
  status: "DISCOVERED" | "PITCH_COMPILED" | "OUTREACH_PENDING" | "CONTRACT_SIGNED" | "UNVERIFIED";
}

export interface KitchenSlaReport {
  restaurantId: string;
  restaurantName: string;
  avgPrepMinutes: number | null;
  ordersProcessed: number | null;
  delayedOrdersCount: number | null;
  cancellationRatePct: number | null;
  complianceStatus: "OPTIMAL" | "ATTENTION_REQUIRED" | "CRITICAL_SLA_BREACH" | "UNVERIFIED";
  correctiveAction: string;
}

export interface InventoryItemAlert {
  itemId: string;
  itemName: string;
  currentStock: number | null;
  unit: string | null;
  reorderPoint: number | null;
  consumptionRatePerDay: number | null;
  daysRemaining: number | null;
  recommendedOrderQty: number | null;
  estimatedCostInr: number | null;
  preferredSupplier: string | null;
}

export interface SreHealthStatus {
  service: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN" | "UNVERIFIED";
  latencyP99Ms: number | null;
  uptimePct: number | null;
  activeDeployCommit: string | null;
  canaryPassed: boolean | null;
  autoRollbackArmed: boolean | null;
}

export interface BusinessDataStatus {
  dataStatus: "LIVE_DATA_REQUIRED" | "MEASURED";
  source: string | null;
  timestamp: string;
  note: string;
}

const unavailable = <T extends object>(data: T): T & BusinessDataStatus => ({
  ...data,
  dataStatus: "LIVE_DATA_REQUIRED",
  source: null,
  timestamp: new Date().toISOString(),
  note: "No canonical production/provider telemetry was supplied to this synchronous module. No business value is inferred.",
});

export class BusinessOsModules {
  public calculateFinancialPnL(_params?: { gmvInr?: number; orderCount?: number }): FinancialPnLReport {
    return unavailable({
      period: null,
      grossMerchandiseValueInr: 0,
      netRevenueInr: 0,
      aggregatorSavingsInr: 0,
      operatingExpensesInr: 0,
      gstInputTaxCreditInr: 0,
      netFounderProfitInr: 0,
      cashRunwayMonths: null,
      retainedCapitalVaultInr: 0,
    });
  }

  public discoverLawfulOpportunities(_region?: string): LawfulSalesLead[] {
    return [];
  }

  public generateGrowthCampaign(lead?: LawfulSalesLead | null) {
    if (!lead) {
      return {
        dataStatus: "LIVE_DATA_REQUIRED" as const,
        campaignTitle: "Localized OrderKing merchant-growth proposal",
        targetAudience: null,
        projectedMerchantAnnualSavings: null,
        pitchScript: "A verified merchant record, current commission contract, and contact channel are required before an outreach pitch is generated.",
        channels: ["STORE_QR", "CONSENTED_SOCIAL_SHARE", "APPROVED_AD_CHANNEL"],
        roiEstimateRatio: null,
      };
    }

    return {
      dataStatus: "LIVE_DATA_REQUIRED" as const,
      campaignTitle: `Merchant growth proposal for ${lead.businessName}`,
      targetAudience: lead.locality || null,
      projectedMerchantAnnualSavings: lead.annualAggregatorLossInr == null ? null : `₹${lead.annualAggregatorLossInr.toLocaleString("en-IN")}`,
      pitchScript:
        lead.annualAggregatorLossInr == null
          ? `A verified current contract and settlement history are required before savings are estimated for ${lead.businessName}.`
          : `Use only the verified current commission and settlement records for ${lead.businessName}; no savings figure is claimed here without that evidence.`,
      channels: ["STORE_QR", "CONSENTED_SOCIAL_SHARE", "APPROVED_AD_CHANNEL"],
      roiEstimateRatio: null,
    };
  }

  public getMinimalStaffRoster() {
    return unavailable({
      totalHumanStaff: 0,
      roles: [],
      automatedSubsystemsCount: 0,
      monthlyPayrollSavingsInr: 0,
    });
  }

  public auditKitchenSlas(): KitchenSlaReport[] {
    return [];
  }

  public inspectInventoryAlerts(): InventoryItemAlert[] {
    return [];
  }

  public inspectSreHealth(): SreHealthStatus[] {
    return [];
  }

  public forecastDemand(_region = "unknown") {
    return unavailable({
      predictedOrderVolume: 0,
      peakHours: [] as string[],
      requiredFleetSize: 0,
    });
  }

  public calculateDynamicPricing(baseDeliveryFeeInr: number, currentDemandMultiplier: number, weatherCondition: "CLEAR" | "RAIN" | "STORM"): number {
    let surgeMultiplier = currentDemandMultiplier;
    if (weatherCondition === "RAIN") surgeMultiplier += 0.5;
    if (weatherCondition === "STORM") surgeMultiplier += 1.2;
    return Math.round(baseDeliveryFeeInr * surgeMultiplier);
  }

  public analyzeFleetDispatch() {
    return unavailable({
      activeRiders: 0,
      averageDeliveryTimeMins: null,
      idleRidersCount: 0,
      bottleneckZones: [] as string[],
    });
  }
}

export const businessOsModules = new BusinessOsModules();
