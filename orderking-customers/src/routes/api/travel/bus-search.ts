import { createFileRoute } from "@tanstack/react-router";
import { searchLiveBuses } from "@/lib/travel/travel-connectors";
import { type BusSearchRequest } from "@/lib/travel/types";

export const Route = createFileRoute("/api/travel/bus-search")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Partial<BusSearchRequest>;
          const sourceCity = (body.sourceCity || "").trim();
          const destinationCity = (body.destinationCity || "").trim();
          const journeyDate = (body.journeyDate || "").trim();

          if (!sourceCity || !destinationCity) {
            return new Response(
              JSON.stringify({ error: "sourceCity and destinationCity are required (e.g. Bengaluru, Goa)." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (sourceCity.toLowerCase() === destinationCity.toLowerCase()) {
            return new Response(
              JSON.stringify({ error: "Source city and destination city cannot be identical." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const result = await searchLiveBuses({
            sourceCity,
            destinationCity,
            journeyDate: journeyDate || new Date().toISOString().split("T")[0],
            busType: body.busType,
          });

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60",
            },
          });
        } catch (error) {
          console.error("POST /api/travel/bus-search error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to perform bus search. Please try again." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
