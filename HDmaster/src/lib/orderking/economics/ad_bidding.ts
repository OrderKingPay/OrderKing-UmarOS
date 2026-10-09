import { Kysely, sql } from 'kysely';

export interface DB {
  ad_bids: any;
  ad_campaigns: any;
  ad_auction_logs: any;
}

/**
 * Resolves a real-time Restaurant Ad placement using a Second-Price (Vickrey) Auction.
 * Returns the winning campaign ID and handles real-time budget deduction.
 */
export async function resolveAdAuction(db: Kysely<DB>, slotId: string, zoneId: string) {
    return await db.transaction().execute(async (trx) => {
        // 1. Fetch top 2 bids for this slot and zone
        const bids = await trx
            .selectFrom('ad_bids')
            .selectAll()
            .where('slot_id', '=', slotId)
            .where('zone_id', '=', zoneId)
            .where('status', '=', 'ACTIVE')
            .where('budget_remaining', '>', 0)
            .orderBy('bid_cpc_amount', 'desc')
            .limit(2)
            .forUpdate() // Lock rows to prevent budget race conditions
            .execute();

        if (bids.length === 0) return null; // No valid bids

        const winner = bids[0];
        const runnerUp = bids.length > 1 ? bids[1] : null;

        // 2. Second-price auction logic: Pay 0.10 INR more than the runner-up, or base reserve.
        const reservePrice = 5.00; // Minimum 5 INR per click/impression
        const actualCpc = runnerUp 
            ? Math.max(runnerUp.bid_cpc_amount + 0.10, reservePrice) 
            : reservePrice;

        // Ensure we don't charge more than the winner's maximum bid
        const finalCharge = Math.min(actualCpc, winner.bid_cpc_amount);

        // 3. Deduct from winner's campaign budget
        await trx.updateTable('ad_campaigns')
            .set({
                budget_remaining: sql`budget_remaining - ${finalCharge}`,
                total_spent: sql`total_spent + ${finalCharge}`
            })
            .where('id', '=', winner.campaign_id)
            .execute();

        // 4. Log the auction result for analytics
        await trx.insertInto('ad_auction_logs')
            .values({
                slot_id: slotId,
                zone_id: zoneId,
                winner_campaign_id: winner.campaign_id,
                winning_max_bid: winner.bid_cpc_amount,
                actual_cpc: finalCharge,
                runner_up_bid: runnerUp ? runnerUp.bid_cpc_amount : null,
                timestamp: sql`NOW()`
            })
            .execute();

        return {
            winnerCampaignId: winner.campaign_id,
            actualCpcPaid: finalCharge
        };
    });
}
