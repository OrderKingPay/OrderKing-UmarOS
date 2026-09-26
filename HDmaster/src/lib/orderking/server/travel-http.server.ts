import { TravelOrchestrator } from "../travel/index.ts";
import {
  travelBookingRequestSchema,
  travelSearchQuerySchema,
} from "../travel/schemas/travel-schemas.ts";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function handleTravelHttp(
  request: Request,
  _params: Record<string, string | undefined>,
): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname.includes("/search")) {
    const parsed = travelSearchQuerySchema.safeParse({
      mode: (url.searchParams.get("mode") ?? "FLIGHT").toUpperCase(),
      originCode: url.searchParams.get("originCode") ?? url.searchParams.get("origin") ?? "",
      destinationCode:
        url.searchParams.get("destinationCode") ?? url.searchParams.get("destination") ?? "",
      departureDate: url.searchParams.get("departureDate") ?? url.searchParams.get("date") ?? "",
      returnDate: url.searchParams.get("returnDate") ?? undefined,
      passengers: Number(url.searchParams.get("passengers") ?? "1"),
      class: url.searchParams.get("class") ?? undefined,
    });

    if (!parsed.success) {
      return json({ error: "INVALID_TRAVEL_SEARCH", details: parsed.error.flatten() }, 400);
    }

    const result = await TravelOrchestrator.search(parsed.data);
    return json(result);
  }

  if (request.method === "POST" && url.pathname.includes("/book")) {
    const body = await request.json().catch(() => null);
    const parsed = travelBookingRequestSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: "INVALID_TRAVEL_BOOKING", details: parsed.error.flatten() }, 400);
    }

    return json(await TravelOrchestrator.book(parsed.data));
  }

  return json({ error: "Not Found" }, 404);
}
