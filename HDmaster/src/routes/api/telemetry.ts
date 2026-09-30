// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { logGeospatialTelemetry, type TelemetryPayload } from "@/lib/orderking/server/telemetry.server";

// @ts-ignore: Router tree is generated during build
export const Route = createFileRoute("/api/telemetry")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
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
    },
  },
});
