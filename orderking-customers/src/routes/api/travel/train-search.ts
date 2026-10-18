import { createFileRoute } from "@tanstack/react-router";
import { searchTrainQuotes } from "@/lib/travel/in-app-booking-service";

export const Route = createFileRoute("/api/travel/train-search")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const from = url.searchParams.get("from") || "New Delhi (NDLS)";
          const to = url.searchParams.get("to") || "Mumbai Central (MMCT)";
          const date = url.searchParams.get("date") || url.searchParams.get("journeyDate") || new Date().toISOString().split("T")[0];
          const rawQuota = url.searchParams.get("quota") || "GENERAL (GN)";
          const quota = (rawQuota === "TATKAL (TQ)" || rawQuota === "LADIES (LD)" ? rawQuota : "GENERAL (GN)") as "GENERAL (GN)" | "TATKAL (TQ)" | "LADIES (LD)";
          const rawClass = url.searchParams.get("trainClass") || url.searchParams.get("class") || "3A";
          const validClasses = ["1A", "2A", "3A", "CC", "EC", "SL"];
          const trainClass = (validClasses.includes(rawClass) ? rawClass : "3A") as "1A" | "2A" | "3A" | "CC" | "EC" | "SL";
          const passengers = Math.max(1, Math.min(6, parseInt(url.searchParams.get("passengers") || "1", 10) || 1));

          const quotes = searchTrainQuotes(from, to, date, quota, trainClass);

          return new Response(
            JSON.stringify({
              success: true,
              from,
              to,
              date,
              quota,
              trainClass,
              passengers,
              count: quotes.length,
              data: quotes,
              disclaimer: "Official Indian Railways CRIS fare pass-through. Zero agent surcharge.",
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=60, s-maxage=120",
              },
            }
          );
        } catch {
          return new Response(
            JSON.stringify({ success: false, error: "Failed to process train search query." }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
            }
          );
        }
      },
    },
  },
});
