import { getSql } from '../../db';

export interface RevenueBreakdown {
    orderCommissions: number;
    subscriptionFees: number;
    deliverySurcharges: number;
    partnerListingFees: number;
    totalRevenue: number;
}

export async function calculateFounderRevenue(startDate: Date, endDate: Date): Promise<RevenueBreakdown> {
    const sql = await getSql();
    
    const [orderRes] = await sql`
        SELECT COALESCE(SUM(total_amount_paise * 0.22), 0) AS commission
        FROM orders
        WHERE created_at >= ${startDate} AND created_at < ${endDate} AND status = 'completed'
    `;
    
    const [subRes] = await sql`
        SELECT COALESCE(SUM(fee_paise), 0) AS fees
        FROM subscriptions
        WHERE created_at >= ${startDate} AND created_at < ${endDate} AND status = 'active'
    `;
    
    const [deliveryRes] = await sql`
        SELECT COALESCE(SUM(surcharge_paise), 0) AS surcharges
        FROM deliveries
        WHERE created_at >= ${startDate} AND created_at < ${endDate} AND status = 'completed'
    `;
    
    const [partnerRes] = await sql`
        SELECT COALESCE(SUM(listing_fee_paise), 0) AS listing_fees
        FROM partners
        WHERE created_at >= ${startDate} AND created_at < ${endDate}
    `;

    const orderCommissions = Math.floor(Number(orderRes?.commission || 0));
    const subscriptionFees = Math.floor(Number(subRes?.fees || 0));
    const deliverySurcharges = Math.floor(Number(deliveryRes?.surcharges || 0));
    const partnerListingFees = Math.floor(Number(partnerRes?.listing_fees || 0));
    
    return {
        orderCommissions,
        subscriptionFees,
        deliverySurcharges,
        partnerListingFees,
        totalRevenue: orderCommissions + subscriptionFees + deliverySurcharges + partnerListingFees
    };
}
