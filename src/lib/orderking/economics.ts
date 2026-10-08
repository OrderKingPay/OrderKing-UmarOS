/**
 * Dynamic surge pricing algorithm
 */
export function calculateSurgeMultiplier(active_riders: number, pending_orders: number): number {
  if (active_riders === 0 && pending_orders > 0) return 3.0;
  if (active_riders === 0) return 1.0;
  
  const ratio = pending_orders / active_riders;
  let multiplier = 1.0;
  
  if (ratio > 5) {
    multiplier = 2.5;
  } else if (ratio > 2) {
    multiplier = 1.5;
  } else if (ratio > 1) {
    multiplier = 1.2;
  }
  
  return multiplier;
}
