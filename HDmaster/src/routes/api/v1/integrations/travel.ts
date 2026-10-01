import { createFileRoute } from "@tanstack/react-router";

// Travelpayouts Affiliate Implementation
// Replaces Amadeus to remove production compliance blockers and test API limitations.
export const Route = createFileRoute("/api/v1/integrations/travel")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        const { requireUserId } = await import("@/lib/auth/verify.server");
        try {
          await requireUserId();
          const body = await request.json();
          const type = String(body?.type || "").toUpperCase();
          const origin = String(body?.origin || "").trim().toUpperCase();
          const destination = String(body?.destination || "").trim().toUpperCase();
          const date = String(body?.date || "").trim();

          if (!origin || !destination || !date) {
            return Response.json({ success: false, status: "INVALID_REQUEST", message: "origin, destination and date are required." }, { status: 400 });
          }

          if (type === "FLIGHT") {
            // Provide a Travelpayouts affiliate URL for flight search
            const affiliateMarker = process.env.TRAVELPAYOUTS_MARKER || "orderking_default";
            const tpUrl = `https://search.travelpayouts.com/flights/?origin=${origin}&destination=${destination}&depart_date=${date}&adults=${Math.max(1, Number(body?.adults || 1))}&children=0&infants=0&trip_class=0&marker=${affiliateMarker}`;
            
            return Response.json({ 
              success: true, 
              provider: "TRAVELPAYOUTS", 
              redirectUrl: tpUrl,
              data: {
                message: "Flight searches are processed via our partner Travelpayouts."
              }
            });
          }

          if (type === "TRAIN") {
            return Response.json({ success: false, status: "PROVIDER_ADAPTER_REQUIRED", message: "IRCTC B2B adapter requires compliance verification." }, { status: 503 });
          }

          return Response.json({ success: false, status: "INVALID_TRAVEL_TYPE" }, { status: 400 });
        } catch (error: any) {
          if (error?.message === "Unauthorized") return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
          return Response.json({ success: false, error: error?.message || "Travel provider request failed." }, { status: 503 });
        }
      },
    },
  },
});

