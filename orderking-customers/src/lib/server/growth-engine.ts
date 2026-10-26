import { getSql } from "@/lib/db";
import { createServerFn } from "@tanstack/react-start";

/**
 * OrderKing Growth Engine - Merchant Economics (The Wedge)
 * 
 * Dominant legacy aggregators effectively charge 25-3custom commissions.
 * OrderKing operates on a Zero-Commission SaaS tier or a flat 10% Pay-As-You-Go tier.
 * We instantly settle payments using KingPay (vs T+2 for competitors).
 */

export const calculateMerchantEconomics = async (restaurantId: string, orderValuePaise: number) => {
  const sql = await getSql();
  
  // Verify if merchant is on the SaaS Zero-Commission Plan
  const plan = await sql<{ tier: string }>`
    SELECT tier FROM subscription_plans 
    WHERE restaurant_id = ${restaurantId} AND status = 'active'
    LIMIT 1
  `;
  
  const isSaaS = plan.length > 0 && plan[0].tier === 'zero_commission';
  
  // Platform fee: 0% if SaaS, 10% if Pay-As-You-Go
  const platformFeePercent = isSaaS ? 0 : 0.10; 
  const platformFeePaise = Math.floor(orderValuePaise * platformFeePercent);
  
  // Payment Gateway Processing Fee (184 bps = 1.84% + 18% GST)
  const pgFeeBase = Math.floor((orderValuePaise * 184) / 10000);
  const pgFeeGst = Math.floor((pgFeeBase * 1800) / 10000);
  const paymentGatewayFeePaise = pgFeeBase + pgFeeGst;
  
  // Net payout to merchant
  const netPayoutPaise = orderValuePaise - platformFeePaise - paymentGatewayFeePaise;
  
  // Competitor comparison (for merchant dashboard visibility)
  const competitorFeePercent = 0.28; // Standard 28% assumed legacy aggregator fee
  const competitorPayoutPaise = Math.floor(orderValuePaise * (1 - competitorFeePercent));
  
  // OrderKing Savings
  const savingsPaise = netPayoutPaise - competitorPayoutPaise;

  return {
    orderValuePaise,
    platformFeePaise,
    paymentGatewayFeePaise,
    netPayoutPaise,
    isSaaS,
    competitorPayoutPaise,
    savingsPaise
  };
};

export const getMerchantGrowthDashboard = createServerFn({ method: "GET" })
  .validator((data: { restaurantId: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    
    // Baseline metrics
    const stats = await sql<{ total_orders: number, total_revenue: number }>`
      SELECT COUNT(id) as total_orders, COALESCE(SUM(total_paise), 0) as total_revenue
      FROM orders
      WHERE restaurant_id = ${data.restaurantId} AND status = 'delivered'
    `;

    // Projected savings vs competitors
    const metrics = stats[0];
    const avgOrderValue = metrics.total_orders > 0 ? metrics.total_revenue / metrics.total_orders : 0;
    
    const economics = await calculateMerchantEconomics(data.restaurantId, avgOrderValue);
    const totalSavingsPaise = economics.savingsPaise * metrics.total_orders;

    return {
      totalOrders: metrics.total_orders,
      totalRevenuePaise: metrics.total_revenue,
      orderKingNetPayoutPaise: economics.netPayoutPaise * metrics.total_orders,
      competitorNetPayoutPaise: economics.competitorPayoutPaise * metrics.total_orders,
      totalSavingsPaise,
      isSaaSMerchant: economics.isSaaS
    };
  });
