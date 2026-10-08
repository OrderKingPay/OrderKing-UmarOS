export interface GeoContext {
  country: string;
  state: string;
  city: string;
  locality: string;
  isRural: boolean;
  weather: 'CLEAR' | 'RAIN' | 'EXTREME';
}

export class GeographicIntelligenceEngine {
  analyzeLocalDemand(context: GeoContext, historicalOrders: number): {
    recommendedDeliveryFeeMultiplier: number;
    recommendedPromotions: string[];
    isServiceable: boolean;
  } {
    let multiplier = 1.0;
    const promos = [];
    let serviceable = true;

    if (context.weather === 'EXTREME') {
      serviceable = false; // Safety first for riders
    } else if (context.weather === 'RAIN') {
      multiplier = 1.5; // Surge pricing for harsh conditions
      promos.push('RAINY_DAY_CRAVINGS');
    }

    if (context.isRural) {
      multiplier = Math.max(multiplier, 1.2); // Distance coverage
    }

    return {
      recommendedDeliveryFeeMultiplier: multiplier,
      recommendedPromotions: promos,
      isServiceable: serviceable
    };
  }
}
