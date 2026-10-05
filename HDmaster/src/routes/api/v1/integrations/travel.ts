import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/integrations/travel")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          {
            success: false,
            state: "FUTURE/UNCONFIGURED",
            error: "Travel booking is disabled until an approved live flight/train provider, credentials, pricing/search APIs, booking workflow and reconciliation are configured.",
          },
          { status: 503 },
        ),
    },
  },
});
