import { getSql } from '@/lib/db';

export type TransactionType = 
  | 'ORDER_PAYMENT' 
  | 'REFUND' 
  | 'COMMISSION_DEDUCTION' 
  | 'DELIVERY_FEE' 
  | 'RESTAURANT_PAYOUT' 
  | 'RIDER_PAYOUT'
  | 'ADJUSTMENT'
  | 'TAX';

export interface LedgerEntry {
  id?: string;
  orderId?: string;
  transactionType: TransactionType;
  amount: number; // in lowest denomination (paise)
  currency: string;
  sourceAccountId: string; // 'CUSTOMER_XYZ', 'PLATFORM', 'RESTAURANT_ABC'
  destinationAccountId: string; 
  status: 'PENDING' | 'SETTLED' | 'FAILED';
  metadata?: any;
  createdAt?: string;
}

export class FinancialLedger {
  
  static async recordTransaction(entry: LedgerEntry) {
    const res = await (await getSql())`
      INSERT INTO financial_ledger (
        order_id, transaction_type, amount, currency, source_account_id, destination_account_id, status, metadata
      ) VALUES (
        ${entry.orderId || null},
        ${entry.transactionType},
        ${entry.amount},
        ${entry.currency || 'INR'},
        ${entry.sourceAccountId},
        ${entry.destinationAccountId},
        ${entry.status},
        ${entry.metadata ? JSON.stringify(entry.metadata) : null}
      )
      RETURNING id
    `;
    return res[0].id;
  }

  static async reconcileOrder(orderId: string) {
    // Reconcile single order
    const transactions = await (await getSql())`
      SELECT * FROM financial_ledger WHERE order_id =  as Promise<Array<{ destination_account_id: string, source_account_id: string, amount: number }>>
    `;

    let totalIn = 0;
    let totalOut = 0;

    for (const tx of transactions) {
      if (tx.destination_account_id === 'PLATFORM') {
        totalIn += Number(tx.amount);
      }
      if (tx.source_account_id === 'PLATFORM') {
        totalOut += Number(tx.amount);
      }
    }

    const netPlatformRevenue = totalIn - totalOut;

    // Log reconciliation result
    await (await getSql())`
      INSERT INTO reconciliation_reports (order_id, total_in, total_out, net_revenue, status)
      VALUES (${orderId}, ${totalIn}, ${totalOut}, ${netPlatformRevenue}, ${netPlatformRevenue >= 0 ? 'BALANCED' : 'DEFICIT'})
    `;

    return { totalIn, totalOut, netPlatformRevenue };
  }

  static async calculateRestaurantPayout(restaurantId: string, startDate: string, endDate: string) {
    // Find all completed orders for restaurant
    const orders = await (await getSql())`
      SELECT id, total_amount, commission_rate FROM orders 
      WHERE restaurant_id = ${restaurantId} AND status = 'DELIVERED' 
      AND created_at >= ${startDate} AND created_at <= ${endDate}
    `;

    let totalSales = 0;
    let totalCommission = 0;

    for (const order of orders) {
      const commission = Number(order.total_amount) * Number(order.commission_rate || 0.15); // 15% default
      totalSales += Number(order.total_amount);
      totalCommission += commission;

      await this.recordTransaction({
        orderId: order.id as string,
        transactionType: 'COMMISSION_DEDUCTION',
        amount: commission,
        currency: 'INR',
        sourceAccountId: `RESTAURANT_${restaurantId}`,
        destinationAccountId: 'PLATFORM',
        status: 'SETTLED',
        metadata: { rule: 'STANDARD_COMMISSION_15' }
      });
    }

    const netPayout = totalSales - totalCommission;

    if (netPayout > 0) {
      await this.recordTransaction({
        transactionType: 'RESTAURANT_PAYOUT',
        amount: netPayout,
        currency: 'INR',
        sourceAccountId: 'PLATFORM',
        destinationAccountId: `RESTAURANT_${restaurantId}`,
        status: 'PENDING',
        metadata: { period_start: startDate, period_end: endDate }
      });
    }

    return { totalSales, totalCommission, netPayout };
  }
}
