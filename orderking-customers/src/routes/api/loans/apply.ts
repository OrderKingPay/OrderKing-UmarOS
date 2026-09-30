import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getSessionUser } from "@/lib/auth/verify.server";

export const APIRoute = createAPIFileRoute("/api/loans/apply")({
  POST: async () => {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    return Response.json(
      {
        approved: false,
        status: "PROVIDER_REQUIRED",
        message: "Loan applications are not activated until a licensed lending/NBFC partner and compliant underwriting API are configured.",
      },
      { status: 503 },
    );
  },
});
