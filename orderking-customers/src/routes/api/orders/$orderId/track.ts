// @ts-nocheck
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { getSql } from '@/lib/db';

export const APIRoute = createAPIFileRoute('/api/orders/$orderId/track')({
  GET: async ({ request, params }) => {
    try {
      const orderId = params.orderId;
      const sql = await getSql();

      // Quick raw SQL migration to ensure current_location exists
      await sql`ALTER TABLE riders ADD COLUMN IF NOT EXISTS current_location JSONB;`;

      // Get order and its assigned rider
      const orders = await sql`
        SELECT status, rider_id 
        FROM orders 
        WHERE id = ${orderId};
      `;

      if (orders.length === 0) {
        return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
      }

      const order = orders[0];

      if (!order.rider_id) {
        return new Response(JSON.stringify({ error: 'No rider assigned yet', status: order.status }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // Get rider location
      const riders = await sql`
        SELECT current_location
        FROM riders
        WHERE id = ${order.rider_id};
      `;

      if (riders.length === 0) {
        return new Response(JSON.stringify({ error: 'Rider not found' }), { status: 404 });
      }

      const rider = riders[0];

      return new Response(JSON.stringify({
        orderStatus: order.status,
        riderId: order.rider_id,
        location: rider.current_location || null
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Order tracking error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
  },
});
