import { createFileRoute } from "@tanstack/react-router";
import { searchDualEngineFlights, type DualEngineFlightRequest } from "@/lib/travel/dual-travel-engine";
import { getCorridorTariff, type CorridorTariff } from "@/lib/travel/corridor-tariffs-cache";
import { buildOfficialAirlineDeepLink } from "@/lib/travel/airline-deep-links";

export const Route = createFileRoute("/api/travel/flight-search")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const startTime = Date.now();
        try {
          const body = (await request.json().catch(() => ({}))) as Partial<DualEngineFlightRequest>;
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

          // Check Cloudflare Edge KV for corridor tariff cache
          const cfEnv = (request as any).env || (globalThis as any) || {};
          const corridorRes = await getCorridorTariff(origin, destination, cfEnv);
          const corridorTariff: CorridorTariff = corridorRes.tariff;
          const cacheStatus = corridorRes.cacheStatus;

          const result = await searchDualEngineFlights({
            origin,
            destination,
            departureDate: departureDate || new Date().toISOString().split("T")[0],
            passengers: Number(body.passengers) || 1,
            cabinClass: body.cabinClass === "BUSINESS" || body.cabinClass === "Business" ? "BUSINESS" : "ECONOMY",
            isForeignCard: Boolean(body.isForeignCard),
            preferredEngine: body.preferredEngine,
          });

          // Never fabricate flight schedules or seat counts when live carrier APIs return 0 offers.
          // Return an honest empty offer list with direct official airline portals and benchmark corridor tariff.
          const dateStr = departureDate || new Date().toISOString().split("T")[0];
          const directCarrierPortals = ["6E", "AI", "QP", "SG"].map((carrierCode) => ({
            carrierCode,
            bookingUrl: buildOfficialAirlineDeepLink({
              carrierCode,
              from: origin,
              to: destination,
              departureDate: dateStr,
              passengers: Number(body.passengers) || 1,
              cabinClass: body.cabinClass || "Economy",
            }).bookingUrl,
          }));

          const responseData = {
            ...result,
            data: result.data ?? [],
            count: result.data?.length ?? 0,
            directCarrierPortals,
            corridorTariff,
            edgeCache: {
              status: cacheStatus,
              corridor: corridorTariff.corridorId,
              source: corridorTariff.cacheMeta.source,
              cachedAt: corridorTariff.cacheMeta.cachedAt,
              ttlSeconds: corridorTariff.cacheMeta.ttlSeconds,
            },
          };

          const latencyMs = Date.now() - startTime;

          return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=900, stale-while-revalidate=86400",
              "X-OrderKing-Cache": cacheStatus,
              "X-OrderKing-Corridor": corridorTariff.corridorId,
              "X-Edge-Response-Time-Ms": String(latencyMs),
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
