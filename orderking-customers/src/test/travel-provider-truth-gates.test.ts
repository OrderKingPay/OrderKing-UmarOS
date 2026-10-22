import { afterEach, describe, expect, it, vi } from "vitest";
import {
  searchLiveFlights,
  searchLiveTrains,
  searchLiveBuses,
  searchLiveHotels,
} from "../lib/travel/travel-connectors";

describe("travel supplier truth gates", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("never invents flights, railway seats, bus seats, or hotel rooms when providers are not connected", async () => {
    for (const key of [
      "DUFFEL_ACCESS_TOKEN", "DUFFEL_API_KEY", "VITE_DUFFEL_ACCESS_TOKEN",
      "KIWI_API_KEY", "TEQUILA_API_KEY", "VITE_TRAVEL_API_KEY",
      "TRAVELPAYOUTS_TOKEN", "AVIASALES_API_TOKEN",
      "REDBUS_API_KEY", "REDBUS_AUTH_KEY",
      "RAPIDAPI_KEY", "IRCTC_API_KEY", "CONFIRMTKT_API_KEY",
    ]) {
      vi.stubEnv(key, "");
    }

    const flights = await searchLiveFlights({
      origin: "DEL", destination: "BOM", departureDate: "2026-10-25",
    });
    const trains = await searchLiveTrains({
      fromStation: "SDAH", toStation: "BPB", travelDate: "2026-10-25",
    });
    const buses = await searchLiveBuses({
      sourceCity: "Delhi", destinationCity: "Jaipur", journeyDate: "2026-10-25",
    });
    const hotels = await searchLiveHotels({
      cityOrLocation: "Goa", checkInDate: "2026-10-25", checkOutDate: "2026-10-26",
    });

    for (const response of [flights, trains, buses, hotels]) {
      expect(response.success).toBe(false);
      expect(response.data).toEqual([]);
      expect(response.count).toBe(0);
    }
  });

  it("formats live Duffel v2 flight offer responses accurately when access token is provided", async () => {
    vi.stubEnv("DUFFEL_ACCESS_TOKEN", "duffel_test_mock_token_12345");

    const mockDuffelPayload = {
      data: {
        id: "orq_0000A1234",
        offers: [
          {
            id: "off_0000A5678",
            total_amount: "5420.00",
            total_currency: "INR",
            owner: {
              iata_code: "6E",
              name: "IndiGo Airlines",
            },
            slices: [
              {
                duration: "PT2H15M",
                segments: [
                  {
                    id: "seg_001",
                    operating_carrier: { iata_code: "6E", name: "IndiGo Airlines" },
                    operating_carrier_flight_number: "6E 204",
                    departing_at: "2026-10-25T06:00:00",
                    arriving_at: "2026-10-25T08:15:00",
                    aircraft: { name: "Airbus A321neo" },
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async (url: any, opts: any) => {
      if (String(url).includes("api.duffel.com/air/offer_requests")) {
        expect(opts?.headers?.["Authorization"]).toBe("Bearer duffel_test_mock_token_12345");
        expect(opts?.headers?.["Duffel-Version"]).toBe("v2");
        return {
          ok: true,
          status: 200,
          json: async () => mockDuffelPayload,
        } as any;
      }
      return { ok: false, status: 404 } as any;
    });

    try {
      const response = await searchLiveFlights({
        origin: "DEL",
        destination: "BOM",
        departureDate: "2026-10-25",
        passengers: 1,
      });

      expect(response.success).toBe(true);
      expect(response.source).toBe("duffel_v2");
      expect(response.count).toBe(1);
      expect(response.data[0].carrierCode).toBe("6E");
      expect(response.data[0].carrierName).toBe("IndiGo Airlines");
      expect(response.data[0].flightNumber).toBe("6E 204");
      expect(response.data[0].pricePaise).toBe(542000);
      expect(response.data[0].durationMinutes).toBe(135);
      expect(response.data[0].bookingUrl).toContain("off_0000A5678");
      expect(response.data[0].aircraftType).toBe("Airbus A321neo");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
