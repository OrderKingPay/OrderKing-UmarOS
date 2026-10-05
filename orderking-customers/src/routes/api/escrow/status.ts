import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/escrow/status")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          {
            verified: false,
            state: "FUTURE/UNCONFIGURED",
            error: "Escrow status is unavailable until a real banking/escrow provider is connected and independently verified.",
          },
          { status: 503 },
        ),
    },
  },
});
