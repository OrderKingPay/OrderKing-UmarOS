import { createAPIFileRoute } from '@tanstack/react-start/api';

/**
 * Never fabricate regulated-account, escrow, balance, audit, or compliance data.
 */
export const APIRoute = createAPIFileRoute('/api/escrow/status')({
  GET: async () =>
    Response.json(
      {
        verified: false,
        code: "ESCROW_PROVIDER_NOT_CONFIGURED",
        message: "Verified escrow status is unavailable until the regulated account/provider integration is connected.",
      },
      { status: 503 },
    ),
});
