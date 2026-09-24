import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computePromoDiscount, computeQuote, type FeeSchedule, type PricedCartLine } from "./pricing.ts";

const fees: FeeSchedule = {
  deliveryBasePaise: 2500,
  deliveryPerKmPaise: 800,
  deliveryFreeOverPaise: 39900,
  serviceFeePaise: 0,
  serviceFeeBps: 0,
  menuPricesIncludeTax: true,
  menuTaxBps: 500,
  serviceTaxBps: 1800,
  deliveryTaxBps: 0,
  minOrderPaise: 8000,
};

const line = (unitPaise: number, quantity = 1): PricedCartLine => ({
  key: "k",
  itemId: "i",
  variantId: "v",
  name: "Item",
  quantity,
  unitPaise,
  addons: [],
  instructions: "",
  available: true,
});

describe("pricing", () => {
  it("sums food, delivery and commission at 10%", () => {
    const q = computeQuote({
      lines: [line(20000), line(5000, 2)],
      packagingPaise: 0,
      commissionBps: 1000,
      distanceKm: 2,
      fees,
      promo: null,
      isFirstOrder: false,
    });
    assert.equal(q.foodSubtotalPaise, 30000);
    assert.equal(q.deliveryFeePaise, 2500 + 1600);
    assert.equal(q.totalPaise, 30000 + 4100);
    assert.equal(q.commissionPaise, 3000);
    assert.equal(q.restaurantPayablePaise, 27000);
    assert.equal(q.blockers.length, 0);
  });

  it("never lets the client invent a total — quote is derived", () => {
    const q = computeQuote({
      lines: [line(10000)],
      packagingPaise: 1000,
      commissionBps: 1000,
      distanceKm: 0,
      fees,
      promo: null,
      isFirstOrder: true,
    });
    const reconstructed =
      q.foodSubtotalPaise -
      q.restaurantDiscountPaise -
      q.platformDiscountPaise +
      q.packagingPaise +
      q.deliveryFeePaise +
      q.serviceFeePaise +
      q.taxPaise;
    assert.equal(q.totalPaise, reconstructed);
  });

  it("applies platform-funded discount without charging the kitchen", () => {
    const q = computeQuote({
      lines: [line(20000)],
      packagingPaise: 0,
      commissionBps: 1000,
      distanceKm: 1,
      fees,
      promo: {
        id: "p",
        code: "FIRST50",
        name: "First order",
        kind: "fixed",
        percentBps: null,
        amountPaise: 5000,
        minOrderPaise: 19900,
        maxDiscountPaise: null,
        fundedBy: "PLATFORM",
        firstOrderOnly: true,
      },
      isFirstOrder: true,
    });
    assert.equal(q.platformDiscountPaise, 5000);
    assert.equal(q.restaurantDiscountPaise, 0);
    assert.equal(q.commissionPaise, 2000);
    assert.equal(q.restaurantPayablePaise, 18000);
    assert.equal(q.totalPaise, 20000 - 5000 + 2500 + 800);
  });

  it("does not apply first-order promo on a repeat customer", () => {
    assert.equal(
      computePromoDiscount(25000, {
        id: "p",
        code: "FIRST50",
        name: "First",
        kind: "fixed",
        percentBps: null,
        amountPaise: 5000,
        minOrderPaise: 0,
        maxDiscountPaise: null,
        fundedBy: "PLATFORM",
        firstOrderOnly: true,
      }, false),
      0,
    );
  });

  it("waives delivery over the threshold", () => {
    const q = computeQuote({
      lines: [line(40000)],
      packagingPaise: 0,
      commissionBps: 1000,
      distanceKm: 5,
      fees,
      promo: null,
      isFirstOrder: false,
    });
    assert.equal(q.deliveryFeePaise, 0);
  });

  it("blocks under min order", () => {
    const q = computeQuote({
      lines: [line(2000)],
      packagingPaise: 0,
      commissionBps: 1000,
      distanceKm: 1,
      fees,
      promo: null,
      isFirstOrder: false,
    });
    assert.ok(q.blockers.includes("MIN_ORDER"));
    assert.equal(q.minOrderPaise, 8000);
  });

  it("splits shared funding", () => {
    const q = computeQuote({
      lines: [line(10000)],
      packagingPaise: 0,
      commissionBps: 1000,
      distanceKm: 0,
      fees: { ...fees, minOrderPaise: 0, deliveryFreeOverPaise: null },
      promo: {
        id: "s",
        code: "SHARE",
        name: "Shared",
        kind: "fixed",
        percentBps: null,
        amountPaise: 1000,
        minOrderPaise: 0,
        maxDiscountPaise: null,
        fundedBy: "SHARED",
        firstOrderOnly: false,
      },
      isFirstOrder: false,
    });
    assert.equal(q.restaurantDiscountPaise, 500);
    assert.equal(q.platformDiscountPaise, 500);
  });

  it("applies BOGO (Buy One Get One) discount correctly", () => {
    const q = computeQuote({
      lines: [
        {
          key: "item1",
          itemId: "i1",
          variantId: null,
          name: "Chicken Biryani",
          quantity: 2,
          unitPaise: 25000,
          addons: [],
          instructions: "",
          available: true,
        },
      ],
      packagingPaise: 0,
      commissionBps: 1000,
      distanceKm: 0,
      fees: { ...fees, minOrderPaise: 0, deliveryFreeOverPaise: null },
      promo: {
        id: "bogo1",
        code: "BOGO",
        name: "Buy 1 Get 1 Free",
        kind: "bogo",
        percentBps: null,
        amountPaise: null,
        minOrderPaise: 0,
        maxDiscountPaise: null,
        fundedBy: "RESTAURANT",
        firstOrderOnly: false,
      },
      isFirstOrder: false,
    });
    // For 2 biryanis at 250 each, 1 is free -> 25000 paise discount
    assert.equal(q.restaurantDiscountPaise, 25000);
    assert.equal(q.savingsPaise, 25000);
  });

  it("applies free delivery coupon correctly", () => {
    const q = computeQuote({
      lines: [line(10000)],
      packagingPaise: 0,
      commissionBps: 1000,
      distanceKm: 3,
      fees: { ...fees, minOrderPaise: 0, deliveryFreeOverPaise: null, deliveryBasePaise: 3000, deliveryPerKmPaise: 500 },
      promo: {
        id: "freedel",
        code: "FREEDEL",
        name: "Free Delivery Offer",
        kind: "free_delivery",
        percentBps: null,
        amountPaise: null,
        minOrderPaise: 5000,
        maxDiscountPaise: null,
        fundedBy: "PLATFORM",
        firstOrderOnly: false,
      },
      isFirstOrder: false,
    });
    // Normal delivery: 3000 + (3 * 500) = 4500 -> rounded to 4500
    // With FREEDEL promo: delivery is waived to 0
    assert.equal(q.deliveryFeePaise, 0);
    assert.ok(q.savingsPaise >= 4500);
  });

  it("calculates long-distance delivery fees (5-12 km) and enforces MOV", () => {
    // 8 km delivery (e.g. Nilambazar / Bombay Restaurant)
    // Base ₹50 + 8 * ₹8/km = ₹50 + ₹64 = ₹114 -> 11400 paise
    const qUnderMov = computeQuote({
      lines: [line(25000)], // ₹250 (< ₹499 MOV)
      packagingPaise: 0,
      commissionBps: 2800, // 28% long distance commission
      distanceKm: 8,
      fees,
      promo: null,
      isFirstOrder: false,
    });
    assert.ok(qUnderMov.blockers.includes("MIN_ORDER"));
    assert.equal(qUnderMov.deliveryFeePaise, 5000 + (8 * 800));

    const qValid = computeQuote({
      lines: [line(55000)], // ₹550 (>= ₹499 MOV)
      packagingPaise: 0,
      commissionBps: 2800,
      distanceKm: 8,
      fees,
      promo: null,
      isFirstOrder: false,
    });
    assert.equal(qValid.blockers.length, 0);
    assert.equal(qValid.commissionBps, 2800);
  });

  it("blocks long-distance deliveries during night safety curfew", () => {
    const qNightLong = computeQuote({
      lines: [line(60000)],
      packagingPaise: 0,
      commissionBps: 2800,
      distanceKm: 8, // Exceeds 3.5 km safe town radius
      fees: {
        ...fees,
        nightModeActive: true,
        nightModeRadiusKm: 3.5,
      },
      promo: null,
      isFirstOrder: false,
    });
    assert.ok(qNightLong.blockers.includes("NIGHT_SAFETY_CURFEW"));

    // In-town delivery (2 km) during night mode should be allowed
    const qNightTown = computeQuote({
      lines: [line(60000)],
      packagingPaise: 0,
      commissionBps: 2200,
      distanceKm: 2, // Within 3.5 km safe town radius
      fees: {
        ...fees,
        nightModeActive: true,
        nightModeRadiusKm: 3.5,
      },
      promo: null,
      isFirstOrder: false,
    });
    assert.equal(qNightTown.blockers.includes("NIGHT_SAFETY_CURFEW"), false);
  });

  it("blocks order with NO_RIDER_AVAILABLE when zone has no active riders", () => {
    const qNoRider = computeQuote({
      lines: [line(30000)],
      packagingPaise: 0,
      commissionBps: 2200,
      distanceKm: 3,
      fees: {
        ...fees,
        riderAvailable: false,
      },
      promo: null,
      isFirstOrder: false,
    });
    assert.ok(qNoRider.blockers.includes("NO_RIDER_AVAILABLE"));
  });

  it("enforces 3-tier delivery time windows: Day (25 km), Evening (8 km), Night (4 km)", () => {
    // 1. Daytime: 20 km is valid with ₹999 MOV, but 28 km is blocked
    const qDayValid = computeQuote({
      lines: [line(120000)], // ₹1,200 (> ₹999 MOV)
      packagingPaise: 0,
      commissionBps: 2800,
      distanceKm: 20, // Within 25 km day radius
      fees: {
        ...fees,
        dayModeRadiusKm: 25.0,
      },
      promo: null,
      isFirstOrder: false,
    });
    assert.equal(qDayValid.blockers.length, 0);

    const qDayExceeded = computeQuote({
      lines: [line(120000)],
      packagingPaise: 0,
      commissionBps: 2800,
      distanceKm: 28, // Exceeds 25 km day radius
      fees: {
        ...fees,
        dayModeRadiusKm: 25.0,
      },
      promo: null,
      isFirstOrder: false,
    });
    assert.ok(qDayExceeded.blockers.includes("EXCEEDS_MAX_RADIUS"));

    // 2. Evening (6 PM - 11 PM): 7 km is valid, 10 km is blocked
    const qEveningValid = computeQuote({
      lines: [line(55000)],
      packagingPaise: 0,
      commissionBps: 2800,
      distanceKm: 7, // Within 8 km evening limit
      fees: {
        ...fees,
        eveningModeActive: true,
        eveningModeRadiusKm: 8.0,
      },
      promo: null,
      isFirstOrder: false,
    });
    assert.equal(qEveningValid.blockers.includes("EVENING_DISTANCE_LIMIT"), false);

    const qEveningBlocked = computeQuote({
      lines: [line(55000)],
      packagingPaise: 0,
      commissionBps: 2800,
      distanceKm: 10, // Exceeds 8 km evening limit
      fees: {
        ...fees,
        eveningModeActive: true,
        eveningModeRadiusKm: 8.0,
      },
      promo: null,
      isFirstOrder: false,
    });
    assert.ok(qEveningBlocked.blockers.includes("EVENING_DISTANCE_LIMIT"));

    // 3. Night Curfew (11 PM - 4 AM): 3.5 km is valid, 6 km is blocked
    const qNightValid = computeQuote({
      lines: [line(40000)],
      packagingPaise: 0,
      commissionBps: 2200,
      distanceKm: 3.5, // Within 4.0 km night curfew limit
      fees: {
        ...fees,
        nightModeActive: true,
        nightModeRadiusKm: 4.0,
      },
      promo: null,
      isFirstOrder: false,
    });
    assert.equal(qNightValid.blockers.includes("NIGHT_SAFETY_CURFEW"), false);

    const qNightBlocked = computeQuote({
      lines: [line(40000)],
      packagingPaise: 0,
      commissionBps: 2800,
      distanceKm: 6.0, // Exceeds 4.0 km night curfew limit
      fees: {
        ...fees,
        nightModeActive: true,
        nightModeRadiusKm: 4.0,
      },
      promo: null,
      isFirstOrder: false,
    });
    assert.ok(qNightBlocked.blockers.includes("NIGHT_SAFETY_CURFEW"));
  });
});

