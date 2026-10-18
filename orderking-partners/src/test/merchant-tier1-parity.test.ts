import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getTomorrow08AM,
  calculateStockoutExpiry,
  isStockoutExpired,
  formatStockoutRemaining,
  findExpiredItemIds,
  LocalStockoutScheduler,
  TIER1_STOCKOUT_PRESETS,
} from "../lib/menu/timed-stockout.ts";
import {
  calculateOrderRushEta,
  calculateBatchRushAdjustments,
  useKitchenRushStore,
} from "../lib/orders/kitchen-rush.ts";

describe("Merchant Tier-1 Partner Parity Test Suite", () => {
  describe("1. Timed Item Out-of-Stock Auto-Reset Engine", () => {
    it("provides the authentic Tier-1 Partner stockout replenishment presets", () => {
      expect(TIER1_STOCKOUT_PRESETS.map((p) => p.label)).toEqual([
        "Turn on for Next Meal",
        "Turn on Tomorrow 8:00 AM",
        "Turn off for 2 Hours",
        "Turn off for 4 Hours",
        "Custom Time",
        "Turn off Indefinitely",
      ]);
    });

    it("calculates exact Tier-1 Next Meal time across meal shift windows", () => {
      // 1. Morning (10:15 AM) -> Lunch at 12:30 PM today
      const morning = new Date(2026, 9, 17, 10, 15, 0);
      const nextMealMorning = calculateStockoutExpiry("TURN_OFF_NEXT_MEAL", morning);
      expect(nextMealMorning.status).toBe("temporarily_unavailable");
      expect(nextMealMorning.expiryDate?.getHours()).toBe(12);
      expect(nextMealMorning.expiryDate?.getMinutes()).toBe(30);
      expect(nextMealMorning.expiryDate?.getDate()).toBe(17);

      // 2. Afternoon (14:45 / 2:45 PM) -> Dinner at 7:30 PM today
      const afternoon = new Date(2026, 9, 17, 14, 45, 0);
      const nextMealAfternoon = calculateStockoutExpiry("TURN_OFF_NEXT_MEAL", afternoon);
      expect(nextMealAfternoon.status).toBe("temporarily_unavailable");
      expect(nextMealAfternoon.expiryDate?.getHours()).toBe(19);
      expect(nextMealAfternoon.expiryDate?.getMinutes()).toBe(30);
      expect(nextMealAfternoon.expiryDate?.getDate()).toBe(17);

      // 3. Late evening (20:30 / 8:30 PM) -> Tomorrow Breakfast at 8:00 AM
      const lateEvening = new Date(2026, 9, 17, 20, 30, 0);
      const nextMealNight = calculateStockoutExpiry("TURN_OFF_NEXT_MEAL", lateEvening);
      expect(nextMealNight.status).toBe("temporarily_unavailable");
      expect(nextMealNight.expiryDate?.getHours()).toBe(8);
      expect(nextMealNight.expiryDate?.getMinutes()).toBe(0);
      expect(nextMealNight.expiryDate?.getDate()).toBe(18);
    });

    it("calculates Tomorrow 08:00 AM correctly across various day times", () => {
      // 1. Afternoon (14:30) on 2026-10-17 -> Tomorrow 08:00:00 (Oct 18)
      const afternoon = new Date(2026, 9, 17, 14, 30, 0);
      const nextMorningA = getTomorrow08AM(afternoon);
      expect(nextMorningA.getDate()).toBe(18);
      expect(nextMorningA.getHours()).toBe(8);
      expect(nextMorningA.getMinutes()).toBe(0);
      expect(nextMorningA.getSeconds()).toBe(0);

      // 2. Early morning (04:15 AM) -> Tomorrow 08:00:00 (Oct 18)
      const earlyMorning = new Date(2026, 9, 17, 4, 15, 0);
      const nextMorningB = getTomorrow08AM(earlyMorning);
      expect(nextMorningB.getDate()).toBe(18);
      expect(nextMorningB.getHours()).toBe(8);
      expect(nextMorningB.getMinutes()).toBe(0);

      // 3. Late night (23:55) -> Tomorrow 08:00:00 (Oct 18)
      const lateNight = new Date(2026, 9, 17, 23, 55, 0);
      const nextMorningC = getTomorrow08AM(lateNight);
      expect(nextMorningC.getDate()).toBe(18);
      expect(nextMorningC.getHours()).toBe(8);
      expect(nextMorningC.getMinutes()).toBe(0);
    });

    it("calculates exact expiry timestamps for all Tier-1 options including Custom", () => {
      const baseNow = new Date("2026-10-17T12:00:00.000Z");

      // 2 Hours
      const twoHours = calculateStockoutExpiry("TURN_OFF_2_HOURS", baseNow);
      expect(twoHours.status).toBe("temporarily_unavailable");
      expect(new Date(twoHours.nextAvailableAt!).getTime() - baseNow.getTime()).toBe(
        2 * 60 * 60 * 1000
      );

      // 4 Hours
      const fourHours = calculateStockoutExpiry("TURN_OFF_4_HOURS", baseNow);
      expect(fourHours.status).toBe("temporarily_unavailable");
      expect(new Date(fourHours.nextAvailableAt!).getTime() - baseNow.getTime()).toBe(
        4 * 60 * 60 * 1000
      );

      // Tomorrow 8:00 AM
      const tomorrow8 = calculateStockoutExpiry("TURN_OFF_TOMORROW_8AM", baseNow);
      expect(tomorrow8.status).toBe("temporarily_unavailable");
      const expDate = new Date(tomorrow8.nextAvailableAt!);
      expect(expDate.getHours()).toBe(8);
      expect(expDate.getMinutes()).toBe(0);

      // Custom Time
      const customDate = new Date("2026-10-17T17:30:00.000Z");
      const customResult = calculateStockoutExpiry("CUSTOM", baseNow, customDate);
      expect(customResult.status).toBe("temporarily_unavailable");
      expect(customResult.nextAvailableAt).toBe(customDate.toISOString());

      // Indefinitely
      const indefinite = calculateStockoutExpiry("TURN_OFF_INDEFINITELY", baseNow);
      expect(indefinite.status).toBe("sold_out");
      expect(indefinite.nextAvailableAt).toBeNull();
    });

    it("evaluates isStockoutExpired accurately", () => {
      const now = new Date("2026-10-17T15:00:00.000Z");

      // Not expired (future)
      const future = new Date("2026-10-17T17:00:00.000Z").toISOString();
      expect(isStockoutExpired(future, now)).toBe(false);

      // Expired (past)
      const past = new Date("2026-10-17T14:59:59.000Z").toISOString();
      expect(isStockoutExpired(past, now)).toBe(true);

      // Indefinite (null or undefined)
      expect(isStockoutExpired(null, now)).toBe(false);
      expect(isStockoutExpired(undefined, now)).toBe(false);
    });

    it("formats stockout remaining countdowns cleanly", () => {
      const now = new Date("2026-10-17T12:00:00.000Z");

      // 45 minutes remaining
      const in45m = new Date("2026-10-17T12:45:00.000Z").toISOString();
      expect(formatStockoutRemaining(in45m, now)).toBe("Auto-restores in 45m");

      // Indefinite
      expect(formatStockoutRemaining(null, now)).toBe("Turned off indefinitely");

      // Expired
      const past = new Date("2026-10-17T11:59:00.000Z").toISOString();
      expect(formatStockoutRemaining(past, now)).toBe("Auto-restoring...");
    });

    it("filters expired dish item IDs from menu catalog for batch reactivation", () => {
      const now = new Date("2026-10-17T18:00:00.000Z");
      const items = [
        { id: "dish_1", availability: "available", nextAvailableAt: null },
        { id: "dish_2", availability: "sold_out", nextAvailableAt: null },
        {
          id: "dish_3",
          availability: "temporarily_unavailable",
          nextAvailableAt: "2026-10-17T20:00:00.000Z", // Future: 2 hours left
        },
        {
          id: "dish_4",
          availability: "temporarily_unavailable",
          nextAvailableAt: "2026-10-17T17:45:00.000Z", // Expired: 15m ago!
        },
        {
          id: "dish_5",
          availability: "temporarily_unavailable",
          nextAvailableAt: "2026-10-17T17:59:59.000Z", // Expired: 1s ago!
        },
      ];

      const expiredIds = findExpiredItemIds(items, now);
      expect(expiredIds).toEqual(["dish_4", "dish_5"]);
    });

    describe("LocalStockoutScheduler (Automated Time Scheduler)", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("automatically triggers reactivation callback when an item timer expires", async () => {
        const reactivatedMock = vi.fn();
        const scheduler = new LocalStockoutScheduler(reactivatedMock);

        const now = Date.now();
        const items = [
          {
            id: "dish_biryani",
            availability: "temporarily_unavailable",
            nextAvailableAt: new Date(now + 1_500).toISOString(), // 1.5 seconds from now
          },
        ];

        scheduler.sync(items);
        expect(scheduler.getActiveTimerCount()).toBe(1);

        // Advance 1 second: timer should not have fired yet
        vi.advanceTimersByTime(1_000);
        expect(reactivatedMock).not.toHaveBeenCalled();

        // Advance past 1.5 seconds: timer fires and reactivates dish_biryani
        vi.advanceTimersByTime(600);
        expect(reactivatedMock).toHaveBeenCalledTimes(1);
        expect(reactivatedMock).toHaveBeenCalledWith(["dish_biryani"]);

        scheduler.dispose();
      });

      it("clears timers when items are restored or disposed", () => {
        const reactivatedMock = vi.fn();
        const scheduler = new LocalStockoutScheduler(reactivatedMock);

        const now = Date.now();
        scheduler.sync([
          {
            id: "dish_paneer",
            availability: "temporarily_unavailable",
            nextAvailableAt: new Date(now + 5_000).toISOString(),
          },
        ]);
        expect(scheduler.getActiveTimerCount()).toBe(1);

        // Sync with item now available: scheduler removes the pending timer
        scheduler.sync([
          {
            id: "dish_paneer",
            availability: "available",
            nextAvailableAt: null,
          },
        ]);
        expect(scheduler.getActiveTimerCount()).toBe(0);

        scheduler.dispose();
      });
    });
  });

  describe("2. Kitchen Rush / Overload Buffer Mode", () => {
    it("calculates +10 mins rush prep buffer and delays rider arrival window dynamically", () => {
      const placedAt = new Date("2026-10-17T19:00:00.000Z");
      const order = {
        id: "ord_101",
        prepMinutes: 20, // baseline SLA
        placedAt,
      };

      const courierTransitMinutes = 10;
      const result = calculateOrderRushEta(order, 10, courierTransitMinutes, placedAt);

      // Prep SLA buffered: 20m + 10m = 30m
      expect(result.originalPrepMinutes).toBe(20);
      expect(result.bufferedPrepMinutes).toBe(30);
      expect(result.bufferMinutes).toBe(10);

      // Expected ready time delayed by +10m
      const expectedReady = new Date("2026-10-17T19:30:00.000Z").toISOString();
      expect(result.adjustedReadyAt).toBe(expectedReady);

      // Rider dispatch trigger shifted from 19:10 to 19:20 (10 mins before food ready)
      const expectedDispatch = new Date("2026-10-17T19:20:00.000Z").toISOString();
      expect(result.adjustedRiderDispatchAt).toBe(expectedDispatch);

      // Target courier arrival pushed back to 19:30 (+10m delay)
      expect(result.adjustedRiderArrivalAt).toBe(expectedReady);
      expect(result.riderArrivalDelayMinutes).toBe(10);

      // Customer badge verification
      expect(result.customerBadge.headline).toBe("Kitchen is experiencing heavy rush");
      expect(result.customerBadge.message).toContain("+10 mins");
      expect(result.customerBadge.tone).toBe("amber");
    });

    it("calculates +15 mins surge rush buffer with heavy overload badge", () => {
      const placedAt = new Date("2026-10-17T20:15:00.000Z");
      const order = {
        id: "ord_102",
        prepMinutes: 25,
        placedAt,
      };

      const courierTransitMinutes = 12;
      const result = calculateOrderRushEta(order, 15, courierTransitMinutes, placedAt);

      // Prep SLA buffered: 25m + 15m = 40m
      expect(result.bufferedPrepMinutes).toBe(40);
      expect(result.bufferMinutes).toBe(15);

      // Ready at 20:55 (40 mins after placed)
      const expectedReady = new Date("2026-10-17T20:55:00.000Z").toISOString();
      expect(result.adjustedReadyAt).toBe(expectedReady);

      // Courier arrives at 20:55 (+15m delay from original 20:40)
      expect(result.adjustedRiderArrivalAt).toBe(expectedReady);
      expect(result.riderArrivalDelayMinutes).toBe(15);

      // Customer notice specifies heavy rush with rose status tone
      expect(result.customerBadge.headline).toBe("Kitchen is experiencing heavy rush");
      expect(result.customerBadge.tone).toBe("rose");
      expect(result.customerBadge.badgeText).toContain("+15m");
    });

    it("performs batch calculation across all active kitchen orders during rush", () => {
      const baseTime = new Date("2026-10-17T13:00:00.000Z");
      const activeOrders = [
        { id: "ord_1", prepMinutes: 15, placedAt: baseTime, state: "CONFIRMED" },
        { id: "ord_2", prepMinutes: 20, placedAt: baseTime, state: "PREPARING" },
        { id: "ord_3", prepMinutes: 30, placedAt: baseTime, state: "PLACED" },
      ];

      const batchMap = calculateBatchRushAdjustments(activeOrders, 15, 10, baseTime);

      expect(batchMap.size).toBe(3);

      const ord1 = batchMap.get("ord_1")!;
      expect(ord1.bufferedPrepMinutes).toBe(30); // 15 + 15
      expect(ord1.riderArrivalDelayMinutes).toBe(15);

      const ord2 = batchMap.get("ord_2")!;
      expect(ord2.bufferedPrepMinutes).toBe(35); // 20 + 15

      const ord3 = batchMap.get("ord_3")!;
      expect(ord3.bufferedPrepMinutes).toBe(45); // 30 + 15
    });

    it("manages reactive kitchen rush state through useKitchenRushStore", () => {
      const store = useKitchenRushStore.getState();

      // Initially inactive
      store.deactivate();
      expect(useKitchenRushStore.getState().isActive).toBe(false);

      // Activate with +10m buffer
      store.activate(10);
      expect(useKitchenRushStore.getState().isActive).toBe(true);
      expect(useKitchenRushStore.getState().bufferMinutes).toBe(10);

      // Switch to +15m buffer
      store.setBuffer(15);
      expect(useKitchenRushStore.getState().isActive).toBe(true);
      expect(useKitchenRushStore.getState().bufferMinutes).toBe(15);

      // Deactivate
      store.deactivate();
      expect(useKitchenRushStore.getState().isActive).toBe(false);
    });
  });
});
