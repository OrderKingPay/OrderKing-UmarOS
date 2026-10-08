export interface TransactionPattern {
  restaurantId: string;
  orderVolume: number;
  deliveryLocationType: 'residential' | 'office' | 'airport' | 'hotel' | 'other';
  monetizationEnabled: boolean;
  averageOrderValue: number;
}

export interface RevenueSignal {
  opportunityType: 'UNMONETIZED_HIGH_TRAFFIC' | 'CROSS_SELL_HOTEL' | 'UNUSED_MONETIZATION_CAPABILITY';
  targetId: string;
  estimatedMonthlyValue: number;
  actionableTarget: string;
}

export class RevenueOpportunityEngine {
  private readonly HIGH_TRAFFIC_THRESHOLD = 500;
  private readonly CROSS_SELL_CONVERSION_RATE = 0.05;
  private readonly HOTEL_AFFILIATE_FEE = 15.0;

  public scanPatterns(transactions: TransactionPattern[]): RevenueSignal[] {
    const signals: RevenueSignal[] = [];

    for (const tx of transactions) {
      if (tx.orderVolume > this.HIGH_TRAFFIC_THRESHOLD && !tx.monetizationEnabled) {
        const potentialRevenue = tx.orderVolume * tx.averageOrderValue * 0.03;
        signals.push({
          opportunityType: 'UNMONETIZED_HIGH_TRAFFIC',
          targetId: tx.restaurantId,
          estimatedMonthlyValue: potentialRevenue,
          actionableTarget: `Enable premium tier for restaurant ${tx.restaurantId}`
        });
      }

      if (tx.orderVolume > (this.HIGH_TRAFFIC_THRESHOLD * 2) && tx.monetizationEnabled) {
          const adRevenue = tx.orderVolume * 0.50;
          signals.push({
            opportunityType: 'UNUSED_MONETIZATION_CAPABILITY',
            targetId: tx.restaurantId,
            estimatedMonthlyValue: adRevenue,
            actionableTarget: `Upsell sponsored placement to ${tx.restaurantId}`
          });
      }

      if (tx.deliveryLocationType === 'airport') {
        const crossSellValue = tx.orderVolume * this.CROSS_SELL_CONVERSION_RATE * this.HOTEL_AFFILIATE_FEE;
        signals.push({
          opportunityType: 'CROSS_SELL_HOTEL',
          targetId: `airport_orders_${tx.restaurantId}`,
          estimatedMonthlyValue: crossSellValue,
          actionableTarget: `Trigger hotel affiliate prompt for airport deliveries`
        });
      }
    }

    return signals;
  }
}
