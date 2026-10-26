import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { getSessionUser } from "@/lib/auth/verify.server";
import { getSql } from "@/lib/db";

export const APIRoute = createAPIFileRoute("/api/v1/founder/jobs")({
  GET: async () => {
    try {
      const session = await getSessionUser();
      if (!session?.id) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      const sql = await getSql();
      const roleRows = await sql`SELECT role FROM users WHERE id = ${session.id} LIMIT 1`;
      const role = roleRows.length > 0 ? String((roleRows[0] as any).role || "").toUpperCase() : "";
      if (!["SUPER_ADMIN", "FOUNDER", "ADMIN"].includes(role)) {
        return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const response = await fetch("https://remoteok.com/api");
      const data = await response.json();

      // Filter out the legal notice (first item) and format deterministically from source fields
      const jobs = (Array.isArray(data) ? data.slice(1) : []).map((job: any) => ({
        id: job.id,
        title: job.position,
        platform: "RemoteOK",
        clientLocation: job.location || "Global Remote",
        hourlyRateUsd: job.salary_min ? Math.round(Number(job.salary_min) / 2000) : 0,
        fixedBudgetUsd: Number(job.salary_max) || 0,
        skillsRequired: Array.isArray(job.tags) ? job.tags : [],
        matchScore: Array.isArray(job.tags) ? Math.min(100, 70 + job.tags.length * 5) : 75,
        applicationStatus: "NOT_APPLIED",
        description: job.description ? String(job.description).substring(0, 500) + "..." : "",
        duration: "Contract / Remote",
        proposalTemplate: `Hi Hiring Manager,\n\nI saw your listing for ${job.position} and would be glad to discuss how our engineering and operations experience can support your team.\n\nBest regards,\nOrderKing Engineering`,
        url: job.url,
      }));

      return new Response(JSON.stringify({ success: true, jobs: jobs.slice(0, 50) }), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Failed to fetch remote jobs:", error);
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch remote jobs" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
