// BBPS is intentionally fail-closed until a real biller/payment provider adapter is configured.
export const APIRoute = createAPIFileRoute('/api/bbps/pay-bill')({
  POST: async () =>
    Response.json(
      { error: "BBPS payment provider integration is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    ),
});
