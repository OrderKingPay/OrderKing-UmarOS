import { createFileRoute } from "@tanstack/react-router";

const FEATURE_STATE = "FUTURE/UNCONFIGURED";

export const Route = createFileRoute("/api/v1/finance/subscription")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          {
            success: false,
            state: FEATURE_STATE,
            error: "King Pass subscription billing is not enabled because a production subscription/payment flow has not been configured.",
          },
          { status: 503 },
        ),
      GET: async () =>
        Response.json({
          success: false,
          state: FEATURE_STATE,
          data: null,
          error: "King Pass subscription billing is not enabled.",
        }),
    },
  },
});
