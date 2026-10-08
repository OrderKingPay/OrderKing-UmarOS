import { getSql } from '../../db';

export interface RevenueBreakdown {
    orderCommissions: number;
    subscriptionFees: number;
    deliverySurcharges: number;
    kingPayTransactionFees: number;
    totalRevenue: number;
}

export async function calculateFounderRevenue(startDate: Date, endDate: Date): Promise<RevenueBreakdown> {
    const sql = await getSql();
    
    // Run all aggregation queries concurrently to minimize latency
    const [
        [orderRes],
        [deliveryRes],
        [subRes],
        [txRes]
    ] = await Promise.all([
        sql`
            SELECT COALESCE(SUM(commission_paise), 0) AS commission
            FROM orders
            WHERE placed_at >= ${startDate} AND placed_at < ${endDate} AND status = 'DELIVERED'
        `,
        sql`
            SELECT COALESCE(SUM(delivery_fee_paise), 0) AS surcharges
            FROM orders
            WHERE placed_at >= ${startDate} AND placed_at < ${endDate} AND status = 'DELIVERED'
        `,
        sql`
            SELECT COALESCE(SUM(price_paise), 0) AS fees
            FROM customer_subscriptions
            WHERE created_at >= ${startDate} AND created_at < ${endDate}
        `,
        sql`
            SELECT COALESCE(SUM(amount_paise * 0.02), 0) AS fees
            FROM kingpay_transactions
            WHERE type = 'CREDIT' 
            AND created_at >= ${startDate} AND created_at < ${endDate}
        `
    ]);

    const orderCommissions = Math.floor(Number(orderRes?.commission || 0));
    const deliverySurcharges = Math.floor(Number(deliveryRes?.surcharges || 0));
    const subscriptionFees = Math.floor(Number(subRes?.fees || 0));
    const kingPayTransactionFees = Math.floor(Number(txRes?.fees || 0));

    const totalRevenue = orderCommissions + deliverySurcharges + subscriptionFees + kingPayTransactionFees;

    return {
        orderCommissions,
        subscriptionFees,
        deliverySurcharges,
        kingPayTransactionFees,
        totalRevenue
    };
}
