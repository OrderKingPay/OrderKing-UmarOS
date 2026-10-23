import { afterEach, describe, expect, it, vi } from "vitest";
import { generateSovereignPnr, issueSovereignETicket, searchFlightQuotes, searchBusQuotes, searchCabQuotes } from "../lib/travel/in-app-booking-service";
import { readFileSync } from "node:fs";

const read = (file: string) => readFileSync(new URL(file, import.meta.url), "utf8");

describe("commercial claim safety", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("never exposes fabricated inventory in production mode", () => {
    vi.stubEnv("MODE", "production");
    expect(searchFlightQuotes()).toEqual([]);
    expect(searchBusQuotes()).toEqual([]);
    expect(searchCabQuotes()).toEqual([]);
  });

  it("blocks production synthetic references and browser-issued tickets", () => {
    vi.stubEnv("MODE", "production");
    expect(() => generateSovereignPnr("flight")).toThrow(/disabled/i);
    expect(() => issueSovereignETicket({} as never)).toThrow(/unavailable/i);
  });

  it("never claims unearned carrier rebates or gold rewards", () => {
    const code = read("../components/fintech/sovereign-travel-concierge.tsx");
    expect(code).not.toContain("goldMilligramsAccrued");
    expect(code).not.toContain("100% Partner Wholesale Rebate:");
    expect(code).not.toContain("Dominant legacy aggregators tack on");
    expect(code).toContain("OrderKing does not issue railway tickets");
  });

  it("never claims browser-generated tutor confirmations or HR delivery", () => {
    const code = read("../components/tutor-jobs/tutor-jobs-hub.tsx");
    expect(code).not.toContain("Session Confirmed!");
    expect(code).not.toContain("Application Submitted for Review.");
    expect(code).toContain("No verified employer is connected");
  });

  it("supports freeform Indian rail codes without secretly changing station", () => {
    const code = read("../components/fintech/supreme-kingpay-experience.tsx");
    expect(code).toContain("extractStationCode(trainFrom)");
    expect(code).toContain("extractStationCode(trainTo)");
    expect(code).toContain("searchAirportOptions");
    expect(code).toContain("searchStationOptions");
    expect(code).not.toContain('trainFrom.match(/\\(([A-Z0-9]+)\\)/)?.[1] || "NDLS"');
  });
});
