// @ts-nocheck
import { createAPIFileRoute } from '@tanstack/react-start/api';

export const APIRoute = createAPIFileRoute('/api/v1/founder/sweep')({
  POST: async () => {
    return new Response(JSON.stringify({
      success: false,
      code: "PAYOUT_PROVIDER_NOT_CONNECTED",
      message: "Founder fund transfer is unavailable until a verified payout provider, beneficiary, authorization, idempotency and reconciliation workflow are connected. No balance was moved or marked settled.",
    }), {
      status: 503,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  },
});
