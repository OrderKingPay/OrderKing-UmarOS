import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/founder/sweep")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          {
            success: false,
            state: "DISABLED",
            error: "Founder sweep is disabled until a real regulated settlement/treasury provider and auditable authorization flow are configured.",
          },
          { status: 503 },
        ),
    },
  },
});
