import { getSql } from '@/lib/db'; 

export class RestaurantAdsEngine {
  /**
   * Allows a restaurant to mathematically bid for the #1 spot on the customer feed.
   */
  async processRestaurantBid(restaurantId: string, bidAmount: number): Promise<boolean> {
    const sql = await getSql();
    
    await sql`
      INSERT INTO restaurant_bids (restaurant_id, bid_amount, updated_at)
      VALUES (${restaurantId}, ${bidAmount}, NOW())
      ON CONFLICT (restaurant_id) DO UPDATE 
      SET bid_amount = EXCLUDED.bid_amount, updated_at = NOW()
    `;
    
    return true;
  }

  /**
   * Deducts money directly from the restaurant's wallet when a user clicks 
   * their promoted listing, generating pure platform revenue.
   */
  async chargeAdClick(restaurantId: string, userId: string): Promise<number> {
    const sql = await getSql();
    
    const [bid] = await sql<any>`
      SELECT bid_amount FROM restaurant_bids 
      WHERE restaurant_id = ${restaurantId}
    `;

    if (!bid) {
      throw new Error("No active bid found for this restaurant.");
    }

    const clickCost = Number(bid.bid_amount);

    await sql.transaction(async (tx: any) => {
      // Deduct cost from restaurant's wallet
      const result = await tx`
        UPDATE restaurant_wallets
        SET balance = balance - ${clickCost}
        WHERE restaurant_id = ${restaurantId} AND balance >= ${clickCost}
      `;

      // Log the click event
      await tx`
        INSERT INTO ad_clicks (restaurant_id, user_id, cost, created_at)
        VALUES (${restaurantId}, ${userId}, ${clickCost}, NOW())
      `;

      // Log platform revenue
      await tx`
        INSERT INTO platform_revenue (amount, source_type, reference_id, created_at)
        VALUES (${clickCost}, 'RESTAURANT_AD_CLICK', ${restaurantId}, NOW())
      `;
    });

    return clickCost;
  }
}
