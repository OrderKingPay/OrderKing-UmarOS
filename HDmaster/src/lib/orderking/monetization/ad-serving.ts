import { getSql } from '../../db';

export async function getSponsoredResults(keyword: string): Promise<string[]> {
  const sql = await getSql();
  
  const bids = await sql`
    SELECT restaurant_id, max_cpc_paise
    FROM ad_bids
    WHERE keyword = ${keyword} AND is_active = true
    ORDER BY max_cpc_paise DESC
    LIMIT 5;
  `;
  
  if (!bids || bids.length === 0) return [];

  const sponsoredResults: string[] = [];
  
  for (const bid of bids) {
    const cost = bid.max_cpc_paise as number;
    const resId = bid.restaurant_id as string;
    
    const deductRes = await sql`
      UPDATE ad_wallets
      SET balance_paise = balance_paise - ${cost}, updated_at = NOW()
      WHERE restaurant_id = ${resId} AND balance_paise >= ${cost}
      RETURNING balance_paise;
    `;
    
    if (deductRes && deductRes.length > 0) {
      sponsoredResults.push(resId);
    }
  }

  return sponsoredResults;
}
