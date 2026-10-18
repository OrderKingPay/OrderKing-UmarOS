import { createFileRoute } from "@tanstack/react-router";
import { searchLiveFlights } from "@/lib/travel/travel-connectors";
import { type FlightSearchRequest } from "@/lib/travel/types";

export const Route = createFileRoute("/api/travel/flight-search")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Partial<FlightSearchRequest>;
          const origin = (body.origin || "").trim().toUpperCase();
          const destination = (body.destination || "").trim().toUpperCase();
          const departureDate = (body.departureDate || "").trim();

          if (!origin || !destination) {
            return new Response(
              JSON.stringify({ error: "origin and destination are required (IATA codes e.g. DEL, BOM)." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (origin === destination) {
            return new Response(
              JSON.stringify({ error: "Origin and destination cannot be identical." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const result = await searchLiveFlights({
            origin,
            destination,
            departureDate: departureDate || new Date().toISOString().split("T")[0],
            passengers: Number(body.passengers) || 1,
            cabinClass: body.cabinClass === "BUSINESS" ? "BUSINESS" : "ECONOMY",
          });

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60",
            },
          });
        } catch (error) {
          console.error("POST /api/travel/flight-search error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to perform flight search. Please try again." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
