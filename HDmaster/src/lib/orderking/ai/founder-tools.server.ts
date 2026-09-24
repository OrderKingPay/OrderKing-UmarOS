import { getSql } from "@/lib/db";
import type { ToolDefinition } from "./providers/provider-interface.ts";

export const FOUNDER_TOOLS: ToolDefinition[] = [
  {
    name: "get_operations_summary",
    description: "Retrieves the real-time operations and financial summary for Order King. Includes live orders, active riders, and total collected revenue.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_order_details",
    description: "Retrieves complete lifecycle details and payment status for a specific order ID.",
    parameters: {
      type: "object",
      properties: {
        orderId: { type: "string", description: "The ID or public ID of the order." }
      },
      required: ["orderId"],
    },
  },
  {
    name: "get_restaurant_performance",
    description: "Analyzes real-time performance and sales for a specific restaurant.",
    parameters: {
      type: "object",
      properties: {
        restaurantId: { type: "string", description: "The internal ID of the restaurant." }
      },
      required: ["restaurantId"],
    },
  }
];

export async function executeFounderTool(name: string, args: Record<string, any>): Promise<any> {
  const sql = await getSql();

  try {
    switch (name) {
      case "get_operations_summary": {
        const orderStats = await sql<{ total: number, delivered: number, cancelled: number, total_paise: number }>`
          SELECT 
            count(*) as total,
            sum(case when status = 'DELIVERED' then 1 else 0 end) as delivered,
            sum(case when status = 'CANCELLED' then 1 else 0 end) as cancelled,
            sum(total_paise) as total_paise
          FROM orders
        `;
        
        const riderStats = await sql<{ active: number }>`
          SELECT count(*) as active FROM riders WHERE status = 'ACTIVE'
        `;

        return {
          totalOrders: Number(orderStats[0]?.total || 0),
          deliveredOrders: Number(orderStats[0]?.delivered || 0),
          cancelledOrders: Number(orderStats[0]?.cancelled || 0),
          totalRevenueINR: Number(orderStats[0]?.total_paise || 0) / 100,
          activeRiders: Number(riderStats[0]?.active || 0),
          timestamp: new Date().toISOString()
        };
      }

      case "get_order_details": {
        const { orderId } = args;
        const orders = await sql`SELECT * FROM orders WHERE id = ${orderId} OR public_id = ${orderId} LIMIT 1`;
        if (!orders.length) return { error: "Order not found." };
        const order = orders[0];
        const payments = await sql`SELECT * FROM payments WHERE order_id = ${order.id}`;
        const items = await sql`SELECT name_snapshot, quantity, line_total_paise FROM order_items WHERE order_id = ${order.id}`;
        
        return {
          id: order.id,
          publicId: order.public_id,
          status: order.status,
          totalINR: Number(order.total_paise) / 100,
          placedAt: order.placed_at,
          paymentMethod: order.payment_method,
          paymentStatus: order.payment_status,
          payments: payments.map(p => ({ provider: p.provider, status: p.status, amountINR: Number(p.amount_paise)/100 })),
          items: items.map(i => ({ name: i.name_snapshot, quantity: i.quantity }))
        };
      }

      case "get_restaurant_performance": {
        const { restaurantId } = args;
        const rst = await sql`SELECT * FROM restaurants WHERE id = ${restaurantId} LIMIT 1`;
        if (!rst.length) return { error: "Restaurant not found." };
        
        const stats = await sql<{ total_orders: number, revenue: number }>`
          SELECT count(*) as total_orders, sum(total_paise) as revenue 
          FROM orders WHERE restaurant_id = ${restaurantId} AND status = 'DELIVERED'
        `;

        return {
          id: rst[0].id,
          name: rst[0].name,
          status: rst[0].status,
          completedOrders: Number(stats[0]?.total_orders || 0),
          totalRevenueINR: Number(stats[0]?.revenue || 0) / 100
        };
      }

      default:
        return { error: `Tool ${name} is not recognized or authorized.` };
    }
  } catch (err: any) {
    return { error: `Execution failed: ${err.message}` };
  }
}
