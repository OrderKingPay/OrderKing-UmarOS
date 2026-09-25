import type { TravelProvider } from "../provider-registry.ts";
import type {
  TravelMode,
  TravelSearchQuery,
  NormalizedTravelResult,
  TravelBookingRequest,
  TravelBookingResponse
} from "../schemas/travel-schemas.ts";
import { resilientFetch } from "../../sre/resilient-fetch.ts";

type AmadeusTokenResponse = {
  access_token?: string;
  expires_in?: number;
};

export class AmadeusFlightProvider implements TravelProvider {
  id = "amadeus_flight";
  name = "Amadeus Flight Provider";
  supportedModes: TravelMode[] = ["FLIGHT"];

  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  private get baseUrl(): string {
    return (process.env.AMADEUS_API_BASE_URL || "https://test.api.amadeus.com").replace(/\/$/, "");
  }

  isAvailable(): boolean {
    const hasCredentials = Boolean(process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET);
    const productionRequiresExplicitBase = process.env.VERCEL_ENV === "production";
    const hasExplicitBase = Boolean(process.env.AMADEUS_API_BASE_URL?.trim());
    return hasCredentials && (!productionRequiresExplicitBase || hasExplicitBase);
  }

  async searchLocations(keyword: string, limit = 12): Promise<Array<{
    code: string;
    name: string;
    city?: string;
    country?: string;
    subtype?: string;
  }>> {
    if (!this.isAvailable()) {
      throw new Error("Amadeus airport/city search requires configured API credentials and, in production, an explicit API base URL.");
    }

    const normalizedKeyword = keyword.trim();
    if (normalizedKeyword.length < 2) return [];

    const token = await this.getAccessToken();
    const params = new URLSearchParams({
      subType: "AIRPORT,CITY",
      keyword: normalizedKeyword,
      page: "1",
      offset: "0",
      "page[limit]": String(Math.min(Math.max(limit, 1), 30)),
    });

    const response = await resilientFetch(
      `${this.baseUrl}/v1/reference-data/locations?${params.toString()}`,
      {
        timeoutMs: 7000,
        headers: {
          Authorization: "Bearer " + token,
          Accept: "application/vnd.amadeus+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Amadeus location search failed with status ${response.status}.`);
    }

    const data = await response.json();
    if (!Array.isArray(data.data)) return [];

    return data.data
      .map((item: any) => ({
        code: String(item.iataCode || ""),
        name: String(item.name || item.address?.cityName || ""),
        city: String(item.address?.cityName || item.name || ""),
        country: String(item.address?.countryName || ""),
        subtype: String(item.subtype || ""),
      }))
      .filter((item: { code: string; name: string }) => item.code && item.name);
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.accessTokenExpiresAt - 30_000) {
      return this.accessToken;
    }

    const clientId = process.env.AMADEUS_API_KEY;
    const clientSecret = process.env.AMADEUS_API_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("Amadeus API credentials are not configured.");
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await resilientFetch(
      `${this.baseUrl}/v1/security/oauth2/token`,
      {
        method: "POST",
        timeoutMs: 8000,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    if (!response.ok) {
      throw new Error(`Amadeus authorization failed with status ${response.status}.`);
    }

    const token = (await response.json()) as AmadeusTokenResponse;
    if (!token.access_token) {
      throw new Error("Amadeus authorization returned no access token.");
    }

    this.accessToken = token.access_token;
    this.accessTokenExpiresAt = now + Math.max(60, token.expires_in || 900) * 1000;
    return token.access_token;
  }

  async search(
    query: TravelSearchQuery
  ): Promise<NormalizedTravelResult[] | { error: string; blocked: boolean; details?: string }> {
    if (!this.isAvailable()) {
      return {
        error: "EXTERNAL_PROVIDER_BLOCKED",
        blocked: true,
        details: "Amadeus API key, secret and an explicit production API base URL are required for genuine live flight search."
      };
    }

    const { originCode, destinationCode, departureDate, passengers } = query;
    if (!originCode || !destinationCode || !departureDate) {
      throw new Error("Origin, destination and departure date are required.");
    }

    const token = await this.getAccessToken();
    const params = new URLSearchParams({
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate,
      adults: String(Math.max(1, passengers)),
      currencyCode: "INR",
    });

    const response = await resilientFetch(
      `${this.baseUrl}/v2/shopping/flight-offers?${params.toString()}`,
      {
        timeoutMs: 10000,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Amadeus flight search failed with status ${response.status}.`);
    }

    const data = await response.json();
    if (!Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((offer: any) => {
      const itinerary = offer.itineraries?.[0];
      const segments = itinerary?.segments || [];
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];

      if (!firstSegment || !lastSegment) {
        throw new Error("Amadeus returned a flight offer without usable segment data.");
      }

      return {
        id: String(offer.id),
        providerId: this.id,
        mode: "FLIGHT",
        origin: {
          code: firstSegment.departure.iataCode,
          name: firstSegment.departure.iataCode,
        },
        destination: {
          code: lastSegment.arrival.iataCode,
          name: lastSegment.arrival.iataCode,
        },
        departureTime: firstSegment.departure.at,
        arrivalTime: lastSegment.arrival.at,
        carrier: {
          code: firstSegment.carrierCode,
          name: String(
            data.dictionaries?.carriers?.[firstSegment.carrierCode] ||
            firstSegment.carrierCode
          ),
        },
        price: {
          amount: Number(offer.price?.total || 0),
          currency: offer.price?.currency || "INR",
        },
        rawProviderData: offer,
      };
    });
  }

  async book(request: TravelBookingRequest): Promise<TravelBookingResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        status: "BLOCKED_BY_EXTERNAL_PROVIDER",
        error: "Amadeus API credentials are not configured."
      };
    }

    if (!request.rawProviderData) {
      return {
        success: false,
        status: "FAILED",
        error: "A genuine provider offer is required before booking."
      };
    }

    try {
      const token = await this.getAccessToken();
      const response = await resilientFetch(
        `${this.baseUrl}/v1/booking/flight-orders`,
        {
          method: "POST",
          timeoutMs: 15000,
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
        }
      );

      if (!response.ok) {
        return {
          success: false,
          status: "FAILED",
          error: `Amadeus booking failed with status ${response.status}.`
        };
      }

      const data = await response.json();
      return {
        success: true,
        status: "CONFIRMED",
        bookingId: data?.data?.id,
        pnr: data?.data?.associatedRecords?.[0]?.reference,
        message: "Booking was confirmed by the configured Amadeus provider."
      };
    } catch (err: any) {
      return {
        success: false,
        status: "FAILED",
        error: err instanceof Error ? err.message : "Amadeus booking failed."
      };
    }
  }
}
