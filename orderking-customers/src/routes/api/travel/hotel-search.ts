import { createFileRoute } from "@tanstack/react-router";
import { searchLiveHotels } from "@/lib/travel/travel-connectors";
import { type HotelSearchRequest } from "@/lib/travel/types";

export const Route = createFileRoute("/api/travel/hotel-search")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Partial<HotelSearchRequest>;
          const cityOrLocation = (body.cityOrLocation || "").trim();

          if (!cityOrLocation) {
            return new Response(
              JSON.stringify({ error: "cityOrLocation is required (e.g. Goa, Mumbai, Delhi)." }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const result = await searchLiveHotels({
            cityOrLocation,
            checkInDate: body.checkInDate || new Date().toISOString().split("T")[0],
            checkOutDate: body.checkOutDate,
            guests: Number(body.guests) || 2,
            rooms: Number(body.rooms) || 1,
          });

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60",
            },
          });
        } catch (error) {
          console.error("POST /api/travel/hotel-search error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to perform hotel search. Please try again." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
