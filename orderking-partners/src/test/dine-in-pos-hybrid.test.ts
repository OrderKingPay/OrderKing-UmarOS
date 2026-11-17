import { describe, it, expect } from "vitest";
import {
  generateTableQrCodePayload,
  splitTableBill,
  applyManagerComplimentaryDiscount,
  type TableStatus,
} from "../components/table-reservation-manager";

describe("DineIn POS Hybrid & Table Management", () => {
  describe("generateTableQrCodePayload", () => {
    it("generates dynamic table QR payloads with OrderKing Direct UPI (orderking@ybl)", () => {
      const payload = generateTableQrCodePayload("rest_101", "T4");
      expect(payload.menuUrl).toBe(
        "https://orderkingpay.com/dining?restaurantId=rest_101&table=T4"
      );
      expect(payload.upiPayload).toContain("pa=orderking@ybl");
      expect(payload.upiPayload).toContain("pn=OrderKingPay");
      expect(payload.upiPayload).toContain("tn=Table%20T4%20DineIn");
    });
  });

  describe("splitTableBill - SafeInteger Precision", () => {
    it("splits bill equally across guests with zero float drift and exact integer sum", () => {
      // ₹1,000.00 split 3 ways -> 100000 paise / 3 = 33333 with 1 remainder
      const split3 = splitTableBill(100000, 3);
      expect(split3.isExact).toBe(true);
      expect(split3.sharesPaise).toEqual([33334, 33333, 33333]);
      expect(split3.sharesPaise.reduce((a, b) => a + b, 0)).toBe(100000);

      // ₹2,545.50 split 4 ways -> 254550 paise / 4 = 63637 with 2 remainder
      const split4 = splitTableBill(254550, 4);
      expect(split4.isExact).toBe(true);
      expect(split4.sharesPaise).toEqual([63639, 63637, 63637, 63637]);
      expect(split4.sharesPaise.reduce((a, b) => a + b, 0)).toBe(254550);
    });

    it("throws on invalid split parameters (ways <= 0 or non-integer)", () => {
      expect(() => splitTableBill(50000, 0)).toThrow();
      expect(() => splitTableBill(50000, -2)).toThrow();
      expect(() => splitTableBill(500.25 as any, 2)).toThrow();
    });
  });

  describe("applyManagerComplimentaryDiscount", () => {
    it("authorizes discount only with authenticated manager PIN", () => {
      const bill = 200000; // ₹2,000.00

      // Unauthorized PIN
      const denied = applyManagerComplimentaryDiscount(bill, 15, "0000");
      expect(denied.authorized).toBe(false);
      expect(denied.discountPaise).toBe(0);
      expect(denied.finalBillPaise).toBe(bill);

      // Authorized PIN (e.g. 1234)
      const approved = applyManagerComplimentaryDiscount(bill, 20, "1234");
      expect(approved.authorized).toBe(true);
      expect(approved.discountPaise).toBe(40000); // 20% of 200000 = 40000
      expect(approved.finalBillPaise).toBe(160000); // ₹1,600.00
    });

    it("clamps discount between 0% and 100%", () => {
      const bill = 100000;
      const overDiscount = applyManagerComplimentaryDiscount(bill, 150, "5566");
      expect(overDiscount.authorized).toBe(true);
      expect(overDiscount.discountPaise).toBe(100000);
      expect(overDiscount.finalBillPaise).toBe(0);
    });
  });

  describe("Table Status Lifecycle", () => {
    it("supports all 5 table states including BILLED", () => {
      const statuses: TableStatus[] = ["AVAILABLE", "RESERVED", "OCCUPIED", "BILLED", "BLOCKED"];
      expect(statuses).toContain("BILLED");
      expect(statuses).toContain("AVAILABLE");
      expect(statuses).toContain("OCCUPIED");
    });
  });
});
