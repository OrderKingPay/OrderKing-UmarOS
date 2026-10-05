import { getSql } from "@/lib/db";

type LegacyRequest = { body?: Record<string, unknown>; params?: Record<string, string | undefined> };
type LegacyResponse = { status: (code: number) => LegacyResponse; json: (body: unknown) => unknown };

const plans: Record<string, { pricePaise: number; durationMonths: number }> = {
  KING_PASS_MONTHLY: { pricePaise: 19900, durationMonths: 1 },
  KING_PASS_YEARLY: { pricePaise: 199900, durationMonths: 12 },
};

export const subscriptionMigrationQuery = `
  CREATE TABLE IF NOT EXISTS customer_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    price_paise BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

export class SubscriptionController {
  public static async subscribe(req: LegacyRequest, res: LegacyResponse) {
    try {
      const customerId = String(req.body?.customerId ?? "").trim();
      const planName = String(req.body?.planName ?? "").trim();
      const plan = plans[planName];

      if (!customerId || !plan) {
        return res.status(400).json({ error: "customerId and valid planName are required" });
      }

      const providerEnabled = process.env.KINGPASS_PAYMENT_PROVIDER_ENABLED === "true";
      const providerConfigured =
        Boolean(process.env.KINGPASS_PAYMENT_PROVIDER) &&
        Boolean(process.env.KINGPASS_PAYMENT_PROVIDER_MERCHANT_ID);

      if (!providerEnabled || !providerConfigured) {
        return res.status(503).json({
          success: false,
          status: "PENDING_EXTERNAL_PROVIDER",
          planName,
          pricePaise: plan.pricePaise,
          message: "No subscription was activated and no money was recorded.",
        });
      }

      return res.status(503).json({
        success: false,
        status: "PENDING_PAYMENT_WEBHOOK",
        planName,
        pricePaise: plan.pricePaise,
        message: "A verified payment webhook is required before King Pass can become ACTIVE.",
      });
    } catch (error) {
      console.error("Subscription error:", error);
      return res.status(500).json({ error: "Subscription could not be created" });
    }
  }

  public static async getSubscription(req: LegacyRequest, res: LegacyResponse) {
    try {
      const customerId = String(req.params?.customerId ?? "").trim();
      if (!customerId) return res.status(400).json({ error: "customerId is required" });

      const sql = await getSql();
      const result = await sql<{
        id: string; customer_id: string; plan_name: string;
        price_paise: number; status: string; valid_until: string | null; created_at: string;
      }>`
        SELECT id, customer_id, plan_name, price_paise, status, valid_until, created_at
        FROM customer_subscriptions
        WHERE customer_id = ${customerId}
          AND status = 'ACTIVE'
          AND valid_until > NOW()
        ORDER BY valid_until DESC
        LIMIT 1
      `;

      return res.status(200).json({ success: true, data: result[0] ?? null });
    } catch (error) {
      console.error("Subscription lookup error:", error);
      return res.status(500).json({ error: "Subscription lookup failed" });
    }
  }
}
