import { resilientFetch } from "../sre/resilient-fetch.ts";

export async function searchFlights(origin: string, destination: string, date: string) {
  const amadeusKey = process.env.AMADEUS_API_KEY;
  if (!amadeusKey) {
    return {
      error: "EXTERNAL_PROVIDER_BLOCKED: Missing Amadeus API credentials",
      details: "No credentials provided in the environment for Amadeus."
    };
  }

  try {
    const res = await resilientFetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${date}&adults=1`, {
      timeoutMs: 5000,
      fallbackResponse: { data: [] }, // Advanced fallback
      headers: {
        Authorization: `Bearer ${amadeusKey}`
      }
    });

    if (!res.ok) {
        return {
            error: "AMADEUS_API_ERROR",
            status: res.status,
            statusText: res.statusText
        };
    }
    const data = await res.json();
    return { flights: data };
  } catch (err: any) {
    return { error: "FETCH_FAILED", message: err.message };
  }
}

export async function bookFlight(flightOffer: any) {
  const amadeusKey = process.env.AMADEUS_API_KEY;
  if (!amadeusKey) {
    return {
      error: "EXTERNAL_PROVIDER_BLOCKED: Missing Amadeus API credentials",
      details: "No credentials provided in the environment for Amadeus."
    };
  }

  try {
    const res = await resilientFetch(`https://test.api.amadeus.com/v1/booking/flight-orders`, {
      method: "POST",
      timeoutMs: 8000,
      fallbackResponse: { error: "Booking service unavailable, please try again." }, // Advanced fallback
      headers: {
        Authorization: `Bearer ${amadeusKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ data: { type: "flight-order", flightOffers: [flightOffer] } })
    });
    
    if (!res.ok) {
        return {
            error: "AMADEUS_API_ERROR",
            status: res.status,
            statusText: res.statusText
        };
    }
    const data = await res.json();
    return { booking: data };
  } catch (err: any) {
    return { error: "FETCH_FAILED", message: err.message };
  }
}

export async function handleTravelHttp(request: Request, params: Record<string, string | undefined>) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "GET" && path.includes("search-flights")) {
        const origin = url.searchParams.get("origin") || "";
        const destination = url.searchParams.get("destination") || "";
        const date = url.searchParams.get("date") || "";
        const result = await searchFlights(origin, destination, date);
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
    }

    if (request.method === "POST" && path.includes("book-flight")) {
        const body = await request.json();
        const result = await bookFlight(body.flightOffer);
        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: { "Content-Type": "application/json" } });
}
