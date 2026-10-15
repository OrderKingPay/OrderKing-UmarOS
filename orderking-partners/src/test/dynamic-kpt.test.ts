import { describe, it, expect } from "vitest";
import {
  calculateDynamicKpt,
  calculateItemsPreparationTime,
  calculateQueueMultiplier,
  calculateHistoricalSpeedFactor,
  inferDishComplexity,
  buildKptDispatchNotification,
} from "../lib/orders/dynamic-kpt.ts";

describe("Dynamic Kitchen Preparation Time (KPT) Engine", () => {
  it("infers dish complexity tiers accurately across Indian menu catalog", () => {
    const biryani = inferDishComplexity("Hyderabadi Mutton Dum Biryani", "Mains");
    expect(biryani.tier).toBe("COMPLEX");
    expect(biryani.defaultPrepMinutes).toBe(30);

    const tandoori = inferDishComplexity("Murgh Tandoori Half", "Starters");
    expect(tandoori.tier).toBe("HIGH");
    expect(tandoori.defaultPrepMinutes).toBe(22);

    const dal = inferDishComplexity("Yellow Dal Tadka", "Mains");
    expect(dal.tier).toBe("MEDIUM");
    expect(dal.defaultPrepMinutes).toBe(15);

    const shake = inferDishComplexity("Mango Lassi Sweet Shake", "Beverages");
    expect(shake.tier).toBe("LOW");
    expect(shake.defaultPrepMinutes).toBe(8);
  });

  it("calculates multi-item preparation time with parallel kitchen throughput", () => {
    const singleItem = calculateItemsPreparationTime([
      { itemId: "1", name: "Paneer Butter Masala", quantity: 1 },
    ]);
    expect(singleItem.basePrepMinutes).toBe(15);

    // Multi-item order: Parallel cooking dampener applies
    const multiItem = calculateItemsPreparationTime([
      { itemId: "1", name: "Paneer Butter Masala", quantity: 1 },
      { itemId: "2", name: "Garlic Naan", quantity: 3, basePrepMinutes: 8, complexityTier: "LOW" },
      { itemId: "3", name: "Hyderabadi Dum Biryani", quantity: 1 },
    ]);

    // Dominant item is Dum Biryani (30 min base)
    expect(multiItem.dominantItemName).toBe("Hyderabadi Dum Biryani");
    // With 4 additional items, parallel cooking adjusts total base prep smoothly
    expect(multiItem.basePrepMinutes).toBeGreaterThanOrEqual(30);
    expect(multiItem.basePrepMinutes).toBeLessThan(60);
    expect(multiItem.totalQuantity).toBe(5);
  });

  it("scales queue multiplier when active tickets exceed nominal station capacity", () => {
    // Free kitchen: <= 2 tickets -> multiplier 1.0
    const lightLoad = calculateQueueMultiplier({
      restaurantId: "rst_1",
      activeTicketCount: 2,
      activeItemsInQueue: 3,
      nominalStationCapacity: 6,
    });
    expect(lightLoad.multiplier).toBe(1.0);
    expect(lightLoad.surgeApplied).toBe(false);

    // Moderate load within capacity: 5 tickets
    const moderateLoad = calculateQueueMultiplier({
      restaurantId: "rst_1",
      activeTicketCount: 5,
      activeItemsInQueue: 9,
      nominalStationCapacity: 6,
    });
    expect(moderateLoad.multiplier).toBeGreaterThan(1.0);
    expect(moderateLoad.multiplier).toBeLessThan(1.35);
    expect(moderateLoad.surgeApplied).toBe(false);

    // Heavy surge / backlog: 12 tickets on a 6-capacity line
    const surgeLoad = calculateQueueMultiplier({
      restaurantId: "rst_1",
      activeTicketCount: 12,
      activeItemsInQueue: 28,
      nominalStationCapacity: 6,
    });
    expect(surgeLoad.multiplier).toBeGreaterThanOrEqual(1.5);
    expect(surgeLoad.surgeApplied).toBe(true);
  });

  it("incorporates historical preparation speed factor", () => {
    // Insufficient samples -> 1.0 default
    expect(calculateHistoricalSpeedFactor({
      restaurantId: "rst_1",
      speedMultiplier: 0.8,
      avgPrepMinutesHistorical: 16,
      rollingSampleCount: 2,
    })).toBe(1.0);

    // Fast kitchen: 0.85x speed
    const fast = calculateHistoricalSpeedFactor({
      restaurantId: "rst_1",
      speedMultiplier: 0.85,
      avgPrepMinutesHistorical: 17,
      rollingSampleCount: 25,
    });
    expect(fast).toBe(0.85);

    // Sluggish kitchen: 1.25x speed
    const slow = calculateHistoricalSpeedFactor({
      restaurantId: "rst_1",
      speedMultiplier: 1.25,
      avgPrepMinutesHistorical: 28,
      rollingSampleCount: 30,
    });
    expect(slow).toBe(1.25);
  });

  it("synchronizes rider dispatch trigger to ensure courier arrives exactly as food is packed", () => {
    const fixedNow = new Date("2026-10-15T12:00:00.000Z");
    const result = calculateDynamicKpt({
      orderId: "ord_101",
      orderNumber: "OK-101",
      restaurantId: "rst_central",
      orderPlacedAt: fixedNow,
      items: [
        { itemId: "itm_1", name: "Awadhi Chicken Dum Biryani", quantity: 2 },
      ],
      kitchenLoad: {
        restaurantId: "rst_central",
        activeTicketCount: 4,
        activeItemsInQueue: 8,
        nominalStationCapacity: 6,
      },
      speedProfile: {
        restaurantId: "rst_central",
        speedMultiplier: 1.0,
        avgPrepMinutesHistorical: 30,
        rollingSampleCount: 15,
      },
      pickupLocation: { lat: 26.1445, lng: 91.7362 },
      estimatedCourierTransitMinutes: 10,
    });

    // Cooking time should reflect Biryani base + slight queue buffer
    expect(result.calculatedKptMinutes).toBeGreaterThanOrEqual(30);

    const acceptedMs = fixedNow.getTime();
    const readyMs = new Date(result.expectedReadyAt).getTime();
    const dispatchTriggerMs = new Date(result.optimalDispatchTriggerAt).getTime();

    // Food ready time matches calculated KPT
    expect(readyMs - acceptedMs).toBe(result.calculatedKptMinutes * 60_000);

    // Optimal dispatch trigger should precede food ready time by exact courier transit buffer (10 min)
    expect(readyMs - dispatchTriggerMs).toBe(10 * 60_000);

    // If dispatched at the optimal trigger time, courier idle wait at restaurant is minimized to 0
    expect(result.estimatedCourierIdleWaitMinutes).toBe(0);

    // Build notification event payload
    const event = buildKptDispatchNotification(result, { lat: 26.1445, lng: 91.7362 });
    expect(event.eventType).toBe("KPT_DISPATCH_TRIGGER");
    expect(event.calculatedKptMinutes).toBe(result.calculatedKptMinutes);
    expect(event.optimalDispatchTriggerAt).toBe(result.optimalDispatchTriggerAt);
    expect(event.transitBufferMinutes).toBe(10);
  });
});
