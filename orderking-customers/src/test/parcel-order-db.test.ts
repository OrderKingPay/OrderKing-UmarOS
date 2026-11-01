import { describe, it, expect, vi } from "vitest";

// Framework transport mock for isolated Node/Vitest runtime
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder: any = {
      middleware: () => builder,
      validator: () => builder,
      handler: (handler: any) => handler,
    };
    return builder;
  },
}));

vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => null,
}));

import { getSql } from "../lib/db";
import {
  prepareParcelRazorpayOrder,
  submitParcelOrder,
} from "../lib/server/parcel-order";

describe("Parcel Order Database Storage & Server RPC Integration", () => {
  it("refuses Razorpay order creation without verified provider integration", async () => {
    await expect(prepareParcelRazorpayOrder({
      data: {
        distanceKm: 5.0,
        packageType: "DOCUMENTS",
        isNight: false,
        receipt: `rcpt_test_${Date.now()}`,
      },
    })).rejects.toThrow("Secure online parcel payment");
  });

  it(
    "stores a COD parcel order directly into PostgreSQL orders table with category 'PARCEL'",
    async () => {
      const testKey = `test_idk_cod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const submission = {
        pickup: {
          address: "75 Regal Building, Connaught Place, New Delhi 110001",
          lat: 28.6315,
          lng: 77.2167,
          contactName: "Vikram Malhotra",
          contactPhone: "9810123456",
        },
        drop: {
          address: "DLF Cyber City, Tower B, Gurugram 122002",
          lat: 28.4952,
          lng: 77.0895,
          contactName: "Neha Sharma",
          contactPhone: "9876543210",
        },
        packageType: "HEAVY_BOX" as const,
        packageDescription: "Hardware router & power cables",
        specialInstructions: "Handle with care, call recipient on arrival at reception",
        distanceKm: 8.5,
        isNight: false,
        paymentMethod: "COD" as const,
        idempotencyKey: testKey,
      };

      const result = await submitParcelOrder({ data: submission });

      expect(result.success).toBe(true);
      expect(result.orderId).toMatch(/^ord_/);
      expect(result.publicId).toMatch(/^PKR-/);
      expect(result.deliveryOtp).toHaveLength(4);
      expect(result.paymentMethod).toBe("COD");
      expect(result.paymentStatus).toBe("pending_collection");

      // Expected Fare:
      // Base: ₹30
      // Distance: 8.5 km * ₹10 = ₹85
      // Heavy Box handling: ₹20
      // Total: ₹135.00 (13,500 paise)
      expect(result.totalPaise).toBe(13500);
      expect(result.totalInr).toBe(135);

      // Verify row persisted directly in PostgreSQL orders table
      const sql = await getSql();
      const rows = await sql<{
        id: string;
        public_id: string;
        category: string;
        payment_method: string;
        payment_status: string;
        delivery_fee_paise: number;
        total_paise: number;
        delivery_otp: string;
        address_snapshot: string;
      }>`
        SELECT id, public_id, category, payment_method, payment_status, delivery_fee_paise, total_paise, delivery_otp, address_snapshot
        FROM orders
        WHERE id = ${result.orderId}
        LIMIT 1
      `;

      expect(rows).toHaveLength(1);
      const dbOrder = rows[0]!;
      expect(dbOrder.category).toBe("PARCEL");
      expect(dbOrder.public_id).toBe(result.publicId);
      expect(dbOrder.delivery_otp).toBe(result.deliveryOtp);
      expect(dbOrder.payment_method).toBe("COD");
      expect(dbOrder.total_paise).toBe(13500);

      const snapshot = JSON.parse(dbOrder.address_snapshot);
      expect(snapshot.category).toBe("PARCEL");
      expect(snapshot.packageType).toBe("HEAVY_BOX");
      expect(snapshot.pickup.contactPhone).toBe("9810123456");
      expect(snapshot.drop.contactPhone).toBe("9876543210");

      // Cleanup test record
      await sql`DELETE FROM orders WHERE id = ${result.orderId}`;
    },
    30000
  );

  it(
    "rejects fake simulated online parcel payment safely and transparently",
    async () => {
      const testKey = `test_idk_rzp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const submission = {
        pickup: {
          address: "Koramangala 4th Block, Bengaluru 560034",
          lat: 12.9345,
          lng: 77.6265,
          contactName: "Arjun Verma",
          contactPhone: "9123456789",
        },
        drop: {
          address: "Indiranagar 100 Feet Road, Bengaluru 560038",
          lat: 12.9784,
          lng: 77.6408,
          contactName: "Priya Rao",
          contactPhone: "9845012345",
        },
        packageType: "DOCUMENTS" as const,
        packageDescription: "Notarized rental agreement",
        distanceKm: 4.2,
        isNight: true,
        paymentMethod: "RAZORPAY_ONLINE" as const,
        idempotencyKey: testKey,
        razorpayPayment: {
          razorpayOrderId: `order_sim_${Date.now()}`,
          razorpayPaymentId: `pay_sim_${Date.now()}`,
          razorpaySignature: "simulated_valid_sig",
        },
      };

      await expect(submitParcelOrder({ data: submission })).rejects.toThrow(
        /(Secure online parcel payment is unavailable|Payment signature verification failed)/
      );
    },
    30000
  );
});
