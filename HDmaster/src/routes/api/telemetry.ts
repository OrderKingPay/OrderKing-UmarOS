import { createAPIFileRoute } from "@tanstack/react-start/api";
import { logGeospatialTelemetry, type TelemetryPayload } from "@/lib/orderking/server/telemetry.server";

// Endpoints for ultra-fast telemetry pinging
export const APIRoute = createAPIFileRoute("/api/telemetry")({
  POST: async ({ request }) => {
    try {
      const body = await request.json() as TelemetryPayload;
      
      // Basic validation
      if (!body.orgId || !body.entityType || !body.entityId || body.lat === undefined || body.lng === undefined) {
        return new Response("Missing required geospatial fields", { status: 400 });
      }

      const result = await logGeospatialTelemetry(body);
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
