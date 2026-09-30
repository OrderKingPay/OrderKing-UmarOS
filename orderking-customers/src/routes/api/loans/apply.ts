import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/loans/apply")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async () => {
        const { getSessionUser } = await import("@/lib/auth/verify.server");
        const user = await getSessionUser();
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
        return Response.json({
          approved: false,
          status: "PROVIDER_REQUIRED",
          message: "Loan applications are not activated until a licensed lending/NBFC partner and compliant underwriting API are configured.",
        }, { status: 503 });
      },
    },
  },
});
