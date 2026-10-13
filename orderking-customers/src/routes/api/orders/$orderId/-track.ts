import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { getSql } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/verify.server';

export const APIRoute = createAPIFileRoute('/api/orders/$orderId/track')({
  GET: async ({ params }: any) => {
    try {
      const user = await getSessionUser();
      if (!user?.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const orderId = params.orderId;
      const sql = await getSql();

      // Get order and verify ownership
      const orders = await sql<{ status: string; rider_id: string | null; user_id: string }>`
        SELECT status, rider_id, user_id
        FROM orders
        WHERE id = ${orderId}
      `;

      if (orders.length === 0) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const order = orders[0];
      if (order.user_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!order.rider_id) {
        return new Response(
          JSON.stringify({ error: 'No rider assigned yet', status: order.status }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Get rider location
      const riders = await sql<{ current_location: unknown }>`
        SELECT current_location
        FROM riders
        WHERE id = ${order.rider_id}
      `;

      if (riders.length === 0) {
        return new Response(JSON.stringify({ error: 'Rider not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const rider = riders[0];

      return new Response(
        JSON.stringify({
          orderStatus: order.status,
          riderId: order.rider_id,
          location: rider.current_location || null,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Order tracking error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
});
