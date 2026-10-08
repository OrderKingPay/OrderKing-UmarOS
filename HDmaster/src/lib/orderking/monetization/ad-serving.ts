// @ts-nocheck
import { getSql } from '../../db';

/**
 * Retrieves sponsored results for a keyword and processes auction math and balance deduction.
 * Uses a simple first-price auction model for demonstration, deducting cost from the ad wallet.
 * @param keyword The searched keyword
 * @returns Array of sponsored restaurant IDs
 */
export async function getSponsoredResults(keyword: string): Promise<string[]> {
  // Query DB for highest CPC bids matching keyword
  const query = `
    SELECT restaurant_id, max_cpc_paise
    FROM ad_bids
    WHERE keyword = $1 AND is_active = true
    ORDER BY max_cpc_paise DESC
    LIMIT 5;
  `;
  
  const { rows } = await (await getSql()).query(query, [keyword]);
  
  if (!rows || rows.length === 0) return [];

  const sponsoredResults: string[] = [];
  
  for (const row of rows) {
    const cost = row.max_cpc_paise;
    
    // Deduct cost from restaurant's ad wallet. Only allow if they have enough balance.
    const deductQuery = `
      UPDATE ad_wallets
      SET balance_paise = balance_paise - $1, updated_at = NOW()
      WHERE restaurant_id = $2 AND balance_paise >= $1
      RETURNING balance_paise;
    `;
    
    const res = await (await getSql()).query(deductQuery, [cost, row.restaurant_id]);
    
    // If the deduction was successful, they win the ad spot
    if (res.rowCount && res.rowCount > 0) {
      sponsoredResults.push(row.restaurant_id);
    }
  }

  return sponsoredResults;
}
