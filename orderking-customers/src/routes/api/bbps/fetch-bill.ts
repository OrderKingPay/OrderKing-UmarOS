import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/bbps/fetch-bill")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async () => {
        const { getSessionUser } = await import("@/lib/auth/verify.server");
        const user = await getSessionUser();
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
        return Response.json({
          success: false,
          status: "PROVIDER_REQUIRED",
          message: "BBPS bill fetch is not active until a real BBPS service provider is configured and verified.",
        }, { status: 503 });
      },
    },
  },
});
