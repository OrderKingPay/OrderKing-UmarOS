import { getSql } from '@/lib/db';

export interface PayoutBatchPayload {
  batchId: string;
  totalAmountPaise: number;
  transactions: PayoutTransaction[];
}

export interface PayoutTransaction {
  restaurantId: string;
  accountNumber: string;
  ifscCode: string;
  amountPaise: number;
  referenceId: string;
  narration: string;
}

/**
 * Builds the automated restaurant settlement processor.
 * Calculates payouts based on DELIVERED orders in the past 7 days.
 * Payout = Total Order Value - OrderKing Commission (22%) - Tax (18% on commission).
 * All calculations use integer math (paise) to prevent floating point errors.
 */
export async function processPartnerPayouts(restaurantId: string): Promise<PayoutBatchPayload> {
  const sql = await getSql();
  
  // Date range: past 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Commission rate is 22% (represented as 2200 / 10000)
  const COMMISSION_RATE = 2200;
  // Tax rate is 18% on the commission (represented as 1800 / 10000)
  const TAX_RATE = 1800;

  // Real SQL aggregation to compute total order value
  const rows = await sql`
    SELECT 
      o.restaurant_id,
      r.bank_account_number as account_number,
      r.bank_ifsc_code as ifsc_code,
      SUM(o.total_value_paise) as total_sales_paise,
      COUNT(o.id) as total_orders
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    WHERE o.restaurant_id = ${restaurantId}
      AND o.status = 'DELIVERED'
      AND o.created_at >= ${sevenDaysAgo.toISOString()}
    GROUP BY o.restaurant_id, r.bank_account_number, r.bank_ifsc_code
  `;

  if (!rows || rows.length === 0) {
    return {
      batchId: `BATCH-${Date.now()}`,
      totalAmountPaise: 0,
      transactions: []
    };
  }

  const transactions: PayoutTransaction[] = rows.map((row: any) => {
    const totalSalesPaise = parseInt(row.total_sales_paise, 10);
    
    // Integer math only
    const commissionPaise = Math.floor((totalSalesPaise * COMMISSION_RATE) / 10000);
    const taxPaise = Math.floor((commissionPaise * TAX_RATE) / 10000);
    
    const payoutPaise = totalSalesPaise - commissionPaise - taxPaise;

    return {
      restaurantId: row.restaurant_id,
      accountNumber: row.account_number,
      ifscCode: row.ifsc_code,
      amountPaise: payoutPaise,
      referenceId: `PAY-${Date.now()}-${row.restaurant_id}`,
      narration: `SETTLEMENT FOR ${row.total_orders} ORDERS`
    };
  });

  const totalBatchAmount = transactions.reduce((sum, tx) => sum + tx.amountPaise, 0);

  // Return a JSON payload mathematically matching a standard NEFT/RTGS bank transfer batch file
  return {
    batchId: `BATCH-${Date.now()}`,
    totalAmountPaise: totalBatchAmount,
    transactions
  };
}
