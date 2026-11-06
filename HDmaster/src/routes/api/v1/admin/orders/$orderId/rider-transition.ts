import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { getSessionUser } from "@/lib/auth/verify.server";
import { getSql } from '@/lib/db';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'FOUNDER', 'ADMIN']);

export const APIRoute = createAPIFileRoute('/api/v1/admin/orders/$orderId/rider-transition')({
  POST: async ({ request, params }: any) => {
    try {
      const sessionUser = await getSessionUser();
      if (!sessionUser?.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const sql = await getSql();
      const roleRows = await sql<{ role: string }>`
        SELECT role FROM users WHERE id = ${sessionUser.id} LIMIT 1
      `;
      const role = String(roleRows[0]?.role ?? '').toUpperCase();
      if (!ADMIN_ROLES.has(role)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Admin or Founder role required' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const orderId = params.orderId;
      const body = await request.json();
      const { riderId, from, to, reason, correlationId } = body;
      void reason;
      void correlationId;

      if (!riderId || !from || !to) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

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
        return new Response(
          JSON.stringify({ error: 'Atomic transition failed. Invalid current status or order not found.' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ success: true, orderId: result[0].id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Rider transition error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
});

