import { createFileRoute } from "@tanstack/react-router";

type RemoteJob = {
  id: string;
  position?: string;
  company?: string;
  location?: string;
  tags?: string[];
  description?: string;
  url?: string;
  salary_min?: number;
  salary_max?: number;
};

export const Route = createFileRoute("/api/v1/founder/jobs")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const response = await fetch("https://remoteok.com/api", {
            headers: { Accept: "application/json", "User-Agent": "OrderKing-Founder-Jobs/1.0" },
          });
          if (!response.ok) {
            return Response.json({ success: false, state: "PROVIDER_ERROR" }, { status: 502 });
          }
          const data = (await response.json()) as RemoteJob[];
          const jobs = data.slice(1, 51).map((job) => ({
            id: job.id,
            title: job.position ?? "Untitled role",
            company: job.company ?? null,
            platform: "RemoteOK",
            location: job.location ?? null,
            hourlyRateUsd: null,
            fixedBudgetUsd: job.salary_max ?? job.salary_min ?? null,
            skillsRequired: job.tags ?? [],
            matchScore: null,
            applicationStatus: "NOT_APPLIED" as const,
            description: job.description?.substring(0, 500) ?? "",
            url: job.url ?? null,
          }));
          return Response.json({ success: true, state: "REAL_PROVIDER_RESULT", jobs });
        } catch (error) {
          console.error("[FOUNDER JOBS] provider request failed:", error);
          return Response.json({ success: false, state: "PROVIDER_ERROR" }, { status: 502 });
        }
      },
    },
  },
});
