/**
 * OMNIPOTENT HDMASTER FINANCIAL & PAYOUT ENGINE (UPGRADED)
 * 
 * 100% Fully Customizable. Zomato-Killer Architecture.
 * Implements Tiered Restaurant Margins (25%-30%), Dynamic Surge Pricing, 
 * and automated Customer Loyalty Coin generation funded by restaurant margins.
 */

interface RiderMetrics {
  riderId: string;
  deliveriesCompleted: number;
  customerRating: number; 
  baseEarnings: number;
}

interface PartnerMetrics {
  partnerId: string;
  totalRevenue: number;
  distanceToCustomerKm: number; // Used for tiered margin extraction
}

export interface FinancialConfig {
  basePlatformFeePercent: number; // Default 25% (0.25)
  distantRestaurantFeePercent: number; // Default 30% (0.30) for >5km
  distanceThresholdKm: number; // Default 5km
  weeklyBonusTarget: number; // Default 50 deliveries
  bonusAmountBase: number; // Default ₹500
}

export class FinancialEngine {
  private static readonly SURGE_MULTIPLIER_CAP = 3.5;

  // Real-time custom config injected by the Founder via UmarOS
  public static currentConfig: FinancialConfig = {
    basePlatformFeePercent: 0.25, // 25% default
    distantRestaurantFeePercent: 0.30, // 30% for far restaurants
    distanceThresholdKm: 5.0,
    weeklyBonusTarget: 50,
    bonusAmountBase: 500
  };

  /**
   * Updates the global financial parameters instantly across India.
   */
  static setCustomConfig(newConfig: Partial<FinancialConfig>) {
    this.currentConfig = { ...this.currentConfig, ...newConfig };
  }

  /**
   * Calculates real-time surge pricing dynamically based on local rider density.
   */
  static calculateDynamicSurge(activeRidersInZone: number, ordersPerMinute: number): number {
    const baselineRatio = activeRidersInZone > 0 ? (ordersPerMinute / activeRidersInZone) : 2.0;
    let surge = 1.0 + Math.log10(Math.max(1, baselineRatio)) * 0.8;
    return Math.min(Math.max(surge, 1.0), this.SURGE_MULTIPLIER_CAP);
  }

  /**
   * Calculates dynamic restaurant margin extraction. 
   * Charges higher fees to distant restaurants to maximize founder profit.
   */
  static calculatePlatformFee(distanceKm: number): number {
    return distanceKm > this.currentConfig.distanceThresholdKm 
      ? this.currentConfig.distantRestaurantFeePercent 
      : this.currentConfig.basePlatformFeePercent;
  }

  /**
   * Generates the Rider payout using Founder-defined targets.
   */
  static generateRiderWeeklyPayout(metrics: RiderMetrics) {
    const isEligibleForBonus = metrics.deliveriesCompleted >= this.currentConfig.weeklyBonusTarget;
    const bonusAmount = isEligibleForBonus 
      ? this.currentConfig.bonusAmountBase + ((metrics.deliveriesCompleted - this.currentConfig.weeklyBonusTarget) * 10) 
      : 0;

    const payoutAmount = metrics.baseEarnings + bonusAmount;
    return { 
      payoutAmount: Math.floor(payoutAmount * 100) / 100, 
      bonusAmount, 
      isEligibleForBonus 
    };
  }

  /**
   * Computes the Restaurant settlement, extracting 25-30% margin.
   * A portion of this extracted margin is mathematically routed to 'Customer Coins' for massive marketing.
   */
  static generatePartnerSettlement(metrics: PartnerMetrics) {
    const activeFeePercent = this.calculatePlatformFee(metrics.distanceToCustomerKm);
    const platformFeeDeducted = metrics.totalRevenue * activeFeePercent;
    
    // Allocate 5% of the total revenue to Customer Marketing/Loyalty Coins, strictly funded by the restaurant's cut.
    const customerLoyaltyCoinsFunded = metrics.totalRevenue * 0.05; 

    return { 
      grossRevenue: Math.floor(metrics.totalRevenue * 100) / 100, 
      platformFeeDeducted: Math.floor(platformFeeDeducted * 100) / 100, 
      netPayout: Math.floor((metrics.totalRevenue - platformFeeDeducted) * 100) / 100,
      customerLoyaltyCoinsFunded: Math.floor(customerLoyaltyCoinsFunded * 100) / 100,
      appliedFeePercentage: activeFeePercent * 100
    };
  }
}
