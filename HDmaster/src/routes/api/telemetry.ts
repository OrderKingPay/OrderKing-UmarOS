// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { logGeospatialTelemetry, type TelemetryPayload } from "@/lib/orderking/server/telemetry.server";
import { getSql } from "@/lib/db";

// @ts-ignore: Router tree is generated during build
export const Route = createFileRoute("/api/telemetry")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const authorization = request.headers.get("authorization")?.trim();
          const token = process.env.ORDERKING_SERVICE_TOKEN?.trim();
          if (!token || authorization !== `Bearer ${token}`) return new Response("Unauthorized", { status: 401 });
          const body = await request.json() as TelemetryPayload;
          const sql = await getSql();
          const rider = await sql.query<{ id: string; org_id: string }>(`select id, org_id from riders where id=$1 and org_id=$2 and data_mode='PRODUCTION' and status in ('ACTIVE','ONLINE','BUSY') limit 1`, [body.entityId, body.orgId]);
          if (body.entityType !== "RIDER" || !rider[0]) return new Response("Unverified rider telemetry", { status: 403 });
          
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
