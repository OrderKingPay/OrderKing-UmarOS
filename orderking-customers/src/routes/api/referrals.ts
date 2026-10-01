import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/referrals")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async () => {
        const { getSessionUser } = await import("@/lib/auth/verify.server");
        const { getGrowthStats } = await import("@/lib/server/growth-target-engine");
        const user = await getSessionUser();
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
        return Response.json(await getGrowthStats(user.id));
      },
      POST: async ({ request }: any) => {
        const body = await request.json();
        const code = String(body?.referralCode || "").trim();
        if (!code) return Response.json({ error: "referralCode is required" }, { status: 400 });
        const { getSessionUser } = await import("@/lib/auth/verify.server");
        const user = await getSessionUser();
        const { recordReferralVisit, attachReferralSignup } = await import("@/lib/server/growth-target-engine");
        const type = String(body?.type || "VISIT").toUpperCase();
        if (type === "VISIT") {
          await recordReferralVisit(code, request, String(body?.source || "share"));
          return Response.json({ success: true });
        }
        if (type === "SIGNUP") {
          if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
          await attachReferralSignup(code, user.id, request, "signup");
          return Response.json({ success: true });
        }
        return Response.json({ error: "Unsupported referral event type" }, { status: 400 });
      },
    },
  },
});