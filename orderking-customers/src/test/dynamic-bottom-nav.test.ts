import { describe, it, expect } from "vitest";
import {
  DYNAMIC_PRIMARY_TABS,
  DYNAMIC_HISTORY_CONFIG,
  resolveActiveVertical,
  resolvePlatformContext,
  CUSTOMER_PRIMARY_TABS,
} from "@/components/navigation/floating-bottom-nav";

describe("Dynamic 5-Tab Bottom Navigation & Vertical Switching Suite", () => {
  it("defines 4 primary foundation tabs [1: OrderKing | 2: Tutor & Jobs | 3: KingPay | 4: Travel]", () => {
    expect(DYNAMIC_PRIMARY_TABS.map((t) => t.id)).toEqual([
      "orderking",
      "tutor-jobs",
      "kingpay",
      "travel",
    ]);
    expect(DYNAMIC_PRIMARY_TABS.map((t) => t.label)).toEqual([
      "OrderKing",
      "Tutor & Jobs",
      "KingPay",
      "Travel",
    ]);
    expect(DYNAMIC_PRIMARY_TABS.map((t) => t.to)).toEqual([
      "/",
      "/tutor",
      "/king-pay",
      "/travel",
    ]);
  });

  describe("Tab 5 Dynamic History Vertical Switching", () => {
    it("switches Tab 5 to 'My Orders' (/orders, 'Food & Mart') for 'orderking' vertical", () => {
      const config = DYNAMIC_HISTORY_CONFIG.orderking;
      expect(config.label).toBe("My Orders");
      expect(config.to).toBe("/orders");
      expect(config.badge).toBe("Food & Mart");
    });

    it("switches Tab 5 to 'My Classes & Jobs' (/tutor-jobs/history, 'Applied & Booked') for 'tutor-jobs' vertical", () => {
      const config = DYNAMIC_HISTORY_CONFIG["tutor-jobs"];
      expect(config.label).toBe("My Classes & Jobs");
      expect(config.to).toBe("/tutor-jobs/history");
      expect(config.badge).toBe("Applied & Booked");
    });

    it("switches Tab 5 to 'Passbook' (/kingpay/passbook, 'UPI & Remit') for 'kingpay' vertical", () => {
      const config = DYNAMIC_HISTORY_CONFIG.kingpay;
      expect(config.label).toBe("Passbook");
      expect(config.to).toBe("/kingpay/passbook");
      expect(config.badge).toBe("UPI & Remit");
    });

    it("switches Tab 5 to 'My Trips' (/travel/trips, 'PNR & Tickets') for 'travel' vertical", () => {
      const config = DYNAMIC_HISTORY_CONFIG.travel;
      expect(config.label).toBe("My Trips");
      expect(config.to).toBe("/travel/trips");
      expect(config.badge).toBe("PNR & Tickets");
    });
  });

  describe("Active Vertical Resolution", () => {
    it("resolves vertical correctly from pathnames", () => {
      expect(resolveActiveVertical("/")).toBe("orderking");
      expect(resolveActiveVertical("/orders")).toBe("orderking");
      expect(resolveActiveVertical("/delivery")).toBe("orderking");
      expect(resolveActiveVertical("/dining")).toBe("orderking");
      expect(resolveActiveVertical("/search")).toBe("orderking");

      expect(resolveActiveVertical("/tutor")).toBe("tutor-jobs");
      expect(resolveActiveVertical("/tutor-jobs/history")).toBe("tutor-jobs");

      expect(resolveActiveVertical("/king-pay")).toBe("kingpay");
      expect(resolveActiveVertical("/kingpay/passbook")).toBe("kingpay");
      expect(resolveActiveVertical("/wallet")).toBe("kingpay");
      expect(resolveActiveVertical("/earn")).toBe("kingpay");

      expect(resolveActiveVertical("/travel")).toBe("travel");
      expect(resolveActiveVertical("/travel/trips")).toBe("travel");
    });

    it("handles fallback and nullish pathname gracefully", () => {
      expect(resolveActiveVertical(null)).toBe("orderking");
      expect(resolveActiveVertical(undefined)).toBe("orderking");
      expect(resolveActiveVertical("")).toBe("orderking");
    });
  });

  describe("Backward Compatibility Invariants", () => {
    it("preserves CUSTOMER_PRIMARY_TABS invariant", () => {
      expect(CUSTOMER_PRIMARY_TABS.map((t) => t.to)).toEqual([
        "/",
        "/tutor",
        "/king-pay",
        "/travel",
        "/orders",
      ]);
    });

    it("preserves resolvePlatformContext platform resolution", () => {
      expect(resolvePlatformContext("/")).toBe("delivery");
      expect(resolvePlatformContext("/king-pay")).toBe("kingpay");
      expect(resolvePlatformContext("/travel")).toBe("travel");
      expect(resolvePlatformContext("/tutor")).toBe("tutor");
    });
  });
});
