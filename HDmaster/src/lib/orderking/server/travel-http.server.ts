import { TravelOrchestrator } from "../travel/index.ts";

export async function handleTravelHttp(request: Request, params: Record<string, string | undefined>) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "GET" && path.includes("search")) {
        const origin = url.searchParams.get("origin") || "";
        const destination = url.searchParams.get("destination") || "";
        const date = url.searchParams.get("date") || "";
        const mode = (url.searchParams.get("mode") || "FLIGHT").toUpperCase() as any;

        const result = await TravelOrchestrator.search({
            mode,
            originCode: origin,
            destinationCode: destination,
            departureDate: date,
            passengers: 1
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
