import { createAPIFileRoute } from '@tanstack/react-start/api';

/**
 * Travel search/booking stays fail-closed until a real provider adapter is
 * configured and verified. No fabricated schedules, fares, availability, or
 * booking confirmations are returned.
 */
export const APIRoute = createAPIFileRoute('/api/v1/integrations/travel')({
  POST: async () =>
    Response.json(
      {
        error: 'Travel provider integration is not configured.',
        code: 'TRAVEL_PROVIDER_NOT_CONFIGURED',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    ),
});
