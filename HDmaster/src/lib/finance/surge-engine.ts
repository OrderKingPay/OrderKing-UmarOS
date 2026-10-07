export type WeatherCondition = 'normal' | 'rain' | 'snow' | 'storm';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'late_night';

export interface SurgeInputs {
  activeRiders: number;
  pendingOrders: number;
  weatherCondition: WeatherCondition;
  timeOfDay: TimeOfDay;
}

export function calculateSurgeMultiplier(inputs: SurgeInputs): number {
  let multiplier = 1.0;

  // Demand-Supply Ratio
  if (inputs.activeRiders > 0) {
    const ratio = inputs.pendingOrders / inputs.activeRiders;
    if (ratio > 1) {
      multiplier += (ratio - 1) * 0.1; // +0.1 for every order above 1:1 ratio
    }
  } else if (inputs.pendingOrders > 0) {
      multiplier += 1.0; // Extreme surge if no riders but there are orders
  }

  // Weather impact
  switch (inputs.weatherCondition) {
    case 'rain':
      multiplier += 0.5;
      break;
    case 'snow':
      multiplier += 0.8;
      break;
    case 'storm':
      multiplier += 1.2;
      break;
    default:
      break;
  }

  // Time of day impact
  switch (inputs.timeOfDay) {
    case 'late_night':
      multiplier += 0.2;
      break;
    case 'evening':
      multiplier += 0.1;
      break;
    default:
      break;
  }

  // Clamp between 1.0 and 3.0
  return Math.min(Math.max(multiplier, 1.0), 3.0);
}
