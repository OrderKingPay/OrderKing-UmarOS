import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/affiliate/click")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        const params = new URL(request.url).searchParams;
        const partnerId = params.get("partner")?.trim();
        const campaignId = params.get("campaign")?.trim() || null;
        const source = params.get("source")?.trim() || "rewards";
        if (!partnerId) return Response.json({ error: "partner is required" }, { status: 400 });

        try {
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const { trackAffiliateClick } = await import("@/lib/server/affiliate-attribution");
          const user = await getSessionUser();

          const destination = await trackAffiliateClick({
            partnerId,
            campaignId,
            userId: user?.id || null,
            source,
            request,
          });

          return new Response(null, {
            status: 302,
            headers: {
              Location: destination,
              "Cache-Control": "no-store",
              "Referrer-Policy": "no-referrer",
            },
          });
        } catch (error) {
          console.error("[affiliate-click] failed:", error);
          return Response.json(
            { success: false, status: "NOT_CONFIGURED" },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
