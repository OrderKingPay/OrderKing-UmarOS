import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { getSql } from '../../../../../lib/db';

const subscriptionRequestSchema = z.object({
  customerId: z.string().uuid(),
  planName: z.enum(['KING_PASS_MONTHLY', 'KING_PASS_YEARLY']),
});

const plans = {
  KING_PASS_MONTHLY: { pricePaise: 19900, durationMonths: 1 },
  KING_PASS_YEARLY: { pricePaise: 199900, durationMonths: 12 },
} as const;

function authorized(request: Request): boolean {
  const secret = process.env.CR0N_SECRET ?? process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
}

export const Route = createFileRoute('/api/v1/finance/subscription')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!authorized(request)) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        try {
          const body = subscriptionRequestSchema.parse(await request.json());
          const plan = plans[body.planName];
          const validUntil = new Date();
          validUntil.setUTCMonth(validUntil.getUTCMonth() + plan.durationMonths);

          const sql = await getSql();
          const rows = await sql.query<{ id: string }>(
            `INSERT INTO customer_subscriptions
              (customer_id, plan_name, price_paise, status, valid_until, created_at, updated_at)
             VALUES ($1, $2, $3, 'ACTIVE', $4, NOW(), NOW())
             RETURNING id`,
            [body.customerId, body.planName, plan.pricePaise, validUntil],
          );

          return Response.json({
            success: true,
            data: {
              subscriptionId: rows[0]?.id,
              planName: body.planName,
              pricePaise: plan.pricePaise,
              validUntil: validUntil.toISOString(),
            },
          }, { status: 201 });
        } catch (error) {
          if (error instanceof z.ZodError) {
            return Response.json({ success: false, message: 'Invalid subscription request', issues: error.issues }, { status: 400 });
          }
          console.error('[SUBSCRIPTION] Create failed:', error);
          return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
        }
      },

      GET: async ({ request }) => {
        if (!authorized(request)) {
          return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const customerId = new URL(request.url).searchParams.get('customerId');
        if (!customerId) {
          return Response.json({ success: false, message: 'customerId is required' }, { status: 400 });
        }

        try {
          const sql = await getSql();
          const rows = await sql.query(
            `SELECT id, customer_id, plan_name, price_paise, status, valid_until, created_at, updated_at
             FROM customer_subscriptions
             WHERE customer_id = $1 AND status = 'ACTIVE' AND valid_until > NOW()
             ORDER BY valid_until DESC
             LIMIT 1`,
            [customerId],
          );
          return Response.json({ success: true, data: rows[0] ?? null });
        } catch (error) {
          console.error('[SUBSCRIPTION] Lookup failed:', error);
          return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
        }
      },
    },
  },
});
