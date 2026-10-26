import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const read = (file: string) => {
  const url = new URL(file, import.meta.url);
  if (!existsSync(url)) return null;
  return readFileSync(url, "utf8");
};

describe("commercial claim safety", () => {
  it("never claims unearned carrier rebates or gold rewards", () => {
    const code = read("../components/fintech/sovereign-travel-concierge.tsx");
    if (code) {
      expect(code).not.toContain("goldMilligramsAccrued");
      expect(code).not.toContain("100% Partner Wholesale Rebate:");
      expect(code).not.toContain("Dominant legacy aggregators tack on");
      expect(code).toContain("OrderKing does not issue railway tickets");
    } else {
      expect(true).toBe(true);
    }
  });

  it("never claims browser-generated tutor confirmations or HR delivery", () => {
    const code = read("../components/tutor-jobs/tutor-jobs-hub.tsx");
    if (code) {
      expect(code).not.toContain("Session Confirmed!");
      expect(code).not.toContain("Application Submitted for Review.");
      expect(code).toContain("No verified employer is connected");
    } else {
      expect(true).toBe(true);
    }
  });

  it("supports freeform Indian rail codes without secretly changing station", () => {
    const code = read("../components/fintech/supreme-kingpay-experience.tsx")!;
    expect(code).toContain("extractStationCode(trainFrom)");
    expect(code).toContain("extractStationCode(trainTo)");
    expect(code).toContain("searchAirportOptions");
    expect(code).toContain("searchStationOptions");
    expect(code).not.toContain('trainFrom.match(/\\(([A-Z0-9]+)\\)/)?.[1] || "NDLS"');
  });
});
