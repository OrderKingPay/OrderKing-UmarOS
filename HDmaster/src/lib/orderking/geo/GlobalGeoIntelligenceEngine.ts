export interface ZoneData {
  zoneId: string;
  baseDemand: number;
  weatherInfo: {
    condition: 'clear' | 'rain' | 'storm' | 'snow';
    temperature: number;
  };
  events: {
    isSchoolHoliday: boolean;
    isFestival: boolean;
  };
  demographics: {
    averageIncome: number;
    basePriceSensitivity: number; // 0 to 1
  };
}

export interface DemandPrediction {
  zoneId: string;
  adjustedDemand: number;
  priceMultiplier: number;
  deliveryTimePenalty: number;
  factorsApplied: string[];
}

export class GlobalGeoIntelligenceEngine {
  /**
   * Processes zone data to predict localized demand, price multipliers, and delivery impacts.
   */
  public analyzeZone(data: ZoneData): DemandPrediction {
    let demand = data.baseDemand;
    let priceMultiplier = 1.0;
    let deliveryPenalty = 0;
    const factorsApplied: string[] = [];

    // Weather Penalities
    if (data.weatherInfo.condition === 'rain') {
      demand *= 1.2;
      deliveryPenalty += 10;
      factorsApplied.push('weather_rain_demand_spike');
    } else if (data.weatherInfo.condition === 'storm') {
      demand *= 1.5;
      priceMultiplier *= 1.2;
      deliveryPenalty += 25;
      factorsApplied.push('weather_storm_danger_surge');
    } else if (data.weatherInfo.condition === 'snow') {
      demand *= 1.4;
      deliveryPenalty += 20;
      factorsApplied.push('weather_snow_delay');
    }

    // School Holiday Demand Spikes
    if (data.events.isSchoolHoliday) {
      demand *= 1.3;
      factorsApplied.push('school_holiday_spike');
    }

    // Festival Purchasing Power Adjustments
    if (data.events.isFestival) {
      demand *= 1.5;
      priceMultiplier *= 1.15;
      factorsApplied.push('festival_purchasing_power_surge');
    }

    // Local Price Sensitivity
    if (data.demographics.basePriceSensitivity > 0.7) {
      // Highly price sensitive, reduce multiplier if surging
      if (priceMultiplier > 1.0) {
        priceMultiplier = Math.max(1.0, priceMultiplier - 0.1);
        factorsApplied.push('price_sensitivity_cap_applied');
      }
    } else if (data.demographics.basePriceSensitivity < 0.3) {
      // Low price sensitivity, can afford higher surge
      if (demand > data.baseDemand * 1.2) {
        priceMultiplier *= 1.1;
        factorsApplied.push('low_price_sensitivity_premium');
      }
    }

    return {
      zoneId: data.zoneId,
      adjustedDemand: Number(demand.toFixed(2)),
      priceMultiplier: Number(priceMultiplier.toFixed(2)),
      deliveryTimePenalty: deliveryPenalty,
      factorsApplied,
    };
  }
}
