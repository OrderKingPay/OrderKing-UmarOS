import { getSql } from '@/lib/db';

/**
 * Record an order payment using double-entry bookkeeping.
 * Amounts must be in integer paise to avoid floating-point issues.
 */
export async function recordOrderPayment(orderId: string, totalPaise: number, commissionPaise: number): Promise<void> {
    if (!Number.isInteger(totalPaise) || !Number.isInteger(commissionPaise)) {
        throw new Error('Amounts must be in integer paise.');
    }

    const sql = await getSql();
    
    // Record payment from Customer to Platform
    await sql`
        INSERT INTO financial_ledger (order_id, entry_type, account, amount_paise, currency, description, created_at)
        VALUES 
            (${orderId}, 'CREDIT', 'CUSTOMER', ${totalPaise}, 'INR', 'Order payment from customer', NOW()),
            (${orderId}, 'DEBIT', 'PLATFORM', ${totalPaise}, 'INR', 'Order payment received from customer', NOW())
    `;

    // Record payout from Platform to Restaurant (minus commission)
    const restaurantAmount = totalPaise - commissionPaise;
    if (restaurantAmount > 0) {
        await sql`
            INSERT INTO financial_ledger (order_id, entry_type, account, amount_paise, currency, description, created_at)
            VALUES 
                (${orderId}, 'CREDIT', 'PLATFORM', ${restaurantAmount}, 'INR', 'Payout to restaurant', NOW()),
                (${orderId}, 'DEBIT', 'RESTAURANT', ${restaurantAmount}, 'INR', 'Payout from platform', NOW())
        `;
    }
}

/**
 * Verifies that the ledger is balanced, meaning SUM(DEBIT) === SUM(CREDIT).
 */
export async function reconcile(): Promise<boolean> {
    const sql = await getSql();
    const result = await sql`
        SELECT 
            SUM(CASE WHEN entry_type = 'DEBIT' THEN amount_paise ELSE -amount_paise END) as total_balance
        FROM financial_ledger
    `;
    
    const balance = result[0]?.total_balance;
    return Number(balance) === 0;
}
