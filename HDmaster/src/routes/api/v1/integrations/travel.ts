import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/integrations/travel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { origin, destination, date, type } = await request.json();

          if (type !== "FLIGHT" && type !== "TRAIN") {
            return Response.json({ error: "Invalid travel type" }, { status: 400 });
          }

          const providerConfigured =
            type === "FLIGHT"
              ? Boolean(process.env.TRAVEL_PROVIDER_ENABLED === "true" && process.env.TRAVEL_API_KEY)
              : Boolean(process.env.IRCTC_PROVIDER_ENABLED === "true" && process.env.IRCTC_MERCHANT_KEY);

          if (!providerConfigured) {
            return Response.json(
              {
                success: false,
                status: "PENDING_EXTERNAL_PROVIDER",
                origin,
                destination,
                date,
                type,
                message: "Travel provider is not connected. No itinerary or booking success is being simulated.",
              },
              { status: 503 },
            );
          }

          return Response.json(
            {
              success: false,
              status: "PENDING_PROVIDER_ADAPTER",
              message: "Provider credentials exist, but a verified provider adapter must be connected before live search/booking.",
            },
            { status: 503 },
          );
        } catch {
          return Response.json({ success: false, error: "Invalid travel request" }, { status: 400 });
        }
      },
    },
  },
});
