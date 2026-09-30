import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/affiliate/click")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        const partnerId = new URL(request.url).searchParams.get("partner")?.trim();
        if (!partnerId) return Response.json({ error: "partner is required" }, { status: 400 });
        try {
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const { trackAffiliateClick } = await import("@/lib/server/affiliate-attribution");
          const user = await getSessionUser();
          const url = await trackAffiliateClick({ partnerId, userId: user?.id || null, source: "share", request });
          return Response.json({ success: true, url });
        } catch {
          return Response.json({ success: false, status: "NOT_CONFIGURED" }, { status: 503 });
        }
      },
    },
  },
});