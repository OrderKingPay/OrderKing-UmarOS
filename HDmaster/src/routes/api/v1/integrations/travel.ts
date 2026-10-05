import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/integrations/travel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { origin, destination, date, type } = await request.json();
          if (type !== "FLIGHT" && type !== "TRAIN") return Response.json({ error: "Invalid travel type" }, { status: 400 });
          const configured = type === "FLIGHT"
            ? process.env.TRAVEL_PROVIDER_ENABLED === "true" && Boolean(process.env.TRAVEL_API_KEY)
            : process.env.IRCTC_PROVIDER_ENABLED === "true" && Boolean(process.env.IRCTC_MERCHANT_KEY);
          if (!configured) {
            return Response.json({
              success: false, status: "PENDING_EXTERNAL_PROVIDER",
              origin, destination, date, type,
              message: "Travel provider is not connected; no itinerary or booking is simulated."
            }, { status: 503 });
          }
          return Response.json({
            success: false, status: "PENDING_PROVIDER_ADAPTER",
            message: "Provider credentials exist but verified live search/booking adapter is not connected."
          }, { status: 503 });
        } catch {
          return Response.json({ success: false, error: "Invalid travel request" }, { status: 400 });
        }
      },
    },
  },
});
