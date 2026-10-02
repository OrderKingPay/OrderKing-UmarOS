import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/bbps/pay-bill")({
  POST: async () =>
    Response.json(
      {
        ok: false,
        code: "BBPS_PROVIDER_NOT_CONFIGURED",
        message:
          "BBPS payment is unavailable until a verified BBPS provider integration is configured. No wallet debit or payment success is created.",
      },
      { status: 503 },
    ),
});
