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
  private menuItems: Map<string, SparkMenuItem> = new Map();
  private activeAnomalies: SparkKitchenAnomaly[] = [];

  constructor() {
    // Production truth rule: this assistant never seeds restaurant data.
    // Live menu, orders, settlements and anomalies must come from authorized server data.
  }

  public getMenuItems(): SparkMenuItem[] {
    return Array.from(this.menuItems.values());
  }

  public toggleItemAvailability(itemId: string): { success: boolean; item?: SparkMenuItem } {
    const item = this.menuItems.get(itemId);
    if (!item) return { success: false };
    item.isAvailable = !item.isAvailable;
    return { success: true, item };
  }

  public updateItemPrice(itemId: string, newPricePaise: number): { success: boolean; item?: SparkMenuItem } {
    const item = this.menuItems.get(itemId);
    if (!item || newPricePaise <= 0) return { success: false };
    item.pricePaise = newPricePaise;
    return { success: true, item };
  }

  public getActiveAnomalies(): SparkKitchenAnomaly[] {
    return [...this.activeAnomalies];
  }

  public getSettlementSummary(): SparkSettlementSummary {
    return {
      period: "Live ledger required",
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
I am your restaurant growth partner. I can:
1. **Manage Menu & Prices**: Toggle out-of-stock items or adjust menu rates instantly.
2. **Audit 0% Commission Savings**: See exactly how much money you keep vs Swiggy/Zomato.
3. **Monitor Kitchen Velocity**: Track prep time bottlenecks and prevent customer cancellations.

*Ask me anything about your kitchen, orders, or settlement!*`,
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
