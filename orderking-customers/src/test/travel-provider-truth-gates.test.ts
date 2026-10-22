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
});
