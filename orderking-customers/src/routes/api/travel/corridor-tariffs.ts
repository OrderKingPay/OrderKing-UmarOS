import { createFileRoute } from "@tanstack/react-router";
import {
  getCorridorTariff,
  getAllTopCorridors,
  warmCorridorCache,
  type CloudflareEdgeEnv,
} from "@/lib/travel/corridor-tariffs-cache";

export const Route = createFileRoute("/api/travel/corridor-tariffs")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const startTime = Date.now();
        try {
          const url = new URL(request.url);
          const corridorParam = url.searchParams.get("corridor") || "";
          const originParam = url.searchParams.get("origin") || "";
          const destParam = url.searchParams.get("destination") || "";
          const warmParam = url.searchParams.get("warm") === "true";

          // Cloudflare Worker / Pages edge environment bindings from request context
          const cfEnv: CloudflareEdgeEnv = (request as any).env || (globalThis as any) || {};

          // Warm cache endpoint for edge workers
          if (warmParam) {
            const warmRes = await warmCorridorCache(cfEnv);
            return new Response(JSON.stringify({ success: true, message: "Corridor edge cache warmed", ...warmRes }), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-store",
              },
            });
          }

          // Single corridor lookup
          if (corridorParam || (originParam && destParam)) {
            let orig = originParam;
            let dest = destParam;
            if (corridorParam && corridorParam.includes("-")) {
              const [cOrig, cDest] = corridorParam.split("-");
              orig = cOrig || orig;
              dest = cDest || dest;
            }

            const { tariff, cacheStatus, latencyMs } = await getCorridorTariff(orig, dest, cfEnv);
            const totalEdgeLatencyMs = Date.now() - startTime;

            return new Response(
              JSON.stringify({
                success: true,
                corridor: tariff.corridorId,
                cacheStatus,
                latencyMs: totalEdgeLatencyMs,
                tariff,
              }),
              {
                status: 200,
                headers: {
                  "Content-Type": "application/json",
                  "Cache-Control": "public, max-age=900, stale-while-revalidate=86400",
                  "X-OrderKing-Cache": cacheStatus,
                  "X-OrderKing-Corridor": tariff.corridorId,
                  "X-Edge-Response-Time-Ms": String(totalEdgeLatencyMs),
                },
              }
            );
          }

          // Return all top 50 domestic corridors
          const { tariffs, total } = await getAllTopCorridors(cfEnv);
          const totalEdgeLatencyMs = Date.now() - startTime;

          return new Response(
            JSON.stringify({
              success: true,
              total,
              latencyMs: totalEdgeLatencyMs,
              tariffs,
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=900, stale-while-revalidate=86400",
                "X-OrderKing-Cache": "BATCH_HIT",
                "X-Edge-Response-Time-Ms": String(totalEdgeLatencyMs),
              },
            }
          );
        } catch (error) {
          console.error("GET /api/travel/corridor-tariffs error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to retrieve corridor tariffs." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
