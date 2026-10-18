import { createFileRoute } from "@tanstack/react-router";
import { searchLiveTrains } from "@/lib/travel/travel-connectors";
import { type TrainSearchRequest } from "@/lib/travel/types";

export const Route = createFileRoute("/api/travel/train-search")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Partial<TrainSearchRequest>;
          const fromStation = (body.fromStation || "").trim().toUpperCase();
          const toStation = (body.toStation || "").trim().toUpperCase();
          const travelDate = (body.travelDate || "").trim();
          const quota = body.quota === "TQ" ? "TQ" : body.quota === "LD" ? "LD" : "GN";

          if (!fromStation || !toStation) {
            return new Response(
              JSON.stringify({ error: "fromStation and toStation are required (Railway station codes e.g. NDLS, CNB)." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (fromStation === toStation) {
            return new Response(
              JSON.stringify({ error: "fromStation and toStation cannot be identical." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const result = await searchLiveTrains({
            fromStation,
            toStation,
            travelDate: travelDate || new Date().toISOString().split("T")[0],
            quota,
          });

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60",
            },
          });
        } catch (error) {
          console.error("POST /api/travel/train-search error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to perform train search. Please try again." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
