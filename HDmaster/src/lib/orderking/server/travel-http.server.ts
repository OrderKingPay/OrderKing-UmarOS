import { TravelOrchestrator } from "../travel/index.ts";

export async function handleTravelHttp(request: Request, params: Record<string, string | undefined>) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "GET" && path.includes("search")) {
        const origin =
            url.searchParams.get("origin") ||
            url.searchParams.get("originCode") ||
            "";
        const destination =
            url.searchParams.get("destination") ||
            url.searchParams.get("destinationCode") ||
            "";
        const date =
            url.searchParams.get("date") ||
            url.searchParams.get("departureDate") ||
            "";
        const mode = (url.searchParams.get("mode") || "FLIGHT").toUpperCase() as any;
        const passengers = Math.max(1, Number(url.searchParams.get("passengers") || 1));

        if (!origin || !destination || !date) {
            return new Response(
                JSON.stringify({
                    error: "INVALID_TRAVEL_SEARCH",
                    details: "origin/originCode, destination/destinationCode and date/departureDate are required."
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const result = await TravelOrchestrator.search({
            mode,
            originCode: origin,
            destinationCode: destination,
            departureDate: date,
            passengers
        });
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "POST" && path.includes("book")) {
        const body = await request.json();
        const result = await TravelOrchestrator.book(body);
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: { "Content-Type": "application/json" } });
}
