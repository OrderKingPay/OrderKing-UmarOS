import { describe, it, expect } from "vitest";
import {
  calculateSovereignFareBreakdown,
  LIVE_BENCHMARK_QUOTES,
} from "../lib/travel/sovereign-travel-engine";

describe("Sovereign Travel Engine - Mathematical Zero-Mock Fares", () => {
  it("calculates direct airline fare with strictly 0 platform fee and exact partner rebate", () => {
    const flightQuote = LIVE_BENCHMARK_QUOTES.find((q) => q.mode === "flight")!;
    expect(flightQuote).toBeDefined();

    const breakdown = calculateSovereignFareBreakdown(flightQuote, 1, "24k_gold", 7500);

    // Platform desk fee must be strictly 0 paise
    expect(breakdown.orderKingDeskFeePaise).toBe(0);

    // Customer gross checkout is base + taxes
    expect(breakdown.grossCheckoutPaise).toBe(
      flightQuote.baseFarePaise + flightQuote.carrierTaxesPaise
    );

    // Instant savings equals the avoided OTA convenience markup
    expect(breakdown.instantCashSavingsPaise).toBe(flightQuote.otaBenchmarkFeePaise);

    // Rebate formula: floor((base * bps) / 10,000)
    const expectedRebatePaise = Math.floor(
      (flightQuote.baseFarePaise * flightQuote.partnerRebateBps) / 10_000
    );
    expect(breakdown.partnerRebatePaiseTotal).toBe(expectedRebatePaise);

    // Total advantage = OTA markup + partner rebate
    expect(breakdown.totalCustomerAdvantagePaise).toBe(
      breakdown.instantCashSavingsPaise + breakdown.partnerRebatePaiseTotal
    );

    // Gold reward in mg
    expect(breakdown.goldMilligramsAccrued).toBeGreaterThan(0);
  });

  it("calculates multiple passengers without floating-point drift", () => {
    const busQuote = LIVE_BENCHMARK_QUOTES.find((q) => q.mode === "bus")!;
    expect(busQuote).toBeDefined();

    const passengers = 4;
    const breakdown = calculateSovereignFareBreakdown(busQuote, passengers, "food_wallet");

    expect(breakdown.passengers).toBe(4);
    expect(breakdown.baseFarePaiseTotal).toBe(busQuote.baseFarePaise * 4);
    expect(breakdown.taxesPaiseTotal).toBe(busQuote.carrierTaxesPaise * 4);
    expect(breakdown.orderKingDeskFeePaise).toBe(0);
    expect(breakdown.instantCashSavingsPaise).toBe(busQuote.otaBenchmarkFeePaise * 4);
    expect(breakdown.foodWalletPaiseAccrued).toBe(breakdown.partnerRebatePaiseTotal);
  });

  it("calculates hotel stay with wholesale rebate pass-through", () => {
    const hotelQuote = LIVE_BENCHMARK_QUOTES.find((q) => q.mode === "hotel")!;
    expect(hotelQuote).toBeDefined();

    const breakdown = calculateSovereignFareBreakdown(hotelQuote, 1, "24k_gold");

    expect(breakdown.orderKingDeskFeePaise).toBe(0);
    expect(breakdown.partnerRebatePaiseTotal).toBeGreaterThan(0);
    expect(breakdown.effectiveNetCostPaise).toBeLessThan(breakdown.grossCheckoutPaise);
  });
});
