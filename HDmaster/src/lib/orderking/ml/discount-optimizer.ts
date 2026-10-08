export class DiscountOptimizer {
    /**
     * Optimizes discount multiplier based on economics.
     */
    public calculate(basePrice: number, orderVolume: number): number {
        let discount = 1.0;

        // Volume discounting logic - if order volume is low, we stimulate demand with slight discounts
        if (orderVolume < 10) {
            discount -= 0.05; // 5% discount
        } else if (orderVolume < 5) {
            discount -= 0.10; // 10% discount
        }

        // Base price discounting - high value orders might get bulk discount
        if (basePrice > 100) {
            discount -= 0.05; // Extra 5% off large orders
        }

        // Max discount capped at 20%
        return Math.max(discount, 0.80);
    }
}
