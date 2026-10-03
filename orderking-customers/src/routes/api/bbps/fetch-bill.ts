// BBPS is intentionally fail-closed until a real provider adapter is configured.
export const APIRoute = createAPIFileRoute('/api/bbps/fetch-bill')({
  POST: async () =>
    Response.json(
      { error: "BBPS provider integration is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    ),
});
