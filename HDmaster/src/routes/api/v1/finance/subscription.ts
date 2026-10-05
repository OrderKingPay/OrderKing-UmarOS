/**
 * KingPass subscription service boundary.
 *
 * This module remains available for the future VIP subscription rollout, but it
 * is deliberately fail-closed until the real payment + subscription ledger
 * integration is enabled. It must never return a fabricated subscription ID.
 */

export const SUBSCRIPTION_PLANS = {
  KING_PASS_MONTHLY: { pricePaise: 14900, durationMonths: 1 },
  KING_PASS_YEARLY: { pricePaise: 149900, durationMonths: 12 },
} as const;

export type SubscriptionRequest = {
  body?: { customerId?: string; planName?: keyof typeof SUBSCRIPTION_PLANS };
  params?: { customerId?: string };
};

export type SubscriptionResponse = {
  statusCode: number;
  body: Record<string, unknown>;
};

export class SubscriptionController {
  static async subscribe(_req: SubscriptionRequest): Promise<SubscriptionResponse> {
    return {
      statusCode: 503,
      body: {
        error: "KingPass subscription service is not enabled.",
        code: "SUBSCRIPTION_PROVIDER_NOT_CONFIGURED",
      },
    };
  }

  static async getSubscription(_req: SubscriptionRequest): Promise<SubscriptionResponse> {
    return {
      statusCode: 200,
      body: {
        success: true,
        data: null,
        state: "NOT_ENABLED",
      },
    };
  }
}
