export interface RestaurantData {
    id: string;
    rating: number;
    baseDeliveryTimeMinutes: number;
    priceTier: number; // 1-4
    cuisineType: string;
}

export interface UserHistory {
    userId: string;
    frequentCuisines: Record<string, number>; // cuisine -> order count
    averagePriceTier: number;
    toleranceForWaitTime: number; // Max wait time they usually accept
}

export class RecommendationEngine {
    /**
     * Scores a restaurant for a given user based on their history.
     */
    public scoreRestaurant(user: UserHistory, restaurant: RestaurantData): number {
        let score = 0;

        // 1. Rating component (0-5 scale mapped to 0-100 base weighting factor 10)
        score += restaurant.rating * 10;

        // 2. Cuisine Match
        const cuisineMatchFrequency = user.frequentCuisines[restaurant.cuisineType] || 0;
        // Normalize frequency (assuming max ~ 50 orders of same cuisine for baseline)
        score += Math.min(cuisineMatchFrequency * 2, 30); 

        // 3. Price Tier Match (closer is better)
        const priceTierDiff = Math.abs(user.averagePriceTier - restaurant.priceTier);
        score += Math.max(0, 15 - (priceTierDiff * 5));

        // 4. Wait time penalty
        if (restaurant.baseDeliveryTimeMinutes > user.toleranceForWaitTime) {
            score -= (restaurant.baseDeliveryTimeMinutes - user.toleranceForWaitTime) * 1.5;
        } else {
            score += 10; // Reward fast delivery
        }

        // Clamp score between 0 and 100
        return Math.max(0, Math.min(score, 100));
    }

    public rankRestaurants(user: UserHistory, restaurants: RestaurantData[]): RestaurantData[] {
        return [...restaurants].sort((a, b) => {
            return this.scoreRestaurant(user, b) - this.scoreRestaurant(user, a);
        });
    }
}
