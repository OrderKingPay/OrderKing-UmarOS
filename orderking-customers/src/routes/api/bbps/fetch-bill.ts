import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/bbps/fetch-bill")({
  POST: async () =>
    Response.json(
      {
        ok: false,
        code: "BBPS_PROVIDER_NOT_CONFIGURED",
        message:
          "BBPS bill fetch is unavailable until a verified BBPS provider integration is configured. No bill data is fabricated.",
      },
      { status: 503 },
    ),
});
