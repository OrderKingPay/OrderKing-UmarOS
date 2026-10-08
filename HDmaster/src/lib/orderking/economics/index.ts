export interface TransactionEconomics {
  grossValue: number;
  customerSaved: number;
  founderEarned: number;
  partnerEarned: number;
  riderEarned: number;
  platformCost: number;
}

export class MutualValueEconomicEngine {
  optimizeTransaction(
    basePrice: number,
    commissionRate: number,
    deliveryFee: number,
    platformSubsidy: number
  ): TransactionEconomics {
    // Legitimate transparent math. No dark patterns.
    const partnerEarned = basePrice * (1 - commissionRate);
    const founderCommission = basePrice * commissionRate;
    const riderEarned = deliveryFee; // 100% of delivery fee to rider in this model
    const customerSaved = platformSubsidy; // Subsidy applied as discount
    
    const grossValue = basePrice + deliveryFee - platformSubsidy;
    const platformCost = platformSubsidy; // Platform pays the subsidy
    
    const founderEarned = founderCommission - platformCost; // Net contribution
    
    return {
      grossValue,
      customerSaved,
      founderEarned,
      partnerEarned,
      riderEarned,
      platformCost,
    };
  }

  detectRevenueOpportunity(metrics: TransactionEconomics[]): { opportunity: string, impact: number }[] {
    const opportunities = [];
    const avgFounderMargin = metrics.reduce((sum, m) => sum + m.founderEarned, 0) / (metrics.length || 1);
    const totalSubsidy = metrics.reduce((sum, m) => sum + m.platformCost, 0);

    if (totalSubsidy > avgFounderMargin * 10) {
      opportunities.push({ opportunity: 'Reduce inefficient platform subsidies to restore contribution margin', impact: totalSubsidy * 0.2 });
    }
    return opportunities;
  }
}
