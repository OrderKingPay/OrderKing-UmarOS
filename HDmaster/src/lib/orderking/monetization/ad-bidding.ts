import { getSql } from '../../db';

/**
 * Places a bid for a specific keyword.
 * @param restaurantId The ID of the restaurant placing the bid
 * @param keyword The keyword to bid on
 * @param maxCpcPaise The maximum Cost-Per-Click in paise
 */
export async function placeBid(restaurantId: string, keyword: string, maxCpcPaise: number) {
  const query = `
    INSERT INTO ad_bids (restaurant_id, keyword, max_cpc_paise, created_at, updated_at, is_active)
    VALUES ($1, $2, $3, NOW(), NOW(), true)
    ON CONFLICT (restaurant_id, keyword) 
    DO UPDATE SET 
      max_cpc_paise = EXCLUDED.max_cpc_paise,
      updated_at = NOW(),
      is_active = true;
  `;
  
  await (await getSql()).query(query, [restaurantId, keyword, maxCpcPaise]);
  
  return { success: true, restaurantId, keyword, maxCpcPaise };
}
