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
    this.seedDefaultMenu();
    this.detectAnomalies();
  }

  private seedDefaultMenu() {
    const defaults: SparkMenuItem[] = [
      {
        id: "item-biryani-01",
        name: "Special Mutton Dum Biryani",
        category: "Biryani & Rice",
        pricePaise: 38000,
        isAvailable: true,
        preparationMinutes: 18,
        totalOrdersToday: 48,
      },
      {
        id: "item-chicken-02",
        name: "Murgh Tikka Butter Masala",
        category: "Curries",
        pricePaise: 29000,
        isAvailable: true,
        preparationMinutes: 14,
        totalOrdersToday: 32,
      },
      {
        id: "item-roti-03",
        name: "Garlic Butter Naan",
        category: "Breads",
        pricePaise: 6000,
        isAvailable: true,
        preparationMinutes: 6,
        totalOrdersToday: 74,
      },
      {
        id: "item-dessert-04",
        name: "Shahi Firni (Clay Pot)",
        category: "Desserts",
        pricePaise: 12000,
        isAvailable: false, // Currently sold out
        preparationMinutes: 2,
        totalOrdersToday: 18,
      },
    ];

    for (const item of defaults) {
      this.menuItems.set(item.id, item);
    }
  }

  private detectAnomalies() {
    this.activeAnomalies = [
      {
        anomalyId: "anom-prep-01",
        type: "PREP_DELAY",
        severity: "MEDIUM",
        headline: "Preparation Time Exceeded SLA on 3 Biryani Orders",
        rootCauseHypothesis: "Kitchen bottleneck around 8:30 PM peak with rice pot refills.",
        recommendedAction: "Pre-portion 12 biryani handis 15 minutes before peak evening rush.",
        authorizedActionLabel: "Acknowledge & Adjust Prep Buffer (+3 mins)",
        detectedAt: "Today, 8:42 PM",
      },
      {
        anomalyId: "anom-sav-02",
        type: "SALES_DECLINE",
        severity: "LOW",
        headline: "0% Commission Retained Savings: ₹14,280 Saved Today",
        rootCauseHypothesis: "Customer direct ordering retained 24% that Swiggy/Zomato would have deducted.",
        recommendedAction: "Offer free garlic naan on orders over ₹500 to drive repeat orders.",
        authorizedActionLabel: "Launch Repeat Customer Offer",
        detectedAt: "Today, 9:00 PM",
      },
    ];
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
    const grossSalesPaise = 18500000; // ₹1,85,000 trailing 7 days
    const swiggyZomatoLossAvoidedPaise = Math.round(grossSalesPaise * 0.24); // ₹44,400 saved!

    return {
      period: "Trailing 7 Days",
      grossSalesPaise,
      commissionPaidPaise: 0, // OrderKing 0% Commission
      swiggyZomatoLossAvoidedPaise,
      netSettlementPaise: grossSalesPaise,
      status: "SETTLED",
      settlementAccount: "HDFC Bank (**** 4821)",
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
You have **${items.length} core items** on your live menu. **${items.filter((i) => i.isAvailable).length} available** for ordering.
You can toggle availability or adjust prices below instantly with zero downtime.`,
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
Detected **${anomalies.length} operational signals** today. Average kitchen prep time is **14.2 minutes** (within standard 18-minute threshold).`,
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
          topSellingCategory: "Biryani & Rice",
          avgRating: 4.8,
          customerRetentionPct: 68,
        },
      },
    };
  }
}

export const orderKingSpark = new OrderKingSpark();
