import { getSql } from '../../db';

export interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topItems: { name: string; quantity: number }[];
  peakHours: { hour: number; count: number }[];
  cancellationRate: number;
}

export async function getDashboardMetrics(restaurantId: string, startDate: string, endDate: string): Promise<DashboardMetrics> {
  const sql = await getSql();
  
  const orders = await sql`
    SELECT id, total_amount, status, EXTRACT(HOUR FROM created_at) as hour
    FROM orders
    WHERE restaurant_id = ${restaurantId} 
    AND created_at >= ${startDate} 
    AND created_at <= ${endDate}
  `;
  
  const totalOrders = orders.length;
  if (totalOrders === 0) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      topItems: [],
      peakHours: [],
      cancellationRate: 0
    };
  }
  
  let totalRevenue = 0;
  let cancelledCount = 0;
  const hourCounts: Record<number, number> = {};
  
  for (const row of orders) {
    const order = row as any;
    if (order.status !== 'CANCELLED') {
      totalRevenue += Number(order.total_amount);
    } else {
      cancelledCount++;
    }
    
    const hour = Number(order.hour);
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }
  
  const averageOrderValue = totalOrders - cancelledCount > 0 
    ? totalRevenue / (totalOrders - cancelledCount) 
    : 0;
    
  const cancellationRate = cancelledCount / totalOrders;
  
  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: Number(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
    
  const topItemsRows = await sql`
    SELECT m.name, SUM(oi.quantity) as quantity
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN menu_items m ON oi.menu_item_id = m.id
    WHERE o.restaurant_id = ${restaurantId}
    AND o.created_at >= ${startDate}
    AND o.created_at <= ${endDate}
    AND o.status != 'CANCELLED'
    GROUP BY m.name
    ORDER BY quantity DESC
    LIMIT 5
  `;
  
  const topItems = topItemsRows.map(row => ({
    name: (row as any).name,
    quantity: Number((row as any).quantity)
  }));
  
  return {
    totalOrders,
    totalRevenue,
    averageOrderValue,
    topItems,
    peakHours,
    cancellationRate
  };
}
