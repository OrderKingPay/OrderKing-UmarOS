export class SurgeCalculator {
    /**
     * Calculates surge multiplier based on supply (rider density), demand (order volume), and external factors (weather).
     * @param riderDensity Number of available riders per km^2
     * @param orderVolume Number of pending orders in the area
     * @param weatherFlags E.g., ['RAIN', 'HEAVY_TRAFFIC']
     * @returns Multiplier (e.g., 1.0 means no surge, 1.5 means 50% surge)
     */
    public calculate(riderDensity: number, orderVolume: number, weatherFlags: string[]): number {
        let surge = 1.0;

        // Base Supply/Demand Curve
        // Demand > Supply = Surge
        if (orderVolume > 0 && riderDensity > 0) {
            const ratio = orderVolume / riderDensity;
            // Sigmoid-like surge scaling: asymptote at +0.5 based on demand/supply ratio
            surge += 0.5 * (1 - Math.exp(-0.2 * ratio));
        } else if (riderDensity === 0 && orderVolume > 0) {
            // Extreme shortage
            surge += 1.0; 
        }

        // Weather penalties
        if (weatherFlags.includes('RAIN')) {
            surge += 0.2;
        }
        if (weatherFlags.includes('STORM')) {
            surge += 0.5;
        }
        if (weatherFlags.includes('SNOW')) {
            surge += 0.4;
        }
        if (weatherFlags.includes('HEAVY_TRAFFIC')) {
            surge += 0.15;
        }

        // Cap surge at 3.0
        return Math.min(surge, 3.0);
    }
}
