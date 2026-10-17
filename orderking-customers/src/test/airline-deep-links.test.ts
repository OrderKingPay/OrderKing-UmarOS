import { describe, it, expect } from "vitest";
import {
  buildOfficialAirlineDeepLink,
  extractAirportCode,
} from "../lib/travel/airline-deep-links";

describe("Official Airline Deep Links & Route Parameter Resolver", () => {
  describe("extractAirportCode", () => {
    it("extracts 3-letter IATA code from parenthesized city names", () => {
      expect(extractAirportCode("New Delhi (DEL)")).toBe("DEL");
      expect(extractAirportCode("Mumbai (BOM)")).toBe("BOM");
      expect(extractAirportCode("Bengaluru (BLR)")).toBe("BLR");
      expect(extractAirportCode("Chennai (MAA)")).toBe("MAA");
    });

    it("handles direct 3-letter uppercase codes", () => {
      expect(extractAirportCode("DEL")).toBe("DEL");
      expect(extractAirportCode("BOM")).toBe("BOM");
      expect(extractAirportCode("ccu")).toBe("CCU");
    });

    it("resolves major Indian cities by name when parentheses are omitted", () => {
      expect(extractAirportCode("New Delhi")).toBe("DEL");
      expect(extractAirportCode("Mumbai")).toBe("BOM");
      expect(extractAirportCode("Bangalore")).toBe("BLR");
      expect(extractAirportCode("Kolkata")).toBe("CCU");
      expect(extractAirportCode("Hyderabad")).toBe("HYD");
    });

    it("falls back gracefully when string is unrecognized or empty", () => {
      expect(extractAirportCode("", "DEL")).toBe("DEL");
      expect(extractAirportCode("ZZZ", "BOM")).toBe("ZZZ");
    });
  });

  describe("buildOfficialAirlineDeepLink", () => {
    const defaultParams = {
      carrierCode: "6E",
      from: "New Delhi (DEL)",
      to: "Mumbai (BOM)",
      departureDate: "2026-11-15",
      passengers: 2,
      cabinClass: "Economy" as const,
    };

    it("builds valid direct deep-links for IndiGo (6E)", () => {
      const link = buildOfficialAirlineDeepLink(defaultParams);
      expect(link.carrierCode).toBe("6E");
      expect(link.carrierName).toBe("IndiGo Airlines");
      expect(link.portalName).toBe("goindigo.in");
      expect(link.portalBaseUrl).toBe("https://www.goindigo.in");
      expect(link.bookingUrl).toContain("https://www.goindigo.in/booking/flight-select.html");
      expect(link.bookingUrl).toContain("orCity=DEL");
      expect(link.bookingUrl).toContain("destCity=BOM");
      expect(link.bookingUrl).toContain("deptDate=2026-11-15");
      expect(link.bookingUrl).toContain("adt=2");
    });

    it("builds valid direct deep-links for Air India (AI) with cabin class", () => {
      const link = buildOfficialAirlineDeepLink({
        ...defaultParams,
        carrierCode: "AI",
        cabinClass: "Business",
        passengers: 1,
      });
      expect(link.carrierCode).toBe("AI");
      expect(link.carrierName).toBe("Air India");
      expect(link.portalName).toBe("airindia.com");
      expect(link.portalBaseUrl).toBe("https://www.airindia.com");
      expect(link.bookingUrl).toContain("https://www.airindia.com/in/en/book/flight-search.html");
      expect(link.bookingUrl).toContain("from=DEL");
      expect(link.bookingUrl).toContain("to=BOM");
      expect(link.bookingUrl).toContain("date=2026-11-15");
      expect(link.bookingUrl).toContain("adults=1");
      expect(link.bookingUrl).toContain("cabin=business");
    });

    it("builds valid direct deep-links for Akasa Air (QP)", () => {
      const link = buildOfficialAirlineDeepLink({
        ...defaultParams,
        carrierCode: "QP",
        passengers: 3,
      });
      expect(link.carrierCode).toBe("QP");
      expect(link.carrierName).toBe("Akasa Air");
      expect(link.portalName).toBe("akasaair.com");
      expect(link.portalBaseUrl).toBe("https://www.akasaair.com");
      expect(link.bookingUrl).toContain("https://www.akasaair.com/booking");
      expect(link.bookingUrl).toContain("origin=DEL");
      expect(link.bookingUrl).toContain("destination=BOM");
      expect(link.bookingUrl).toContain("departureDate=2026-11-15");
      expect(link.bookingUrl).toContain("adults=3");
    });

    it("builds valid direct deep-links for SpiceJet (SG)", () => {
      const link = buildOfficialAirlineDeepLink({
        ...defaultParams,
        carrierCode: "SG",
        passengers: 4,
      });
      expect(link.carrierCode).toBe("SG");
      expect(link.carrierName).toBe("SpiceJet");
      expect(link.portalName).toBe("spicejet.com");
      expect(link.portalBaseUrl).toBe("https://www.spicejet.com");
      expect(link.bookingUrl).toContain("https://www.spicejet.com/?origin=DEL&destination=BOM");
      expect(link.bookingUrl).toContain("departureDate=2026-11-15");
      expect(link.bookingUrl).toContain("adults=4");
    });

    it("clamps passenger counts between 1 and 9", () => {
      const minLink = buildOfficialAirlineDeepLink({ ...defaultParams, passengers: 0 });
      expect(minLink.passengers).toBe(1);

      const maxLink = buildOfficialAirlineDeepLink({ ...defaultParams, passengers: 20 });
      expect(maxLink.passengers).toBe(9);
    });
  });
});
