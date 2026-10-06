// @ts-nocheck
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { getSql } from '@/lib/db';

export const APIRoute = createAPIFileRoute('/api/v1/admin/orders/$orderId/rider-transition')({
  POST: async ({ request, params }) => {
    try {
      const orderId = params.orderId;
      const body = await request.json();
      const { riderId, from, to, reason, correlationId } = body;

      if (!riderId || !from || !to) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
      }

      const sql = await getSql();

      // Ensure the transition is atomic.
      // Update order status where current status matches the expected 'from' status.
      const result = await sql`
        UPDATE orders
        SET status = ${to},
            rider_id = ${riderId},
            updated_at = NOW()
        WHERE id = ${orderId} AND status = ${from}
        RETURNING id;
      `;

      if (result.length === 0) {
        // If length is 0, either order doesn't exist or status wasn't 'from'
        return new Response(JSON.stringify({ error: 'Atomic transition failed. Invalid current status or order not found.' }), { status: 409 });
      }

      // Log the transition (optional but good for tracking reason and correlationId)
      // Assuming a transition log table exists, or we just rely on the orders table update.
      // If we have rider_transitions table, we could insert there, but mission didn't specify.

      return new Response(JSON.stringify({ success: true, orderId: result[0].id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Rider transition error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
  },
});
