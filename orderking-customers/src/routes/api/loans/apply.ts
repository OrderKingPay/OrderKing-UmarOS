import { createAPIFileRoute } from '@tanstack/react-start/api';

/**
 * Fail closed until a verified, licensed lending provider is connected.
 */
export const APIRoute = createAPIFileRoute('/api/loans/apply')({
  POST: async () =>
    Response.json(
      {
        approved: false,
        code: "LENDING_PROVIDER_NOT_CONFIGURED",
        message: "Loan applications are temporarily unavailable because no verified lending provider is connected.",
      },
      { status: 503 },
    ),
});
