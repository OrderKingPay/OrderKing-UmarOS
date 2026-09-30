import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getSessionUser } from "@/lib/auth/verify.server";

export const APIRoute = createAPIFileRoute("/api/escrow/status")({
  GET: async () => {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    return Response.json(
      {
        verified: false,
        status: "PROVIDER_REQUIRED",
        message: "Escrow status is not reported as verified because no live bank/nodal-account provider is connected to this deployment.",
      },
      { status: 503 },
    );
  },
});
