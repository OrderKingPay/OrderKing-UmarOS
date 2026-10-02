
/**
 * HDmaster Founder AI — Business Intelligence Engine (§15)
 *
 * Continuously analyzes actual historical performance:
 * - Which work produces the most revenue?
 * - Which work has the highest margin?
 * - Which clients repeat?
 * - Which opportunities consume too much time?
 * - Which services are easiest to deliver?
 * - Which services have recurring potential?
 * - Which acquisition channels work?
 * - Which proposals convert?
 * - Which projects cause failures?
 *
 * Strict Rule: Never fabricate conclusions where insufficient data exists.
 * Ground all analysis in historical records.
 */

export interface ServicePerformanceMetric {
  serviceId: string;
  name: string;
  category: string;
  completedCount: number;
  totalRevenueInr: number;
  averageMarginPct: number;
  averageDeliveryDays: number;
  failureRatePct: number;
  recurringPotential: "LOW" | "MEDIUM" | "HIGH";
}

export interface AcquisitionChannelMetric {
  channel: "INBOUND" | "COLD_OUTREACH" | "FREELANCE_PORTALS" | "REFERRAL" | "DIRECT_PARTNER";
  leadsCount: number;
  proposalsSent: number;
  wonDeals: number;
  conversionRatePct: number;
  totalRevenueInr: number;
  cacInr: number; // Customer Acquisition Cost
}

export interface DeliveryBottleneckMetric {
  stage: string;
  averageDurationHours: number;
  standardDurationHours: number;
  delayFrequencyPct: number;
  commonRootCause: string;
}

export interface BusinessIntelligenceReport {
  timestamp: string;
  topRevenueServices: ServicePerformanceMetric[];
  highestMarginServices: ServicePerformanceMetric[];
  channelConversionRates: AcquisitionChannelMetric[];
  deliveryBottlenecks: DeliveryBottleneckMetric[];
  clientRetentionRatePct: number;
  totalRepeatRevenueInr: number;
  insights: string[];
}

export const HISTORICAL_SERVICE_METRICS: ServicePerformanceMetric[] = [];

export const HISTORICAL_CHANNEL_METRICS: AcquisitionChannelMetric[] = [];

export const HISTORICAL_BOTTLENECKS: DeliveryBottleneckMetric[] = [];

function dataBackedInsights(topRevenue: ServicePerformanceMetric[], highestMargin: ServicePerformanceMetric[]): string[] {
  if (!topRevenue.length && !highestMargin.length) {
    return ["No verified business dataset is connected. Connect the production analytics ledger before AI makes revenue, margin or acquisition recommendations."];
  }
  const insights: string[] = [];
  if (topRevenue[0]) insights.push(`Highest verified revenue service: ${topRevenue[0].name}.`);
  if (highestMargin[0]) insights.push(`Highest verified margin service: ${highestMargin[0].name}.`);
  return insights;
}

export function generateBusinessIntelligenceReport(): BusinessIntelligenceReport {
  const topRevenue = [...HISTORICAL_SERVICE_METRICS].sort((a, b) => b.totalRevenueInr - a.totalRevenueInr);
  const highestMargin = [...HISTORICAL_SERVICE_METRICS].sort((a, b) => b.averageMarginPct - a.averageMarginPct);

  const insights: string[] = dataBackedInsights(topRevenue, highestMargin);

  return {
    timestamp: new Date().toISOString(),
    topRevenueServices: topRevenue,
    highestMarginServices: highestMargin,
    channelConversionRates: HISTORICAL_CHANNEL_METRICS,
    deliveryBottlenecks: HISTORICAL_BOTTLENECKS,
    clientRetentionRatePct: 0,
    totalRepeatRevenueInr: 0,
    insights,
  };
}
