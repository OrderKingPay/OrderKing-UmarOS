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
    
    // 1. Restaurant Commissions: Ensure we pull the highest possible commission value
    const [orderRes] = await sql`
        SELECT COALESCE(SUM(commission_paise), 0) AS commission
        FROM orders
        WHERE placed_at >= ${startDate} AND placed_at < ${endDate} AND status = 'DELIVERED'
    `;
    const orderCommissions = Math.floor(Number(orderRes?.commission || 0));

    // 2. Delivery Surcharges: Ensure we sum up all delivery fees paid by customers
    const [deliveryRes] = await sql`
        SELECT COALESCE(SUM(delivery_fee_paise), 0) AS surcharges
        FROM orders
        WHERE placed_at >= ${startDate} AND placed_at < ${endDate} AND status = 'DELIVERED'
    `;
    const deliverySurcharges = Math.floor(Number(deliveryRes?.surcharges || 0));

    // 3. Premium Subscriptions (Zomato Gold / King Pass)
    const [subRes] = await sql`
        SELECT COALESCE(SUM(price_paise), 0) AS fees
        FROM customer_subscriptions
        WHERE created_at >= ${startDate} AND created_at < ${endDate}
    `;
    const subscriptionFees = Math.floor(Number(subRes?.fees || 0));

    // 4. KingPay Transaction Fees (e.g. 2% on all incoming credits)
    const [txRes] = await sql`
        SELECT COALESCE(SUM(amount_paise * 0.02), 0) AS fees
        FROM kingpay_transactions
        WHERE type = 'CREDIT' 
        AND created_at >= ${startDate} AND created_at < ${endDate}
    `;
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
