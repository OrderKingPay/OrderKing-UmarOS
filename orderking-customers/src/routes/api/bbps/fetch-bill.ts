import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getSessionUser } from "@/lib/auth/verify.server";

export const APIRoute = createAPIFileRoute("/api/bbps/fetch-bill")({
  POST: async () => {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    return Response.json(
      {
        success: false,
        status: "PROVIDER_REQUIRED",
        message: "BBPS bill fetch is not active until a real BBPS service provider is configured and verified.",
      },
      { status: 503 },
    );
  },
});
