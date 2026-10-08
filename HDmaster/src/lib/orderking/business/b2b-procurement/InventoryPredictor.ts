export interface OrderRecord {
  date: Date;
  ingredientId: string;
  quantityUsed: number;
}

export interface InventoryLevel {
  ingredientId: string;
  currentStock: number;
  unit: string;
}

export interface PredictionResult {
  ingredientId: string;
  dailyAverageUsage: number;
  daysUntilDepletion: number;
  estimatedDepletionDate: Date | null;
}

export class InventoryPredictor {
  /**
   * Analyzes the past 30 days of usage to predict when inventory will run out.
   * Uses a Simple Moving Average (SMA) over the 30-day window.
   */
  public predictDepletion(
    pastOrders: OrderRecord[],
    inventoryLevels: InventoryLevel[],
    analysisDate: Date = new Date()
  ): PredictionResult[] {
    // Filter orders to only include the last 30 days
    const thirtyDaysAgo = new Date(analysisDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentOrders = pastOrders.filter(order => order.date >= thirtyDaysAgo && order.date <= analysisDate);

    // Aggregate usage by ingredient
    const usageMap = new Map<string, number>();
    for (const order of recentOrders) {
      const current = usageMap.get(order.ingredientId) || 0;
      usageMap.set(order.ingredientId, current + order.quantityUsed);
    }

    const results: PredictionResult[] = [];

    // Calculate moving average and depletion for each inventory item
    for (const inventory of inventoryLevels) {
      const totalUsage30Days = usageMap.get(inventory.ingredientId) || 0;
      // Simple moving average over 30 days
      const dailyAverageUsage = totalUsage30Days / 30;
      
      let daysUntilDepletion = Infinity;
      let estimatedDepletionDate: Date | null = null;

      if (dailyAverageUsage > 0) {
        daysUntilDepletion = inventory.currentStock / dailyAverageUsage;
        estimatedDepletionDate = new Date(analysisDate.getTime() + daysUntilDepletion * 24 * 60 * 60 * 1000);
      }

      results.push({
        ingredientId: inventory.ingredientId,
        dailyAverageUsage,
        daysUntilDepletion,
        estimatedDepletionDate,
      });
    }

    return results;
  }
}
