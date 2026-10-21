import { describe, it, expect } from "vitest";
import { queryAirports, queryStations } from "../components/fintech/travel-autosuggest";

describe("Human-Style Travel Auto-Suggest Matching Engine", () => {
  it("suggests Guwahati and Delhi when typing 1-3 characters ('Gau', 'Del')", () => {
    const gauResults = queryAirports("Gau");
    expect(gauResults.length).toBeGreaterThan(0);
    expect(gauResults.some((a) => a.code === "GAU" || a.city.toLowerCase().includes("guwahati"))).toBe(true);

    const delResults = queryAirports("Del");
    expect(delResults.length).toBeGreaterThan(0);
    expect(delResults[0].code).toBe("DEL");
    expect(delResults[0].city).toBe("New Delhi");
  });

  it("suggests Silchar and Siliguri when typing 'Sil' for railway stations", () => {
    const silResults = queryStations("Sil");
    expect(silResults.length).toBeGreaterThan(0);
    const names = silResults.map((s) => s.name.toLowerCase());
    const cities = silResults.map((s) => s.city.toLowerCase());
    const matchesSil = names.some((n) => n.includes("sil")) || cities.some((c) => c.includes("sil"));
    expect(matchesSil).toBe(true);
  });

  it("prioritizes exact IATA codes and IRCTC junction codes", () => {
    const bomAirport = queryAirports("BOM");
    expect(bomAirport[0].code).toBe("BOM");
    expect(bomAirport[0].city).toBe("Mumbai");

    const ndlsStation = queryStations("NDLS");
    expect(ndlsStation[0].code).toBe("NDLS");
    expect(ndlsStation[0].name).toBe("New Delhi");
  });

  it("returns default top hubs when query is empty", () => {
    const defaultAirports = queryAirports("");
    expect(defaultAirports.length).toBeGreaterThan(0);
    expect(defaultAirports.some((a) => a.code === "DEL")).toBe(true);

    const defaultStations = queryStations("");
    expect(defaultStations.length).toBeGreaterThan(0);
    expect(defaultStations.some((s) => s.code === "NDLS")).toBe(true);
  });
});
