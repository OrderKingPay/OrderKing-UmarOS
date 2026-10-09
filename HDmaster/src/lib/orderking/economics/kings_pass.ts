import { Kysely, sql } from 'kysely';

export interface DB {
  subscriptions: any;
  billing_ledger: any;
}

/**
 * Process recurring billing for King's Pass subscriptions.
 * Sweeps all active subscriptions that are due, creates billing records,
 * and defers the next_billing_date using Postgres interval mathematics.
 */
export async function processKingsPassRenewals(db: Kysely<DB>) {
    return await db.transaction().execute(async (trx) => {
        // Lock rows for update to prevent concurrent double-billing
        const dueSubscriptions = await trx
            .selectFrom('subscriptions')
            .selectAll()
            .where('plan_type', '=', 'KINGS_PASS')
            .where('status', '=', 'ACTIVE')
            .where('next_billing_date', '<=', sql`NOW()`)
            .forUpdate()
            .execute();

        const processedIds: string[] = [];
        let totalProjectedRevenue = 0;

        for (const sub of dueSubscriptions) {
            const planCost = 299.00; // Monthly fee in INR

            // 1. Generate charge record
            await trx.insertInto('billing_ledger')
                .values({
                    user_id: sub.user_id,
                    amount: planCost,
                    currency: 'INR',
                    description: 'King\'s Pass Monthly Renewal',
                    status: 'PENDING',
                    created_at: sql`NOW()`
                })
                .executeTakeFirstOrThrow();

            // 2. Update next billing date dynamically
            await trx.updateTable('subscriptions')
                .set({
                    next_billing_date: sql`next_billing_date + INTERVAL '1 MONTH'`,
                    last_billed_at: sql`NOW()`,
                    renewal_count: sql`renewal_count + 1`
                })
                .where('id', '=', sub.id)
                .execute();

            processedIds.push(sub.id);
            totalProjectedRevenue += planCost;
        }

        return { 
            processedCount: processedIds.length, 
            totalProjectedRevenue,
            processedIds 
        };
    });
}
