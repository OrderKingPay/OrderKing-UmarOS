// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/founder/jobs")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async () => {
        try {
          const { requireUserId } = await import("@/lib/auth/verify.server");
          const { ensureWorkspace } = await import("@/lib/orderking/server/workspace.server");
          const userId = await requireUserId();
          const ws = await ensureWorkspace(userId);
          if (!ws.ctx.permissions.includes("access_AI")) return Response.json({ error: "FORBIDDEN" }, { status: 403 });

          const response = await fetch("https://remoteok.com/api", { headers: { "User-Agent": "OrderKing-UmarOS/1.0" } });
          if (!response.ok) throw new Error(`RemoteOK HTTP ${response.status}`);
          const data = await response.json();
          const jobs = (Array.isArray(data) ? data.slice(1) : []).slice(0, 50).map((job: any) => ({
            id: job.id,
            title: job.position,
            platform: "RemoteOK",
            clientLocation: job.location || "Global Remote",
            hourlyRateUsd: null,
            fixedBudgetUsd: job.salary_max || null,
            skillsRequired: Array.isArray(job.tags) ? job.tags : [],
            matchScore: null,
            applicationStatus: "NOT_APPLIED",
            description: typeof job.description === "string" ? job.description.slice(0, 500) : "",
            duration: "Unknown",
            proposalTemplate: "Founder review required before submission. Portfolio claims are generated only from verified project evidence.",
            url: job.url,
          }));
          return Response.json({ success: true, jobs });
        } catch (error: any) {
          console.error("[founder jobs]:", error);
          return Response.json({ success: false, error: "Failed to fetch current remote jobs." }, { status: 502 });
        }
      },
    },
  },
});
