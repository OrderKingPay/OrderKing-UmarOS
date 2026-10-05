import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/loans/apply")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          {
            approved: false,
            state: "FUTURE/UNCONFIGURED",
            error: "Loan applications are disabled until a regulated lending partner, underwriting contract, consent flow and disbursement/reconciliation path are configured.",
          },
          { status: 503 },
        ),
    },
  },
});
