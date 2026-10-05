import { createFileRoute } from "@tanstack/react-router";

type RemoteJob = {
  id: string | number;
  position?: string;
  location?: string;
  tags?: string[];
  description?: string;
  url?: string;
  salary_min?: number;
  salary_max?: number;
};

// @ts-ignore: Router tree is generated during build
export const Route = createFileRoute("/api/v1/founder/jobs")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const response = await fetch("https://remoteok.com/api", {
            headers: { "User-Agent": "OrderKing-UmarOS/1.0" },
          });
          if (!response.ok) return Response.json({ success: false, error: "Remote jobs provider unavailable" }, { status: 502 });
          const data = (await response.json()) as RemoteJob[];
          const jobs = data.slice(1).filter((job) => job?.id).map((job) => ({
            id: String(job.id),
            title: job.position ?? "Untitled remote role",
            platform: "RemoteOK",
            clientLocation: job.location ?? "Remote",
            salaryMinUsd: job.salary_min ?? null,
            salaryMaxUsd: job.salary_max ?? null,
            skillsRequired: job.tags ?? [],
            applicationStatus: "NOT_APPLIED",
            description: job.description?.slice(0, 500) ?? "",
            url: job.url ?? null,
          })).slice(0, 50);
          return Response.json({ success: true, jobs });
        } catch {
          return Response.json({ success: false, error: "Failed to fetch remote jobs" }, { status: 502 });
        }
      },
    },
  },
});
