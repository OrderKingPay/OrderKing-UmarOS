import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/escrow/status")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async () => {
        const { getSessionUser } = await import("@/lib/auth/verify.server");
        const user = await getSessionUser();
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
        return Response.json({
          verified: false,
          status: "PROVIDER_REQUIRED",
          message: "Escrow status is not reported as verified because no live bank/nodal-account provider is connected to this deployment.",
        }, { status: 503 });
      },
    },
  },
});
