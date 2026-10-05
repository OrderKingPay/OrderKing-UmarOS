import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/bbps/fetch-bill")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          {
            billerId: null,
            consumerNumber: null,
            state: "FUTURE_UNCONFIGURED",
            error: "BBPS bill fetch is disabled until a live biller and provider integration is configured.",
          },
          { status: 503 },
        ),
    },
  },
});
