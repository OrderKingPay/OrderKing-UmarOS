export interface SurgeCalculationParams {
  riderSupplyDensity: number; // Active riders available in the zone
  incomingOrderVelocity: number; // Orders per minute in the zone
  weatherConditionMultiplier?: number;
  timeOfDayMultiplier?: number;
}

export interface SurgeResult {
  multiplier: number;
  adjustedDeliveryBasePaise: number;
  reason: string;
}

export class SurgePricingEngine {
  private readonly DEFAULT_BASE_DELIVERY_PAISE = 4000; // ₹40.00

  /**
   * Calculates the real-time surge multiplier based on supply/demand mathematical models.
   * Ensures high rider earnings during peak demand while preventing runaway multipliers.
   */
  public calculateSurge(
    params: SurgeCalculationParams,
    basePaise: number = this.DEFAULT_BASE_DELIVERY_PAISE
  ): SurgeResult {
    const {
      riderSupplyDensity,
      incomingOrderVelocity,
      weatherConditionMultiplier = 1.0,
      timeOfDayMultiplier = 1.0,
    } = params;

    // Prevent division by zero; treat zero supply as a critically low supply value
    const safeSupply = Math.max(riderSupplyDensity, 0.1);

    // Supply-Demand Ratio: Ratio > 1 implies demand exceeds supply
    const demandSupplyRatio = incomingOrderVelocity / safeSupply;

    // Logarithmic curve to smoothen out the surge multiplier progression
    let baseSurge = 0;
    if (demandSupplyRatio > 1) {
      baseSurge = Math.log(demandSupplyRatio) * 0.5;
    }

    // Calculate preliminary multiplier
    let multiplier = 1.0 + baseSurge;

    // Apply external factors
    multiplier = multiplier * weatherConditionMultiplier * timeOfDayMultiplier;

    // Clamp the multiplier to reasonable bounds: 1.0x (min) to 5.0x (max)
    multiplier = Math.max(1.0, Math.min(multiplier, 5.0));
    
    // Round to 2 decimal places for precision
    multiplier = parseFloat(multiplier.toFixed(2));

    const adjustedDeliveryBasePaise = Math.round(basePaise * multiplier);

    let reason = "Standard Pricing";
    if (multiplier >= 2.0) {
      reason = `Critical Surge Active: High Demand (${multiplier}x)`;
    } else if (multiplier > 1.0) {
      reason = `Surge Active (${multiplier}x)`;
    }

    return {
      multiplier,
      adjustedDeliveryBasePaise,
      reason,
    };
  }
}

export const surgePricingEngine = new SurgePricingEngine();
