// Legacy compatibility facade for the partner AI.
// Production restaurant AI is served by askAssistant() in server/api-more.ts,
// which reads verified restaurant data and calls the configured OpenAI service.
//
// This file intentionally contains no seeded menu, fake settlement figures,
// fake anomalies, or synthetic operational metrics.

export interface SparkMenuItem {
  id: string;
  name: string;
  category: string;
  pricePaise: number;
  isAvailable: boolean;
  preparationMinutes: number;
  totalOrdersToday: number;
}

export interface SparkKitchenAnomaly {
  anomalyId: string;
  type: "PREP_DELAY" | "REJECTION_SPIKE" | "SALES_DECLINE" | "COMPLAINT_SPIKE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  headline: string;
  rootCauseHypothesis: string;
  recommendedAction: string;
  authorizedActionLabel: string;
  detectedAt: string;
}

export interface SparkSettlementSummary {
  period: string;
  grossSalesPaise: number;
  commissionPaidPaise: number;
  swiggyZomatoLossAvoidedPaise: number;
  netSettlementPaise: number;
  status: "SETTLED" | "PENDING_BANK" | "PROCESSING";
  settlementAccount: string;
}

export interface SparkChatMessage {
  id: string;
  sender: "user" | "spark";
  text: string;
  timestamp: string;
  actionCard?: {
    type: "menu_toggle" | "anomaly_alert" | "settlement_breakdown" | "growth_plan";
    data: Record<string, unknown>;
  };
}

const LIVE_DATA_REQUIRED = "LIVE_RESTAURANT_DATA_REQUIRED";

export class OrderKingSpark {
  public getMenuItems(): SparkMenuItem[] {
    return [];
  }

  public toggleItemAvailability(): never {
    throw new Error(LIVE_DATA_REQUIRED);
  }

  public updateItemPrice(): never {
    throw new Error(LIVE_DATA_REQUIRED);
  }

  public getActiveAnomalies(): SparkKitchenAnomaly[] {
    return [];
  }

  public getSettlementSummary(): never {
    throw new Error(LIVE_DATA_REQUIRED);
  }

  public handleRestaurantQuery(query: string): SparkChatMessage {
    return {
      id: `spark-compat-${Date.now()}`,
      sender: "spark",
      text:
        "The legacy Spark data facade is disabled. Use the live Restaurant AI assistant so answers come from your authorized restaurant data.",
      timestamp: new Date().toISOString(),
      actionCard: {
        type: "growth_plan",
        data: { query, liveDataRequired: true },
      },
    };
  }
}

export const orderKingSpark = new OrderKingSpark();
