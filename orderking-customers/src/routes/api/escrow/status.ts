import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/escrow/status")({
  GET: async () =>
    Response.json(
      {
        ok: false,
        code: "ESCROW_PROVIDER_NOT_CONFIGURED",
        verified: false,
        complianceStatus: "NOT_VERIFIED",
        message:
          "Escrow status is unavailable until a real bank/payment provider integration is configured and verified.",
      },
      { status: 503 },
    ),
});
