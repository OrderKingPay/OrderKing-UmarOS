import type { TravelProvider } from "../provider-registry.ts";
import type { TravelMode, TravelSearchQuery, NormalizedTravelResult, TravelBookingRequest, TravelBookingResponse } from "../schemas/travel-schemas.ts";
import { resilientFetch } from "../../sre/resilient-fetch.ts";

export class AmadeusFlightProvider implements TravelProvider {
  id = "amadeus_flight";
  name = "Amadeus Flight Provider";
  supportedModes: TravelMode[] = ["FLIGHT"];

  isAvailable(): boolean {
    // Fail-secure: Do not invent flights if credentials are missing
    return !!process.env.AMADEUS_API_KEY;
  }

  async search(query: TravelSearchQuery): Promise<NormalizedTravelResult[] | { error: string, blocked: boolean, details?: string }> {
    if (!this.isAvailable()) {
       return { error: "EXTERNAL_PROVIDER_BLOCKED", blocked: true, details: "Amadeus API credentials missing in production environment." };
    }

    const { originCode, destinationCode, departureDate, passengers } = query;
    const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${originCode}&destinationLocationCode=${destinationCode}&departureDate=${departureDate}&adults=${passengers}`;

    try {
      const res = await resilientFetch(url, {
        timeoutMs: 8000,
        headers: {
          Authorization: `Bearer ${process.env.AMADEUS_API_KEY}`
        }
      });

      if (!res.ok) {
        throw new Error(`Amadeus Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (!data.data) return [];

      return data.data.map((offer: any) => {
        // Map Amadeus schema to OrderKing Normalized Schema
        const itinerary = offer.itineraries[0];
        const firstSegment = itinerary.segments[0];
        const lastSegment = itinerary.segments[itinerary.segments.length - 1];

        return {
          id: offer.id,
          providerId: this.id,
          mode: "FLIGHT",
          origin: {
            code: firstSegment.departure.iataCode
          },
          destination: {
            code: lastSegment.arrival.iataCode
          },
          departureTime: firstSegment.departure.at,
          arrivalTime: lastSegment.arrival.at,
          carrier: {
            code: firstSegment.carrierCode,
            name: firstSegment.carrierCode // Ideally mapped to a dictionary
          },
          price: {
            amount: parseFloat(offer.price.total),
            currency: offer.price.currency
          },
          rawProviderData: offer
        };
      });

    } catch (err: any) {
      throw new Error(`Failed to fetch flights from Amadeus: ${err.message}`);
    }
  }

  async book(request: TravelBookingRequest): Promise<TravelBookingResponse> {
    if (!this.isAvailable()) {
      return { success: false, status: "BLOCKED_BY_EXTERNAL_PROVIDER", error: "Amadeus API credentials missing in production environment." };
    }

    try {
      const res = await resilientFetch(`https://test.api.amadeus.com/v1/booking/flight-orders`, {
        method: "POST",
        timeoutMs: 10000,
        headers: {
          Authorization: `Bearer ${process.env.AMADEUS_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: {
            type: "flight-order",
            flightOffers: [request.rawProviderData],
            travelers: request.passengerDetails
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Booking failed with status ${res.status}`);
      }

      const data = await res.json();
      
      return {
        success: true,
        status: "CONFIRMED",
        bookingId: data.data.id,
        pnr: data.data.associatedRecords?.[0]?.reference
      };
    } catch (err: any) {
      return { success: false, status: "FAILED", error: err.message };
    }
  }
}
