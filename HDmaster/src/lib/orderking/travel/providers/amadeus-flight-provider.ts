import type { TravelProvider } from "../provider-registry.ts";
import type { TravelMode, TravelSearchQuery, NormalizedTravelResult, TravelBookingRequest, TravelBookingResponse } from "../schemas/travel-schemas.ts";
import { resilientFetch } from "../../sre/resilient-fetch.ts";

type AmadeusToken = { access_token: string; expires_at: number };
let tokenCache: AmadeusToken | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.AMADEUS_CLIENT_ID?.trim();
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("Amadeus OAuth credentials are not configured");

  if (tokenCache && tokenCache.expires_at > Date.now() + 30_000) return tokenCache.access_token;

  const res = await resilientFetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    timeoutMs: 8000,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!res.ok) throw new Error(`Amadeus OAuth failed with status ${res.status}`);
  const data = await res.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Amadeus OAuth response did not contain an access token");

  tokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + Math.max(60, data.expires_in ?? 0) * 1000,
  };
  return data.access_token;
}

export class AmadeusFlightProvider implements TravelProvider {
  id = "amadeus_flight";
  name = "Amadeus Flight Provider";
  supportedModes: TravelMode[] = ["FLIGHT"];

  isAvailable(): boolean {
    return Boolean(
      process.env.AMADEUS_CLIENT_ID?.trim() &&
      process.env.AMADEUS_CLIENT_SECRET?.trim(),
    );
  }

  async search(query: TravelSearchQuery): Promise<NormalizedTravelResult[] | { error: string; blocked: boolean; details?: string }> {
    if (!this.isAvailable()) {
      return {
        error: "EXTERNAL_PROVIDER_BLOCKED",
        blocked: true,
        details: "Amadeus OAuth credentials are not configured.",
      };
    }

    const token = await getAccessToken();
    const params = new URLSearchParams({
      originLocationCode: query.originCode,
      destinationLocationCode: query.destinationCode,
      departureDate: query.departureDate,
      adults: String(query.passengers),
      currencyCode: "INR",
      max: "250",
    });
    if (query.returnDate) params.set("returnDate", query.returnDate);
    if (query.class) params.set("travelClass", query.class.toUpperCase());

    const res = await resilientFetch(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?${params.toString()}`,
      { timeoutMs: 10_000, headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) throw new Error(`Amadeus search failed with status ${res.status}`);
    const data = await res.json() as { data?: Array<Record<string, unknown>> };
    if (!Array.isArray(data.data)) return [];

    return data.data.map((offer) => {
      const itineraries = offer.itineraries as Array<{ segments: Array<Record<string, any>> }>;
      const itinerary = itineraries?.[0];
      const segments = itinerary?.segments ?? [];
      const first = segments[0];
      const last = segments[segments.length - 1];
      if (!first || !last) throw new Error("Amadeus returned an invalid itinerary");

      const price = offer.price as { total?: string; currency?: string };
      const carrierCode = String(first.carrierCode ?? "");
      return {
        id: String(offer.id ?? crypto.randomUUID()),
        providerId: this.id,
        mode: "FLIGHT" as const,
        origin: { code: String(first.departure?.iataCode ?? query.originCode) },
        destination: { code: String(last.arrival?.iataCode ?? query.destinationCode) },
        departureTime: String(first.departure?.at),
        arrivalTime: String(last.arrival?.at),
        carrier: { code: carrierCode, name: carrierCode },
        price: { amount: Number(price.total ?? 0), currency: String(price.currency ?? "INR") },
        rawProviderData: offer,
      };
    });
  }

  async book(request: TravelBookingRequest): Promise<TravelBookingResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        status: "BLOCKED_BY_EXTERNAL_PROVIDER",
        error: "Amadeus OAuth credentials are not configured.",
      };
    }

    const token = await getAccessToken();
    const res = await resilientFetch("https://test.api.amadeus.com/v1/booking/flight-orders", {
      method: "POST",
      timeoutMs: 15_000,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "flight-order",
          flightOffers: [request.rawProviderData],
          travelers: request.passengerDetails,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, status: "FAILED", error: `Amadeus booking failed with status ${res.status}: ${body.slice(0, 500)}` };
    }

    const data = await res.json() as { data?: { id?: string; associatedRecords?: Array<{ reference?: string }> } };
    return {
      success: true,
      status: "CONFIRMED",
      bookingId: data.data?.id,
      pnr: data.data?.associatedRecords?.[0]?.reference,
    };
  }
}
