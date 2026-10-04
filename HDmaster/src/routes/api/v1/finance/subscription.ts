// Legacy King Pass HTTP adapter.
// Production billing is intentionally fail-closed until the real provider,
// webhook verification, and settlement contract are configured.

type RequestLike = {
  body?: Record<string, unknown>;
  params?: Record<string, string | undefined>;
};

type ResponseLike = {
  status(code: number): ResponseLike;
  json(body: unknown): unknown;
};

const getSql = (strings: TemplateStringsArray, ...values: unknown[]) =>
  strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");

export const subscriptionMigrationQuery = getSql`
  CREATE TABLE IF NOT EXISTS customer_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    price_paise BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_cust_subs_customer_id ON customer_subscriptions(customer_id);
  CREATE INDEX IF NOT EXISTS idx_cust_subs_status_valid ON customer_subscriptions(status, valid_until);
`;

function unavailable(res: ResponseLike) {
  return res.status(503).json({
    success: false,
    error: "KING_PASS_PROVIDER_NOT_CONFIGURED",
    message: "King Pass billing is disabled until its production subscription provider is configured.",
  });
}

export class SubscriptionController {
  public static subscribe(_req: RequestLike, res: ResponseLike) {
    return unavailable(res);
  }

  public static getSubscription(_req: RequestLike, res: ResponseLike) {
    return unavailable(res);
  }
}
