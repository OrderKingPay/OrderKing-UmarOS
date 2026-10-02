import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/loans/apply")({
  POST: async () =>
    Response.json(
      {
        ok: false,
        code: "LENDING_PROVIDER_NOT_CONFIGURED",
        message:
          "Direct loan approval and disbursal are unavailable until a verified lender integration is configured. Use the lender marketplace instead.",
      },
      { status: 503 },
    ),
});
