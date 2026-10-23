import { describe, expect, it, vi, afterEach } from "vitest";
import {
  INDIAN_AIRPORT_IATAS,
  isIndianAirport,
  isDomesticIndianRoute,
  isInternationalRoute,
  resolveTravelEngine,
  generateTravelpayoutsDomesticLink,
  generateIrctcTrainAssistanceLink,
  generateRedBusDomesticLink,
  generateDuffelInternationalLink,
  searchDualEngineFlights,
} from "../lib/travel/dual-travel-engine";

describe("Sovereign Dual-Engine Travel Architecture", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Airport & Route Classification", () => {
    it("recognizes all major Indian domestic airports", () => {
      const sampleAirports = ["DEL", "BOM", "BLR", "MAA", "HYD", "CCU", "GOI", "GOX", "PNQ", "JAI", "COK", "AYJ"];
      for (const iata of sampleAirports) {
        expect(isIndianAirport(iata)).toBe(true);
        expect(isIndianAirport(iata.toLowerCase())).toBe(true);
      }
      expect(INDIAN_AIRPORT_IATAS.length).toBeGreaterThanOrEqual(60);
    });

    it("correctly identifies foreign international airports as non-Indian", () => {
      const foreignAirports = ["DXB", "LHR", "JFK", "SIN", "BKK", "DOH", "KUL", "FRA", "CDG", "HND"];
      for (const iata of foreignAirports) {
        expect(isIndianAirport(iata)).toBe(false);
      }
    });

    it("identifies domestic Indian corridors", () => {
      expect(isDomesticIndianRoute("DEL", "BOM")).toBe(true);
      expect(isDomesticIndianRoute("New Delhi (DEL)", "Mumbai (BOM)")).toBe(true);
      expect(isDomesticIndianRoute("BLR", "CCU")).toBe(true);
      expect(isDomesticIndianRoute("HYD", "GOI")).toBe(true);
      expect(isInternationalRoute("DEL", "BOM")).toBe(false);
    });

    it("identifies international flight corridors", () => {
      expect(isDomesticIndianRoute("DEL", "DXB")).toBe(false);
      expect(isInternationalRoute("DEL", "DXB")).toBe(true);
      expect(isInternationalRoute("Mumbai (BOM)", "London Heathrow (LHR)")).toBe(true);
      expect(isInternationalRoute("Singapore (SIN)", "Bengaluru (BLR)")).toBe(true);
      expect(isInternationalRoute("JFK", "LHR")).toBe(true);
    });
  });

  describe("Dual-Engine Resolution Engine", () => {
    it("routes domestic Indian sectors to Travelpayouts Domestic Network with INR settlement", () => {
      const res = resolveTravelEngine({
        origin: "DEL",
        destination: "BOM",
        isForeignCard: false,
      });

      expect(res.engine).toBe("TRAVELPAYOUTS_DOMESTIC");
      expect(res.engineName).toBe("Travelpayouts Domestic Network");
      expect(res.isDomestic).toBe(true);
      expect(res.settlementCurrency).toBe("INR");
      expect(res.clearingMode).toBe("DIRECT_DOMESTIC_CARRIER");
      expect(res.supportedPaymentMethods).toContain("UPI Instant (Google Pay, PhonePe, Paytm, BHIM)");
      expect(res.supportedPaymentMethods).toContain("RuPay Debit & Credit Cards");
      expect(res.supportedPaymentMethods).toContain("NetBanking (All Indian Scheduled Banks)");
    });

    it("routes international sectors to Duffel International GDS Engine with multi-currency clearing", () => {
      const res = resolveTravelEngine({
        origin: "DEL",
        destination: "DXB",
        isForeignCard: false,
      });

      expect(res.engine).toBe("DUFFEL_INTERNATIONAL");
      expect(res.engineName).toBe("Duffel International GDS");
      expect(res.isDomestic).toBe(false);
      expect(res.settlementCurrency).toBe("USD");
      expect(res.clearingMode).toBe("IATA_NDC_INTERNATIONAL");
      expect(res.supportedPaymentMethods).toContain("International Credit Cards (Visa / Mastercard)");
      expect(res.supportedPaymentMethods).toContain("American Express");
      expect(res.supportedPaymentMethods).toContain("Multi-Currency Foreign Cards");
    });

    it("automatically shifts domestic routes to Duffel when foreign card processing is flagged", () => {
      const res = resolveTravelEngine({
        origin: "DEL",
        destination: "BOM",
        isForeignCard: true,
      });

      expect(res.engine).toBe("DUFFEL_INTERNATIONAL");
      expect(res.engineName).toBe("Duffel International GDS");
      expect(res.clearingMode).toBe("IATA_NDC_INTERNATIONAL");
      expect(res.supportedPaymentMethods).toContain("American Express");
    });

    it("honors explicit preferredEngine override", () => {
      const forceDuffel = resolveTravelEngine({
        origin: "DEL",
        destination: "BOM",
        preferredEngine: "duffel",
      });
      expect(forceDuffel.engine).toBe("DUFFEL_INTERNATIONAL");

      const forceTravelpayouts = resolveTravelEngine({
        origin: "DEL",
        destination: "DXB",
        preferredEngine: "travelpayouts",
      });
      expect(forceTravelpayouts.engine).toBe("TRAVELPAYOUTS_DOMESTIC");
    });
  });

  describe("Direct Deep-Link Generators", () => {
    it("generates authentic Travelpayouts / Aviasales domestic aggregator links", () => {
      const link = generateTravelpayoutsDomesticLink({
        origin: "DEL",
        destination: "BOM",
        departureDate: "2026-11-15",
        passengers: 2,
        currency: "INR",
        marker: "482910",
      });

      expect(link.engine).toBe("TRAVELPAYOUTS_DOMESTIC");
      expect(link.url).toContain("https://www.aviasales.com/search/DEL1511BOM2");
      expect(link.url).toContain("marker=482910");
      expect(link.url).toContain("currency=inr");
      expect(link.originCode).toBe("DEL");
      expect(link.destinationCode).toBe("BOM");
    });

    it("generates IRCTC train assistance deep links with ISO dates", () => {
      const train = generateIrctcTrainAssistanceLink("NDLS", "MMCT", "2026-11-20");
      expect(train.engine).toBe("TRAVELPAYOUTS_DOMESTIC");
      expect(train.officialUrl).toContain("https://www.irctc.co.in/nget/train-search");
      expect(train.officialUrl).toContain("from=NDLS");
      expect(train.officialUrl).toContain("to=MMCT");
      expect(train.officialUrl).toContain("date=2026-11-20");
    });

    it("generates redBus domestic bus links with URL encoded cities", () => {
      const bus = generateRedBusDomesticLink("Bengaluru (Majestic)", "Goa (Panaji)", "2026-11-22");
      expect(bus.engine).toBe("TRAVELPAYOUTS_DOMESTIC");
      expect(bus.url).toContain("https://www.redbus.in/bus-tickets/bengaluru-to-goa?onward=2026-11-22");
    });

    it("generates Duffel International links for IATA offers", () => {
      const offerLink = generateDuffelInternationalLink("off_0000Abc123Xyz");
      expect(offerLink).toBe("https://links.duffel.com/air/offers/off_0000Abc123Xyz");

      const emptyLink = generateDuffelInternationalLink("");
      expect(emptyLink).toBe("https://duffel.com");
    });
  });

  describe("searchDualEngineFlights Truth Gate Compliance", () => {
    it("returns zero synthetic inventory when live supplier tokens are absent", async () => {
      // Unset all provider keys to verify truth gates
      for (const key of [
        "DUFFEL_ACCESS_TOKEN", "DUFFEL_API_KEY", "VITE_DUFFEL_ACCESS_TOKEN",
        "KIWI_API_KEY", "TEQUILA_API_KEY", "VITE_TRAVEL_API_KEY",
        "TRAVELPAYOUTS_TOKEN", "AVIASALES_API_TOKEN",
      ]) {
        vi.stubEnv(key, "");
      }

      const domesticRes = await searchDualEngineFlights({
        origin: "DEL",
        destination: "BOM",
        departureDate: "2026-11-25",
        passengers: 1,
      });

      expect(domesticRes.engine).toBe("TRAVELPAYOUTS_DOMESTIC");
      expect(domesticRes.resolution.isDomestic).toBe(true);
      expect(domesticRes.success).toBe(false);
      expect(domesticRes.count).toBe(0);
      expect(domesticRes.data).toEqual([]);
      // Crucial: Direct official carrier links must be provided for zero-markup fallback
      expect(domesticRes.directCarrierLinks.length).toBe(4);
      expect(domesticRes.directCarrierLinks.map((c) => c.carrierCode)).toEqual(["6E", "AI", "QP", "SG"]);

      const intlRes = await searchDualEngineFlights({
        origin: "DEL",
        destination: "DXB",
        departureDate: "2026-11-25",
        passengers: 1,
      });

      expect(intlRes.engine).toBe("DUFFEL_INTERNATIONAL");
      expect(intlRes.resolution.isDomestic).toBe(false);
      expect(intlRes.success).toBe(false);
      expect(intlRes.count).toBe(0);
      expect(intlRes.data).toEqual([]);
      expect(intlRes.directCarrierLinks.length).toBe(4);
      expect(intlRes.directCarrierLinks.map((c) => c.carrierCode)).toEqual(["AI", "EK", "QR", "SQ"]);
    });
  });
});
