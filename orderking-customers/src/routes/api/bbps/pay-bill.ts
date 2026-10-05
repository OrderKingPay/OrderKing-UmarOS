import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/bbps/pay-bill")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          {
            success: false,
            state: "FUTURE/UNCONFIGURED",
            error: "BBPS payment is disabled until a live BBPS provider and merchant credentials are configured.",
          },
          { status: 503 },
        ),
    },
  },
});
