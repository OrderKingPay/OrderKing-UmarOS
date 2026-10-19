/**
 * MERCHANT SECRET WEAPONS & OPERATIONAL RESILIENCE TEST SUITE
 * 
 * Verifies:
 * 1. Structured Rejection Modal & Timed Stockout Link
 *    - All 4 Tier-1 Leader operational rejection reasons
 *    - Dish checklist validation & automatic timed stockout transitions
 * 2. Outlet Emergency Pause & Operational Status Switch
 *    - 🟢 Online, 🟡 Paused 30m, 🟡 Paused 60m, 🔴 Offline
 *    - Pause timers, localStorage persistence, customer notice generation, auto-resumption
 * 3. Daily Business Summary & Settlement Ledger
 *    - Delivered orders count, gross GMV, statutory deductions breakdown
 *    - Platform commission, GST §9(5) vs services GST, gateway fees, net estimated payout
 *    - T+1 daily settlement countdown timer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TIER1_REJECTION_REASONS,
  processStructuredRejection,
} from "../lib/orders/structured-rejection";
import {
  calculatePausedUntil,
  isOutletPauseExpired,
  formatOutletPauseRemaining,
  getOutletCustomerNotice,
  useOutletStatusStore,
  OUTLET_STATUS_PRESETS,
  STORAGE_OUTLET_STATUS_KEY,
  STORAGE_OUTLET_PAUSED_UNTIL_KEY,
} from "../lib/outlet/operational-status";
import {
  calculateDailyBusinessSummary,
  getNextSettlementTimestamp,
  formatTPlus1Countdown,
  type DeliveredOrderInput,
} from "../lib/finance/daily-summary";
import { formatINR } from "../lib/money";

describe("Merchant Secret Weapons & Operational Resilience Suite", () => {
  // ==========================================================================
  // 1. Structured Order Rejection Modal & Timed Stockout Link
  // ==========================================================================
  describe("1. Structured Order Rejection & Timed Stockout Link", () => {
    it("provides the four authentic Tier-1 Leader operational rejection reasons", () => {
      const reasonLabels = TIER1_REJECTION_REASONS.map((r) => r.label);
      expect(reasonLabels).toEqual([
        "Kitchen Overloaded / Too Many Orders",
        "Item(s) in Order Out of Stock",
        "Outlet Closing Early / Staff Shortage",
        "Power / Gas / Technical Outage",
      ]);

      const reasonIds = TIER1_REJECTION_REASONS.map((r) => r.id);
      expect(reasonIds).toEqual([
        "kitchen_overloaded",
        "item_unavailable",
        "restaurant_closed",
        "technical_issue",
      ]);
    });

    it("processes 'kitchen_overloaded' rejection and advises kitchen rush", () => {
      const result = processStructuredRejection({
        orderId: "ord_rush_01",
        orderNumber: "OK-1042",
        reason: "kitchen_overloaded",
      });

      expect(result.reason).toBe("kitchen_overloaded");
      expect(result.requiresStockout).toBe(false);
      expect(result.stockoutItemIds).toEqual([]);
      expect(result.customerNotificationMessage).toContain("Kitchen overloaded");
    });

    it("processes 'restaurant_closed' rejection cleanly", () => {
      const result = processStructuredRejection({
        orderId: "ord_close_02",
        orderNumber: "OK-1043",
        reason: "restaurant_closed",
      });

      expect(result.reason).toBe("restaurant_closed");
      expect(result.requiresStockout).toBe(false);
      expect(result.customerNotificationMessage).toContain("Outlet closing early");
    });

    it("processes 'technical_issue' rejection cleanly", () => {
      const result = processStructuredRejection({
        orderId: "ord_tech_03",
        orderNumber: "OK-1044",
        reason: "technical_issue",
      });

      expect(result.reason).toBe("technical_issue");
      expect(result.requiresStockout).toBe(false);
      expect(result.customerNotificationMessage).toContain("Technical / outage issue");
    });

    it("requires at least one dish selected when reason is 'item_unavailable'", () => {
      expect(() => {
        processStructuredRejection({
          orderId: "ord_stock_04",
          orderNumber: "OK-1045",
          reason: "item_unavailable",
          selectedLineItemIds: [],
        });
      }).toThrow("Please select at least one out-of-stock dish from the order to decline.");
    });

    it("seamlessly links 'item_unavailable' with Timed Stockout presets and computes target expiry", () => {
      const refDate = new Date("2026-10-17T12:00:00.000Z");

      // 1. Turn off for 2 Hours
      const res2h = processStructuredRejection({
        orderId: "ord_stock_05",
        orderNumber: "OK-1046",
        reason: "item_unavailable",
        selectedLineItemIds: ["dish_paneer_butter", "dish_garlic_naan"],
        stockoutDuration: "TURN_OFF_2_HOURS",
        refDate,
      });

      expect(res2h.requiresStockout).toBe(true);
      expect(res2h.stockoutItemIds).toEqual(["dish_paneer_butter", "dish_garlic_naan"]);
      expect(res2h.stockoutStatus).toBe("temporarily_unavailable");
      expect(new Date(res2h.nextAvailableAt!).getTime() - refDate.getTime()).toBe(
        2 * 60 * 60 * 1000
      );
      expect(res2h.customerNotificationMessage).toContain("turned off (Turn off for 2 Hours)");

      // 2. Turn off until Tomorrow 8:00 AM (Default end-of-day stockout)
      const resTom8 = processStructuredRejection({
        orderId: "ord_stock_06",
        orderNumber: "OK-1047",
        reason: "item_unavailable",
        selectedLineItemIds: ["dish_biryani"],
        stockoutDuration: "TURN_OFF_TOMORROW_8AM",
        refDate,
      });

      expect(resTom8.requiresStockout).toBe(true);
      expect(resTom8.stockoutItemIds).toEqual(["dish_biryani"]);
      expect(resTom8.stockoutStatus).toBe("temporarily_unavailable");
      const tom8Date = new Date(resTom8.nextAvailableAt!);
      expect(tom8Date.getHours()).toBe(8);
      expect(tom8Date.getMinutes()).toBe(0);

      // 3. Turn off Indefinitely
      const resIndef = processStructuredRejection({
        orderId: "ord_stock_07",
        orderNumber: "OK-1048",
        reason: "item_unavailable",
        selectedLineItemIds: ["dish_fish_tikka"],
        stockoutDuration: "TURN_OFF_INDEFINITELY",
        refDate,
      });

      expect(resIndef.requiresStockout).toBe(true);
      expect(resIndef.stockoutStatus).toBe("sold_out");
      expect(resIndef.nextAvailableAt).toBeNull();
    });
  });

  // ==========================================================================
  // 2. Outlet Emergency Pause & Operational Status Switch
  // ==========================================================================
  describe("2. Outlet Emergency Pause & Operational Status Switch", () => {
    beforeEach(() => {
      // Mock localStorage in Node test environment
      const store: Record<string, string> = {};
      vi.stubGlobal("localStorage", {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, val: string) => {
          store[key] = val;
        }),
        removeItem: vi.fn((key: string) => {
          delete store[key];
        }),
        clear: vi.fn(() => {
          for (const k of Object.keys(store)) delete store[k];
        }),
      });
      useOutletStatusStore.getState().resumeOnline();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("provides the four authentic outlet operational presets", () => {
      expect(OUTLET_STATUS_PRESETS.map((p) => p.label)).toEqual([
        "Online (Accepting Orders)",
        "Paused for 30 Mins (Kitchen Catch-up)",
        "Paused for 60 Mins (Lunch / Dinner Surge Recovery)",
        "Offline (Closed for the Day)",
      ]);
    });

    it("calculates paused until timestamp for 30m and 60m accurately", () => {
      const now = new Date("2026-10-17T14:00:00.000Z");

      const paused30 = calculatePausedUntil("PAUSED_30", now);
      expect(new Date(paused30!).getTime() - now.getTime()).toBe(30 * 60 * 1000);

      const paused60 = calculatePausedUntil("PAUSED_60", now);
      expect(new Date(paused60!).getTime() - now.getTime()).toBe(60 * 60 * 1000);

      expect(calculatePausedUntil("ONLINE", now)).toBeNull();
      expect(calculatePausedUntil("OFFLINE", now)).toBeNull();
    });

    it("evaluates pause expiration correctly", () => {
      const now = new Date("2026-10-17T15:00:00.000Z");

      const future = new Date("2026-10-17T15:25:00.000Z").toISOString();
      expect(isOutletPauseExpired(future, now)).toBe(false);

      const past = new Date("2026-10-17T14:59:59.000Z").toISOString();
      expect(isOutletPauseExpired(past, now)).toBe(true);

      expect(isOutletPauseExpired(null, now)).toBe(false);
    });

    it("formats remaining pause countdown strings cleanly", () => {
      const now = new Date("2026-10-17T12:00:00.000Z");

      const in22m = new Date("2026-10-17T12:22:00.000Z").toISOString();
      expect(formatOutletPauseRemaining(in22m, now)).toBe("Back in 22m");

      const in1h = new Date("2026-10-17T13:00:00.000Z").toISOString();
      expect(formatOutletPauseRemaining(in1h, now)).toBe("Back in 1h");

      const in1h15m = new Date("2026-10-17T13:15:00.000Z").toISOString();
      expect(formatOutletPauseRemaining(in1h15m, now)).toBe("Back in 1h 15m");

      const expired = new Date("2026-10-17T11:59:00.000Z").toISOString();
      expect(formatOutletPauseRemaining(expired, now)).toBe("Auto-resuming...");
    });

    it("generates authentic consumer-facing app notices for every status", () => {
      const now = new Date("2026-10-17T18:00:00.000Z");
      const pausedUntil30 = new Date("2026-10-17T18:30:00.000Z").toISOString();

      // 1. ONLINE
      const onlineNotice = getOutletCustomerNotice("ONLINE");
      expect(onlineNotice.isAccepting).toBe(true);
      expect(onlineNotice.headline).toBe("Accepting Orders");
      expect(onlineNotice.tone).toBe("green");

      // 2. PAUSED_30
      const pause30Notice = getOutletCustomerNotice("PAUSED_30", pausedUntil30, now);
      expect(pause30Notice.isAccepting).toBe(false);
      expect(pause30Notice.headline).toBe("Currently not accepting orders");
      expect(pause30Notice.subtext).toContain("Back in 30 mins");
      expect(pause30Notice.badgeLabel).toContain("Back in 30m");
      expect(pause30Notice.tone).toBe("yellow");

      // 3. OFFLINE
      const offlineNotice = getOutletCustomerNotice("OFFLINE");
      expect(offlineNotice.isAccepting).toBe(false);
      expect(offlineNotice.headline).toBe("Currently closed for the day");
      expect(offlineNotice.tone).toBe("red");
    });

    it("manages state persistence and automatic resumption in useOutletStatusStore", () => {
      const store = useOutletStatusStore.getState();
      const serverSyncMock = vi.fn();

      // 1. Set to PAUSED_30
      const baseTime = new Date("2026-10-17T12:00:00.000Z");
      store.setStatus("PAUSED_30", {
        refDate: baseTime,
        onServerSync: serverSyncMock,
      });

      expect(useOutletStatusStore.getState().status).toBe("PAUSED_30");
      expect(useOutletStatusStore.getState().pausedUntil).not.toBeNull();
      expect(serverSyncMock).toHaveBeenCalledWith("PAUSE");
      expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_OUTLET_STATUS_KEY, "PAUSED_30");

      // 2. Before timer expiry (15m in): checkAutoResume should not resume
      const halfTime = new Date(baseTime.getTime() + 15 * 60 * 1000);
      const resumedEarly = useOutletStatusStore.getState().checkAutoResume(halfTime);
      expect(resumedEarly).toBe(false);
      expect(useOutletStatusStore.getState().status).toBe("PAUSED_30");

      // 3. After timer expiry (31m in): checkAutoResume automatically restores ONLINE
      const expiredTime = new Date(baseTime.getTime() + 31 * 60 * 1000);
      const resumed = useOutletStatusStore.getState().checkAutoResume(expiredTime);
      expect(resumed).toBe(true);
      expect(useOutletStatusStore.getState().status).toBe("ONLINE");
      expect(useOutletStatusStore.getState().pausedUntil).toBeNull();
    });
  });

  // ==========================================================================
  // 3. Daily Business Summary & Settlement Ledger Dashboard
  // ==========================================================================
  describe("3. Daily Business Summary & Settlement Ledger Dashboard", () => {
    const orders: DeliveredOrderInput[] = [
      {
        id: "ord_1",
        foodValuePaise: 50000, // ₹500.00
        packingPaise: 3000,    // ₹30.00
        restaurantDiscountPaise: 5000, // -₹50.00
        commissionBps: 2500,   // 25%
        isCod: false,
      },
      {
        id: "ord_2",
        foodValuePaise: 80000, // ₹800.00
        packingPaise: 4000,    // ₹40.00
        restaurantDiscountPaise: 4000, // -₹40.00
        commissionBps: 2500,   // 25%
        isCod: false,
      },
      {
        id: "ord_3",
        foodValuePaise: 30000, // ₹300.00
        packingPaise: 2000,    // ₹20.00
        restaurantDiscountPaise: 0,
        commissionBps: 2500,   // 25%
        isCod: true, // COD order: zero gateway fee
      },
    ];

    it("calculates delivered order count, gross GMV, and taxable supply accurately", () => {
      const summary = calculateDailyBusinessSummary(orders);

      expect(summary.deliveredOrdersCount).toBe(3);

      // Gross GMV = Food (500 + 800 + 300 = 1600) + Packing (30 + 40 + 20 = 90) = ₹1,690.00 (169000 paise)
      expect(summary.grossGmvPaise).toBe(169000);
      expect(formatINR(summary.grossGmvPaise)).toBe("₹1,690.00");

      // Total discounts = 50 + 40 + 0 = 9000 paise
      expect(summary.totalRestaurantDiscountsPaise).toBe(9000);

      // Net Taxable Supply = Gross GMV (169000) - Discounts (9000) = 160000 paise (₹1,600.00)
      expect(summary.netTaxableSupplyPaise).toBe(160000);
      expect(formatINR(summary.netTaxableSupplyPaise)).toBe("₹1,600.00");
    });

    it("computes exact deductions: Platform Commission, 18% Services GST, §9(5) Food GST, and Gateway Fees", () => {
      const summary = calculateDailyBusinessSummary(orders);

      // 1. Platform Commission (25% on taxable base ₹1,600.00) = 40000 paise (₹400.00)
      expect(summary.platformCommissionPaise).toBe(40000);
      expect(formatINR(summary.platformCommissionPaise)).toBe("₹400.00");

      // 2. GST on Services (18% on platform commission ₹400.00) = 7200 paise (₹72.00)
      expect(summary.commissionGstPaise).toBe(7200);
      expect(formatINR(summary.commissionGstPaise)).toBe("₹72.00");

      // 3. GST Section 9(5) Food Tax (5% on ₹1,600.00) = 8000 paise (₹80.00)
      // Note: Remitted directly by platform to Govt as ECO liability; NOT debited from restaurant payout
      expect(summary.sec9_5GstPaise).toBe(8000);
      expect(formatINR(summary.sec9_5GstPaise)).toBe("₹80.00");

      // 4. Payment Gateway Fees on non-COD orders (ord_1 taxable 480 + 24 tax = 50400 paise; ord_2 taxable 800 + 40 tax = 84000 paise)
      // Gateway fee is positive integer paise
      expect(summary.gatewayFeePaise).toBeGreaterThan(0);
      expect(summary.gatewayFeeGstPaise).toBeGreaterThan(0);

      // 5. Total debited deductions = Commission + Commission GST + Gateway fee with GST
      expect(summary.totalDebitedDeductionsPaise).toBe(
        summary.platformCommissionPaise +
          summary.commissionGstPaise +
          summary.totalGatewayFeeWithGstPaise
      );

      // 6. Net Estimated Payout = Net Taxable Supply - Total Debited Deductions
      expect(summary.netEstimatedPayoutPaise).toBe(
        summary.netTaxableSupplyPaise - summary.totalDebitedDeductionsPaise
      );
      expect(summary.netEstimatedPayoutPaise).toBeGreaterThan(0);
    });

    it("calculates T+1 settlement date (Tomorrow 10:00 AM) and countdown timer", () => {
      const testNow = new Date(2026, 9, 17, 16, 30, 0); // 4:30 PM on Oct 17
      const nextDate = getNextSettlementTimestamp(testNow);

      expect(nextDate.getDate()).toBe(18); // Oct 18
      expect(nextDate.getHours()).toBe(10);
      expect(nextDate.getMinutes()).toBe(0);

      // 16:30 today to 10:00 tomorrow = 17 hours 30 mins
      const countdown = formatTPlus1Countdown(nextDate, testNow);
      expect(countdown.formatted).toBe("17h 30m remaining");
      expect(countdown.remainingMs).toBe(17.5 * 60 * 60 * 1000);

      const summary = calculateDailyBusinessSummary(orders, { refDate: testNow });
      expect(summary.settlementCycle).toBe("T+1 Express Daily Payout");
      expect(summary.tPlus1Countdown).toBe("17h 30m remaining");
      expect(summary.nextSettlementFormatted).toContain("at 10:00 AM");
    });
  });
});
