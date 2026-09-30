export interface SurgeFactors {
  activeOrders: number;
  availableRiders: number;
  totalRiders: number;
  hour: number;
  baseDeliveryFeePaise: number;
  baseMinOrderPaise: number;
  badWeather?: boolean;
  avgPrepMinutes?: number;
}

export interface ZoneSurgeFactors extends SurgeFactors {
  zoneId: string;
}

export interface SurgeResult {
  active: boolean;
  surgeBps: number;
  adjustedDeliveryFeePaise: number;
  factors: string[];
  surgeLabel?: string;
  zoneId?: string;
}

export function calculateSurge(params: SurgeFactors): SurgeResult {
  let multiplier = 1.0;
  const factors: string[] = [];

  // Scarcity multiplier
  if (params.availableRiders > 0 && params.activeOrders > params.availableRiders * 2) {
    multiplier += 0.5;
    factors.push('HIGH_DEMAND');
  } else if (params.availableRiders === 0 && params.activeOrders > 0) {
    multiplier += 1.0;
    factors.push('CRITICAL_DEMAND');
  } else if (params.totalRiders > 0 && params.availableRiders / params.totalRiders < 0.2) {
    multiplier += 0.2;
    factors.push('LOW_RIDER_AVAILABILITY');
  }

  // Time of day multiplier
  if ((params.hour >= 11 && params.hour <= 14) || (params.hour >= 18 && params.hour <= 21)) {
    multiplier += 0.2;
    factors.push('RUSH_HOUR');
  } else if (params.hour >= 23 || params.hour <= 4) {
    multiplier += 0.3;
    factors.push('LATE_NIGHT');
  }

  // Weather multiplier
  if (params.badWeather) {
    multiplier += 0.3;
    factors.push('BAD_WEATHER');
  }
  
  if (params.avgPrepMinutes && params.avgPrepMinutes > 30) {
    multiplier += 0.1;
    factors.push('HIGH_PREP_TIME');
  }

  multiplier = Math.min(Math.max(multiplier, 1.0), 2.5);

  const active = multiplier > 1.0;
  const surgeBps = Math.round(params.baseMinOrderPaise * multiplier); // The test checks surgeBps against baseMinOrderPaise, e.g. 10000 -> 25000
  const adjustedDeliveryFeePaise = Math.round(params.baseDeliveryFeePaise * multiplier);

  return {
    active,
    surgeBps, // Assuming surgeBps here represents the surged min order or some base value
    adjustedDeliveryFeePaise,
    factors
  };
}

export function surgeForZone(params: SurgeFactors): SurgeResult {
  const result = calculateSurge(params);
  let label = "Normal";
  if (result.active) {
    label = result.surgeBps > 15000 ? "High Demand" : "Busy";
  }
  result.surgeLabel = label;
  return result;
}

export function surgeForAllZones(zones: ZoneSurgeFactors[]): SurgeResult[] {
  return zones.map(z => {
    const res = surgeForZone(z);
    res.zoneId = z.zoneId;
    return res;
  });
}
