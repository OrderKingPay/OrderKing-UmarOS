import { createAPIFileRoute } from "@tanstack/react-start/api";
import { AmadeusFlightProvider } from "@/lib/orderking/travel/providers/amadeus-flight-provider";
import { travelCorsHeaders } from "@/lib/orderking/server/travel-http.server";

export const APIRoute = createAPIFileRoute("/api/v1/travel/locations")({
  OPTIONS: async ({ request }) => new Response(null, { status: 204, headers: travelCorsHeaders(request) }),
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const mode = (url.searchParams.get("mode") || "FLIGHT").toUpperCase();
    const keyword = (url.searchParams.get("keyword") || "").trim();

    if (mode !== "FLIGHT") {
      return new Response(
        JSON.stringify({
          results: [],
          errors: [{
            error: "LOCATION_PROVIDER_UNAVAILABLE",
            details: "Live location lookup for this travel mode requires its authorized provider."
          }]
        }),
        { status: 200, headers: travelCorsHeaders(request) }
      );
    }

    if (keyword.length < 2) {
      return new Response(
        JSON.stringify({ results: [], errors: [] }),
        { status: 200, headers: travelCorsHeaders(request) }
      );
    }

    try {
      const provider = new AmadeusFlightProvider();
      if (!provider.isAvailable()) {
        return new Response(
          JSON.stringify({
            results: [],
            errors: [{
              error: "EXTERNAL_PROVIDER_BLOCKED",
              details: "Live airport/city search is unavailable until Amadeus API credentials are configured on the HDmaster server."
            }]
          }),
          { status: 200, headers: travelCorsHeaders(request) }
        );
      }

      const results = await provider.searchLocations(keyword, 12);
      return new Response(
        JSON.stringify({ results, errors: [] }),
        { status: 200, headers: travelCorsHeaders(request) }
      );
    } catch {
      return new Response(
        JSON.stringify({
          results: [],
          errors: [{
            error: "LOCATION_PROVIDER_ERROR",
            details: "The live airport/city provider did not return searchable locations."
          }]
        }),
        { status: 200, headers: travelCorsHeaders(request) }
      );
    }
  },
});
