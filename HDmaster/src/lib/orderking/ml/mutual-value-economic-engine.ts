import { SurgeCalculator } from './surge-calculator';
import { DiscountOptimizer } from './discount-optimizer';

export class MutualValueEconomicEngine {
    private surgeCalculator = new SurgeCalculator();
    private discountOptimizer = new DiscountOptimizer();

    public calculateFinalPrice(
        basePrice: number,
        riderDensity: number,
        orderVolume: number,
        weatherFlags: string[]
    ): number {
        const surgeMultiplier = this.surgeCalculator.calculate(riderDensity, orderVolume, weatherFlags);
        const discountMultiplier = this.discountOptimizer.calculate(basePrice, orderVolume);
        
        return basePrice * surgeMultiplier * discountMultiplier;
    }
}
