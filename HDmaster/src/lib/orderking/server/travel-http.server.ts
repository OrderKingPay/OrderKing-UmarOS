import { TravelOrchestrator } from "../travel/index.ts";

const DEFAULT_CUSTOMER_ORIGIN = "https://orderking-customers.vercel.app";

function allowedOrigins(): Set<string> {
    return new Set(
        [
            process.env.ORDERKING_CUSTOMER_ORIGIN?.trim(),
            DEFAULT_CUSTOMER_ORIGIN,
            "http://localhost:3000",
            "http://localhost:5173",
        ].filter(Boolean) as string[]
    );
}

export function travelCorsHeaders(request: Request, extra?: Record<string, string>): Headers {
    const headers = new Headers({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
        "Access-Control-Max-Age": "600",
        ...(extra || {}),
    });
    const origin = request.headers.get("Origin")?.trim();
    if (origin && allowedOrigins().has(origin)) {
        headers.set("Access-Control-Allow-Origin", origin);
        headers.set("Vary", "Origin");
    }
    return headers;
}

function json(request: Request, payload: unknown, status = 200, extra?: Record<string, string>) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: travelCorsHeaders(request, extra),
    });
}

export async function handleTravelHttp(request: Request, params: Record<string, string | undefined>) {
    void params;
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: travelCorsHeaders(request) });
    }

    if (request.method === "GET" && path.includes("search")) {
        const origin =
            (url.searchParams.get("origin") ||
                url.searchParams.get("originCode") ||
                "").trim().toUpperCase();
        const destination =
            (url.searchParams.get("destination") ||
                url.searchParams.get("destinationCode") ||
                "").trim().toUpperCase();
        const date =
            url.searchParams.get("date") ||
            url.searchParams.get("departureDate") ||
            "";
        const mode = (url.searchParams.get("mode") || "FLIGHT").toUpperCase();
        const passengersRaw = Number(url.searchParams.get("passengers") || 1);
        const passengers = Number.isFinite(passengersRaw) ? Math.max(1, Math.floor(passengersRaw)) : 1;
        const keyword =
            url.searchParams.get("keyword") ||
            url.searchParams.get("query") ||
            url.searchParams.get("train") ||
            undefined;

        const allowedModes = new Set(["FLIGHT", "TRAIN", "BUS", "HOTEL"]);
        if (!allowedModes.has(mode)) {
            return json(request, {
                error: "INVALID_TRAVEL_MODE",
                details: "Unsupported travel mode."
            }, 400);
        }

        if (!origin || !destination || !date) {
            return json(request, {
                error: "INVALID_TRAVEL_SEARCH",
                details: "origin/originCode, destination/destinationCode and date/departureDate are required."
            }, 400);
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return json(request, {
                error: "INVALID_TRAVEL_DATE",
                details: "Departure date must use YYYY-MM-DD."
            }, 400);
        }

        const today = new Date();
        const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        const requestedUtc = new Date(date + "T00:00:00.000Z");
        if (Number.isNaN(requestedUtc.getTime())) {
            return json(request, {
                error: "INVALID_TRAVEL_DATE",
                details: "Departure date is not a valid calendar date."
            }, 400);
        }
        if (requestedUtc < todayUtc) {
            return json(request, {
                error: "TRAVEL_DATE_IN_PAST",
                details: "Departure date cannot be in the past."
            }, 400);
        }

        const result = await TravelOrchestrator.search({
            mode: mode as any,
            originCode: origin,
            destinationCode: destination,
            departureDate: date,
            passengers,
            keyword
        });
        return json(request, result);
    }

    if (request.method === "POST" && path.includes("book")) {
        try {
            const body = await request.json();
            const result = await TravelOrchestrator.book(body);
            return json(request, result);
        } catch {
            return json(request, {
                success: false,
                status: "FAILED",
                error: "Invalid travel booking request body."
            }, 400);
        }
    }

    return json(request, { error: "Not Found" }, 404);
}
