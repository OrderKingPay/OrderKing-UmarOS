// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/founder/pr-nominations")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async () => {
        const { requireUserId } = await import("@/lib/auth/verify.server");
        const { ensureWorkspace } = await import("@/lib/orderking/server/workspace.server");
        const userId = await requireUserId();
        const ws = await ensureWorkspace(userId);
        if (!ws.ctx.permissions.includes("access_AI")) return Response.json({ error: "FORBIDDEN" }, { status: 403 });

        const awards = [
          {
            id: "forbes-asia",
            title: "Forbes 30 Under 30 Asia",
            organization: "Forbes Media",
            url: "https://www.forbes.com/30-under-30/asia/",
            status: "VERIFY_CURRENT_ELIGIBILITY",
            pitch: "Founder draft only. Verify current eligibility, deadlines, company traction, and published metrics before submission.",
          },
          {
            id: "ey-eoy",
            title: "EY Entrepreneur Of The Year - India",
            organization: "Ernst & Young",
            url: "https://www.ey.com/en_in/entrepreneur-of-the-year",
            status: "VERIFY_CURRENT_COHORT",
            pitch: "Founder draft only. Populate with verified company, revenue, employment, and customer evidence before submission.",
          },
          {
            id: "tedx",
            title: "TEDx Speaker Application",
            organization: "TED",
            url: "https://www.ted.com/participate/organize-a-local-tedx-event/tedx-speaker-guidelines",
            status: "VERIFY_EVENT",
            pitch: "Founder draft only. Topic and claims require event-specific approval and evidence.",
          },
          {
            id: "yc",
            title: "Y Combinator",
            organization: "Y Combinator",
            url: "https://www.ycombinator.com/apply",
            status: "VERIFY_CURRENT_BATCH",
            pitch: "Founder draft only. Use verified product, traction, and financial evidence for any application.",
          },
        ];
        return Response.json({ success: true, awards });
      },
    },
  },
});
