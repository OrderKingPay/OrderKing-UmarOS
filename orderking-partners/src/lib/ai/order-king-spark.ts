// Order King Spark: Autonomous Restaurant Partner AI Assistant
// Provides operations, finance, menu management, proactive anomaly alerts,
// and growth advisory for restaurant owners and kitchen managers.

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
  commissionPaidPaise: number; // 0 paise with OrderKing!
  swiggyZomatoLossAvoidedPaise: number; // ~24% of gross sales
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

export class OrderKingSpark {
  private menuItems: SparkMenuItem[] = [];
  private activeAnomalies: SparkKitchenAnomaly[] = [];

  public loadAuthorizedData(data: { menuItems?: SparkMenuItem[]; activeAnomalies?: SparkKitchenAnomaly[] }): void {
    this.menuItems = Array.isArray(data.menuItems) ? [...data.menuItems] : [];
    this.activeAnomalies = Array.isArray(data.activeAnomalies) ? [...data.activeAnomalies] : [];
  }

  public getMenuItems(): SparkMenuItem[] {
    return [...this.menuItems];
  }

  public toggleItemAvailability(_itemId: string): { success: boolean; item?: SparkMenuItem; reason?: string } {
    return { success: false, reason: "SERVER_MUTATION_REQUIRED" };
  }

  public updateItemPrice(_itemId: string, _newPricePaise: number): { success: boolean; item?: SparkMenuItem; reason?: string } {
    return { success: false, reason: "SERVER_MUTATION_REQUIRED" };
  }

  public getActiveAnomalies(): SparkKitchenAnomaly[] {
    return [...this.activeAnomalies];
  }

  public getSettlementSummary(): SparkSettlementSummary {
    return {
      period: "Authorized settlement data required",
      grossSalesPaise: 0,
      commissionPaidPaise: 0,
      swiggyZomatoLossAvoidedPaise: 0,
      netSettlementPaise: 0,
      status: "PENDING_BANK",
      settlementAccount: "Not exposed in client AI; retrieve from authorized settlement service",
    };
  }

  /**
   * Process natural language query from restaurant owner
   */
  public handleRestaurantQuery(query: string): SparkChatMessage {
    const q = query.toLowerCase().trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const id = `msg-spark-${Date.now()}`;

    if (q.includes("settlement") || q.includes("payout") || q.includes("money") || q.includes("save") || q.includes("saving")) {
      const summary = this.getSettlementSummary();
      return {
        id,
        sender: "spark",
        text: `### 💰 Settlement & Commission Savings Report
- **Trailing 7 Days Gross Sales**: **₹${(summary.grossSalesPaise / 100).toLocaleString("en-IN")}**
- **OrderKing Platform Commission**: **₹0 (0% Commission)**
- **Aggregator Cut Avoided**: You saved **₹${(summary.swiggyZomatoLossAvoidedPaise / 100).toLocaleString("en-IN")}** compared to Swiggy/Zomato (24% standard rate).
- **Settlement Account**: **${summary.settlementAccount}** (Status: 🟢 **${summary.status}**)`,
        timestamp,
        actionCard: {
          type: "settlement_breakdown",
          data: { summary },
        },
      };
    }

    if (q.includes("menu") || q.includes("item") || q.includes("price") || q.includes("available")) {
      const items = this.getMenuItems();
      return {
        id,
        sender: "spark",
        text: `### 📋 Menu & Item Availability
Live menu data must be loaded from the authorized restaurant service. No seeded or simulated menu is shown by this assistant.`,
        timestamp,
        actionCard: {
          type: "menu_toggle",
          data: { items },
        },
      };
    }

    if (q.includes("delay") || q.includes("kitchen") || q.includes("anomaly") || q.includes("problem") || q.includes("sla")) {
      const anomalies = this.getActiveAnomalies();
      return {
        id,
        sender: "spark",
        text: `### 🍳 Kitchen Operations & SLA Monitor
Live operational signals must be calculated from verified restaurant orders and SLA telemetry. No fabricated anomaly count or prep-time metric is shown.`,
        timestamp,
        actionCard: {
          type: "anomaly_alert",
          data: { anomalies },
        },
      };
    }

    // Default general advice & growth
    return {
      id,
      sender: "spark",
      text: `### 🚀 Order King Spark Active
I am connected to the authorized restaurant AI service. I can explain verified restaurant operations, menu, orders, settlement and growth signals. I will not claim that an action happened unless the server confirms it.`,
      timestamp,
      actionCard: {
        type: "growth_plan",
        data: {
          dataStatus: "LIVE_DATA_REQUIRED",
        },
      },
    };
  }
}

export const orderKingSpark = new OrderKingSpark();
