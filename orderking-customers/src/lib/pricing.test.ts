
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computePromoDiscount,
  computeQuote,
  calculatePaymentGatewayFee,
  validateDeliveryTakeRate,
  STANDARD_DELIVERY_COMMISSION_BPS,
  MIN_DELIVERY_COMMISSION_BPS,
  MAX_DELIVERY_COMMISSION_BPS,
  DINE_IN_TABLE_QR_COMMISSION_BPS,
  PAYMENT_GATEWAY_CONFIG,
  type FeeSchedule,
  type PricedCartLine,
} from "./pricing.ts";

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
  platformFeePaise: 0,
  smallCartFeePaise: 0,
  useDistanceSlabs: false,
  peakSurgeActive: false,
  lateNightSurgeActive: false,
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

  it("applies fast delivery coupon correctly", () => {
    const q = computeQuote({
      lines: [line(10000)],
      packagingPaise: 0,
      commissionBps: 1000,
      distanceKm: 3,
      fees: { ...fees, minOrderPaise: 0, deliveryFreeOverPaise: null, deliveryBasePaise: 3000, deliveryPerKmPaise: 500 },
      promo: {
        id: "freedel",
        code: "FREEDEL",
        name: "fast delivery Offer",
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
        eveningModeRadiusKm: 7.5,
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
        eveningModeRadiusKm: 7.5,
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

  describe("Consumer Platform Fee, Distance Slabs & Micro-Monetization Engine", () => {
    it("charges consumer platform fee between ₹6.00 and ₹10.00 representing 100% founder gross profit", () => {
      // 1. Default ₹6.00 (600 paise) platform fee
      const qDefault = computeQuote({
        lines: [line(20000)], // ₹200.00
        packagingPaise: 0,
        commissionBps: 1000,
        distanceKm: 2,
        fees: {
          ...fees,
          platformFeePaise: 600,
          useDistanceSlabs: true,
        },
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(qDefault.platformFeePaise, 600);
      assert.ok(qDefault.lines.some((l) => l.code === "PLATFORM_FEE" && l.amountPaise === 600));

      // 2. Maximum ₹10.00 (1000 paise) platform fee
      const qMax = computeQuote({
        lines: [line(20000)],
        packagingPaise: 0,
        commissionBps: 1000,
        distanceKm: 2,
        fees: {
          ...fees,
          platformFeePaise: 1000,
          useDistanceSlabs: true,
        },
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(qMax.platformFeePaise, 1000);
      assert.ok(qMax.lines.some((l) => l.code === "PLATFORM_FEE" && l.amountPaise === 1000));
    });

    it("calculates distance delivery slabs accurately: 0-3km base, 3-7km (+₹10/km), >7km (+₹14/km)", () => {
      // 1. 0-3km slab (e.g. 2.5 km) -> Base fee ₹25.00 (2500 paise)
      const qSlab1 = computeQuote({
        lines: [line(30000)],
        packagingPaise: 0,
        commissionBps: 1000,
        distanceKm: 2.5,
        fees: {
          ...fees,
          deliveryBasePaise: 2500,
          useDistanceSlabs: true,
          platformFeePaise: 0,
          smallCartFeePaise: 0,
        },
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(qSlab1.deliveryFeePaise, 2500);
      assert.equal(qSlab1.baseDeliveryFeePaise, 2500);

      // 2. 3-7km slab (e.g. 5.0 km) -> Base ₹25 + (5 - 3) * ₹10 = ₹25 + ₹20 = ₹45 (4500 paise)
      const qSlab2 = computeQuote({
        lines: [line(30000)],
        packagingPaise: 0,
        commissionBps: 1000,
        distanceKm: 5.0,
        fees: {
          ...fees,
          deliveryBasePaise: 2500,
          useDistanceSlabs: true,
          platformFeePaise: 0,
          smallCartFeePaise: 0,
        },
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(qSlab2.deliveryFeePaise, 4500);
      assert.equal(qSlab2.baseDeliveryFeePaise, 4500);

      // 3. >7km slab (e.g. 10.0 km) -> Base ₹25 + (4 * ₹10) + (10 - 7) * ₹14 = ₹25 + ₹40 + ₹42 = ₹107 (10700 paise)
      const qSlab3 = computeQuote({
        lines: [line(60000)],
        packagingPaise: 0,
        commissionBps: 1000,
        distanceKm: 10.0,
        fees: {
          ...fees,
          deliveryBasePaise: 2500,
          deliveryFreeOverPaise: null,
          useDistanceSlabs: true,
          platformFeePaise: 0,
          smallCartFeePaise: 0,
          longDistanceMovPaise: 49900,
        },
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(qSlab3.deliveryFeePaise, 10700);
      assert.equal(qSlab3.baseDeliveryFeePaise, 10700);
    });

    it("applies dynamic surge fees: Rain (+₹20 to +₹45), Peak (+₹15 to +₹30), Late Night (+₹20 to +₹35)", () => {
      // 1. Rain Surge active (+₹30 / 3000 paise)
      const qRain = computeQuote({
        lines: [line(30000)],
        packagingPaise: 0,
        commissionBps: 1000,
        distanceKm: 2.0,
        fees: {
          ...fees,
          deliveryBasePaise: 2500,
          useDistanceSlabs: true,
          rainSurgeActive: true,
          rainSurgePaise: 3000,
          peakSurgeActive: false,
          lateNightSurgeActive: false,
        },
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(qRain.surgeFeePaise, 3000);
      assert.equal(qRain.deliveryFeePaise, 2500 + 3000);
      assert.equal(qRain.surgeBreakdown.rainSurgePaise, 3000);
      assert.ok(qRain.lines.some((l) => l.code === "RAIN_SURGE" && l.amountPaise === 3000));

      // 2. Peak Demand Surge active (+₹20 / 2000 paise)
      const qPeak = computeQuote({
        lines: [line(30000)],
        packagingPaise: 0,
        commissionBps: 1000,
        distanceKm: 2.0,
        fees: {
          ...fees,
          deliveryBasePaise: 2500,
          useDistanceSlabs: true,
          rainSurgeActive: false,
          peakSurgeActive: true,
          peakSurgePaise: 2000,
          lateNightSurgeActive: false,
        },
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(qPeak.surgeFeePaise, 2000);
      assert.equal(qPeak.deliveryFeePaise, 2500 + 2000);
      assert.equal(qPeak.surgeBreakdown.peakSurgePaise, 2000);
      assert.ok(qPeak.lines.some((l) => l.code === "PEAK_SURGE" && l.amountPaise === 2000));

      // 3. Late Night Surcharge active (+₹25 / 2500 paise)
      const qNight = computeQuote({
        lines: [line(30000)],
        packagingPaise: 0,
        commissionBps: 1000,
        distanceKm: 2.0,
        fees: {
          ...fees,
          deliveryBasePaise: 2500,
          useDistanceSlabs: true,
          rainSurgeActive: false,
          peakSurgeActive: false,
          lateNightSurgeActive: true,
          lateNightSurgePaise: 2500,
        },
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(qNight.surgeFeePaise, 2500);
      assert.equal(qNight.deliveryFeePaise, 2500 + 2500);
      assert.equal(qNight.surgeBreakdown.lateNightSurgePaise, 2500);
      assert.ok(qNight.lines.some((l) => l.code === "LATE_NIGHT_SURGE" && l.amountPaise === 2500));

      // 4. Combined Rain + Peak + Late Night surges
      const qAllSurges = computeQuote({
        lines: [line(30000)],
        packagingPaise: 0,
        commissionBps: 1000,
        distanceKm: 2.0,
        fees: {
          ...fees,
          deliveryBasePaise: 2500,
          useDistanceSlabs: true,
          rainSurgeActive: true,
          rainSurgePaise: 2500,
          peakSurgeActive: true,
          peakSurgePaise: 2000,
          lateNightSurgeActive: true,
          lateNightSurgePaise: 2500,
        },
        promo: null,
        isFirstOrder: false,
      });
      // 2500 base + 2500 rain + 2000 peak + 2500 night = 9500 paise
      assert.equal(qAllSurges.surgeFeePaise, 7000);
      assert.equal(qAllSurges.deliveryFeePaise, 2500 + 7000);
      assert.equal(qAllSurges.surgeBreakdown.activeSurges.length, 3);
    });

    it("applies Small Cart Fee (+₹25) only when net food bill is under ₹149 (14900 paise)", () => {
      // 1. Food bill ₹120 (< ₹149) -> +₹25 (2500 paise) Small Cart Fee applied
      const qUnder149 = computeQuote({
        lines: [line(12000)], // ₹120.00
        packagingPaise: 0,
        commissionBps: 1000,
        distanceKm: 1.0,
        fees: {
          ...fees,
          minOrderPaise: 5000,
          smallCartFeePaise: 2500,
          smallCartThresholdPaise: 14900,
          platformFeePaise: 600,
        },
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(qUnder149.smallCartFeePaise, 2500);
      assert.ok(qUnder149.lines.some((l) => l.code === "SMALL_CART_FEE" && l.amountPaise === 2500));

      // 2. Food bill ₹200 (>= ₹149) -> Small Cart Fee is ₹0
      const qOver149 = computeQuote({
        lines: [line(20000)], // ₹200.00
        packagingPaise: 0,
        commissionBps: 1000,
        distanceKm: 1.0,
        fees: {
          ...fees,
          minOrderPaise: 5000,
          smallCartFeePaise: 2500,
          smallCartThresholdPaise: 14900,
          platformFeePaise: 600,
        },
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(qOver149.smallCartFeePaise, 0);
      assert.equal(qOver149.lines.some((l) => l.code === "SMALL_CART_FEE"), false);
    });

    it("verifies Indian statutory tax compliance: 5% food GST and 18% services GST on platform fee", () => {
      const qTax = computeQuote({
        lines: [line(20000)], // ₹200 food
        packagingPaise: 1000, // ₹10 packaging
        commissionBps: 1000,
        distanceKm: 2.0,
        fees: {
          ...fees,
          menuPricesIncludeTax: true, // Food GST 5% included in menu
          menuTaxBps: 500,
          serviceTaxBps: 1800, // 18% on platform & services
          deliveryTaxBps: 0,
          platformFeePaise: 600, // ₹6 platform fee
          smallCartFeePaise: 0,
          useDistanceSlabs: true,
        },
        promo: null,
        isFirstOrder: false,
      });

      // 5% Food GST on ₹200 is ₹10 (1000 paise)
      assert.equal(qTax.taxBreakdown.foodGstPaise, 1000);
      assert.equal(qTax.taxBreakdown.foodGstIncludedInMenu, true);

      // 18% Services GST on ₹6.00 platform fee = ₹1.08 (108 paise)
      assert.equal(qTax.taxBreakdown.servicesGstPaise, 108);
      assert.equal(qTax.taxPaise, 108);
    });
  });

  describe("commercial economics: delivery take-rate, Table QR custom commission & payment gateway pass-through", () => {
    it("enforces 28% standard delivery take-rate (2800 bps) by default when commission is omitted", () => {
      const q = computeQuote({
        lines: [line(50000)], // ₹500 food
        packagingPaise: 0,
        distanceKm: 2,
        fees,
        promo: null,
        isFirstOrder: false,
      });

      assert.equal(q.commissionBps, 2800);
      assert.equal(q.commissionPaise, 14000); // 28% of 50000 = 14000 paise (₹140)
      assert.equal(q.restaurantPayablePaise, 36000); // 50000 - 14000 = 36000 paise (₹360)
    });

    it("supports configurable delivery take-rate tiers from 18% (1800 bps) to 28% (2800 bps)", () => {
      assert.equal(STANDARD_DELIVERY_COMMISSION_BPS, 2800);
      assert.equal(MIN_DELIVERY_COMMISSION_BPS, 1800);
      assert.equal(MAX_DELIVERY_COMMISSION_BPS, 2800);

      // 18% enterprise tier
      assert.equal(validateDeliveryTakeRate(1800), 1800);
      const q18 = computeQuote({
        lines: [line(100000)], // ₹1,000 food
        packagingPaise: 0,
        commissionBps: 1800,
        distanceKm: 2,
        fees,
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(q18.commissionBps, 1800);
      assert.equal(q18.commissionPaise, 18000);

      // 22% growth tier
      assert.equal(validateDeliveryTakeRate(2200), 2200);
      const q22 = computeQuote({
        lines: [line(100000)],
        packagingPaise: 0,
        commissionBps: 2200,
        distanceKm: 2,
        fees,
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(q22.commissionBps, 2200);
      assert.equal(q22.commissionPaise, 22000);

      // Out-of-bounds rejection
      assert.throws(() => validateDeliveryTakeRate(1500), /Delivery take-rate must be an integer between 1800 and 2800 bps/);
      assert.throws(() => validateDeliveryTakeRate(3500), /Delivery take-rate must be an integer between 1800 and 2800 bps/);
    });

    it("enforces strictly 0% dine-in commission on Table QR orders with zero delivery fee", () => {
      assert.equal(DINE_IN_TABLE_QR_COMMISSION_BPS, 0);

      const qTableQr = computeQuote({
        lines: [line(80000)], // ₹800 food ordered at dine-in table via QR
        packagingPaise: 0,
        distanceKm: 0,
        fees,
        promo: null,
        isFirstOrder: false,
        orderType: "TABLE_QR",
      });

      assert.equal(qTableQr.orderType, "TABLE_QR");
      assert.equal(qTableQr.commissionBps, 0); // custom commission
      assert.equal(qTableQr.commissionPaise, 0); // 0 paise platform cut
      assert.equal(qTableQr.deliveryFeePaise, 0); // No delivery fee for table dine-in
      assert.equal(qTableQr.restaurantPayablePaise, 80000); // 100% of food bill paid to restaurant
    });

    it("calculates payment gateway fee pass-through (184 bps = 1.84% + 18% GST) with zero float drift", () => {
      assert.equal(PAYMENT_GATEWAY_CONFIG.FEE_BPS, 184);
      assert.equal(PAYMENT_GATEWAY_CONFIG.GST_BPS, 1800);

      // For ₹100.00 (10000 paise):
      // Base PG fee = 10000 * 184 / 10000 = 184 paise (₹1.84)
      // 18% GST on PG fee = 184 * 1800 / 10000 = 33 paise (₹0.33)
      // Total PG fee = 184 + 33 = 217 paise (₹2.17)
      const pg100 = calculatePaymentGatewayFee(10000);
      assert.equal(pg100.feeBasePaise, 184);
      assert.equal(pg100.feeGstPaise, 33);
      assert.equal(pg100.totalFeePaise, 217);

      // With pass-through enabled in computeQuote:
      const qWithPg = computeQuote({
        lines: [line(10000)],
        packagingPaise: 0,
        distanceKm: 0,
        fees: { ...fees, deliveryBasePaise: 0, deliveryPerKmPaise: 0 },
        promo: null,
        isFirstOrder: false,
        passThroughPaymentGatewayFee: true,
      });

      assert.equal(qWithPg.paymentGatewayBreakdown.isPassedThrough, true);
      assert.equal(qWithPg.paymentGatewayBreakdown.feeBasePaise, 184);
      assert.equal(qWithPg.paymentGatewayBreakdown.feeGstPaise, 33);
      assert.equal(qWithPg.paymentGatewayBreakdown.totalFeePaise, 217);
      assert.equal(qWithPg.totalPaise, 10000 + 217);

      const pgLine = qWithPg.lines.find((l) => l.code === "PAYMENT_GATEWAY");
      assert.ok(pgLine);
      assert.equal(pgLine.amountPaise, 217);
    });
  });

  describe("Quad-Core Dynamic Delivery Availability (IST Shifts: Day 12km, Evening 7.5km, Late-Night 3.5km)", () => {
    it("enforces dynamic default shift boundaries when specific overrides are omitted", () => {
      // 1. Day Shift: up to 12.0 km allowed, 12.5 km blocked
      const qDay12 = computeQuote({
        lines: [line(50000)],
        packagingPaise: 0,
        distanceKm: 12.0,
        fees,
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(qDay12.blockers.includes("EXCEEDS_MAX_RADIUS"), false);

      const qDayExceeded = computeQuote({
        lines: [line(50000)],
        packagingPaise: 0,
        distanceKm: 12.5,
        fees,
        promo: null,
        isFirstOrder: false,
      });
      assert.ok(qDayExceeded.blockers.includes("EXCEEDS_MAX_RADIUS"));

      // 2. Evening Shift: up to 7.5 km allowed, 8.0 km blocked
      const qEvening75 = computeQuote({
        lines: [line(50000)],
        packagingPaise: 0,
        distanceKm: 7.5,
        fees: { ...fees, eveningModeActive: true },
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(qEvening75.blockers.includes("EVENING_DISTANCE_LIMIT"), false);

      const qEveningExceeded = computeQuote({
        lines: [line(50000)],
        packagingPaise: 0,
        distanceKm: 8.0,
        fees: { ...fees, eveningModeActive: true },
        promo: null,
        isFirstOrder: false,
      });
      assert.ok(qEveningExceeded.blockers.includes("EVENING_DISTANCE_LIMIT"));

      // 3. Late-Night Shift: up to 3.5 km allowed, 4.0 km blocked
      const qNight35 = computeQuote({
        lines: [line(50000)],
        packagingPaise: 0,
        distanceKm: 3.5,
        fees: { ...fees, nightModeActive: true },
        promo: null,
        isFirstOrder: false,
      });
      assert.equal(qNight35.blockers.includes("NIGHT_SAFETY_CURFEW"), false);

      const qNightExceeded = computeQuote({
        lines: [line(50000)],
        packagingPaise: 0,
        distanceKm: 4.0,
        fees: { ...fees, nightModeActive: true },
        promo: null,
        isFirstOrder: false,
      });
      assert.ok(qNightExceeded.blockers.includes("NIGHT_SAFETY_CURFEW"));
    });
  });
});
