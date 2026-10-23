import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Travel category customer-facing claims", () => {
  it("does not promise unverified connectivity, fares, real-time PNR, or booking fees", () => {
    const source = readFileSync(new URL("../components/fintech/travel-category-deck.tsx", import.meta.url), "utf8");
    for (const unverified of [
      "0% Intermediary Fee",
      "with 0% platform fee",
      "live GDS fares",
      "CRIS live charting & confirmation probability",
      "zero convenience markup",
      "connected: true",
    ]) {
      expect(source).not.toContain(unverified);
    }
    expect(source).toContain("In-app live PNR is unavailable");
    expect(source).toContain("Saved Trip References");
  });
});
