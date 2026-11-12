import crypto from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "../db";
import { newId, publicOrderCode } from "../ids";
import { getRazorpayConfig, verifyRazorpaySignature } from "./razorpay.server";

export type CabVehicleTier = "MINI" | "SEDAN" | "SUV" | "EV";
export type CabServiceCategory = "City Taxi" | "Airport Transfer" | "Intercity One-Way" | "Hourly Rental";

export const CAB_TIER_CONFIG: Record<
  CabVehicleTier,
  { label: string; vehicleModel: string; seats: number; multiplier: number; etaMinutes: number }
> = {
  MINI: {
    label: "Compact Mini",
    vehicleModel: "Maruti WagonR / Celerio AC",
    seats: 4,
    multiplier: 0.8,
    etaMinutes: 5,
  },
  SEDAN: {
    label: "Prime Sedan",
    vehicleModel: "Maruti Suzuki Dzire / Etios AC",
    seats: 4,
    multiplier: 1.0,
    etaMinutes: 4,
  },
  EV: {
    label: "Electric Green Taxi",
    vehicleModel: "Tata Tigor EV / Xpres-T",
    seats: 4,
    multiplier: 0.95,
    etaMinutes: 4,
  },
  SUV: {
    label: "Prime SUV",
    vehicleModel: "Toyota Innova Crysta / Ertiga",
    seats: 6,
    multiplier: 1.55,
    etaMinutes: 6,
  },
};

export function calculateCabFare(params: {
  tier: CabVehicleTier;
  category: CabServiceCategory;
  distanceKm?: number;
}) {
  const tierCfg = CAB_TIER_CONFIG[params.tier] || CAB_TIER_CONFIG.SEDAN;
  const categoryBasePaise =
    params.category === "Airport Transfer"
      ? 95000
      : params.category === "Intercity One-Way"
        ? 285000
        : params.category === "Hourly Rental"
          ? 165000
          : 55000;

  const baseFarePaise = Math.round(categoryBasePaise * tierCfg.multiplier);
  const taxPaise = Math.round(baseFarePaise * 0.05);
  const totalPaise = baseFarePaise + taxPaise;
  return {
    baseFarePaise,
    taxPaise,
    totalPaise,
    totalInr: totalPaise / 100,
    etaMinutes: tierCfg.etaMinutes,
  };
}

export interface CabRazorpayRequest {
  tier: CabVehicleTier;
  category: CabServiceCategory;
  receipt: string;
}

export interface CabRazorpayResponse {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  isSandbox: boolean;
}

export const prepareCabRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: CabRazorpayRequest) => data)
  .handler(async ({ data }): Promise<CabRazorpayResponse> => {
    if (!CAB_TIER_CONFIG[data.tier]) {
      throw new Error("Invalid cab tier selected.");
    }
    const fare = calculateCabFare({ tier: data.tier, category: data.category });
    const config = getRazorpayConfig();
    if (!config.hasCredentials || !config.keyId || !config.keySecret) {
      throw new Error("Online cab payment gateway is unavailable. Please choose Cash / UPI to Driver.");
    }

    const receipt = (data.receipt || `cab_${Date.now()}`).slice(0, 40);
    const authHeader = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: fare.totalPaise,
        currency: "INR",
        receipt,
        notes: {
          category: "CAB",
          tier: data.tier,
          serviceCategory: data.category,
        },
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      throw new Error("Payment gateway could not initiate cab checkout.");
    }
    const rzpData = (await res.json()) as { id?: string; amount?: number; currency?: string };
    if (!rzpData.id || rzpData.amount !== fare.totalPaise || rzpData.currency !== "INR") {
      throw new Error("Invalid payment gateway response.");
    }
    return {
      orderId: rzpData.id,
      amountPaise: fare.totalPaise,
      currency: "INR",
      keyId: config.keyId,
      isSandbox: config.keyId.startsWith("rzp_test_"),
    };
  });

export interface CabRideSubmission {
  tier: CabVehicleTier;
  category: CabServiceCategory;
  pickupAddress: string;
  dropAddress: string;
  travelDate: string;
  pickupTime: string;
  passengerPhone: string;
  passengerName?: string;
  paymentMethod: "RAZORPAY_ONLINE" | "COD";
  idempotencyKey?: string;
  razorpayPayment?: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amountPaise: number;
  };
}

export interface CabRideResult {
  success: boolean;
  orderId: string;
  publicId: string;
  rideOtp: string;
  totalPaise: number;
  totalInr: number;
  status: string;
  paymentMethod: "RAZORPAY_ONLINE" | "COD";
  paymentStatus: string;
  etaMinutes: number;
}

export const submitCabRideOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: CabRideSubmission) => data)
  .handler(async ({ context, data }): Promise<CabRideResult> => {
    if (!data.pickupAddress || data.pickupAddress.trim().length < 4) {
      throw new Error("Please enter a valid pickup location.");
    }
    if (!data.dropAddress || data.dropAddress.trim().length < 4) {
      throw new Error("Please enter a valid drop location.");
    }
    const cleanPhone = (data.passengerPhone || "").replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      throw new Error("Please enter a valid 10-digit mobile number.");
    }
    const tierCfg = CAB_TIER_CONFIG[data.tier];
    if (!tierCfg) {
      throw new Error("Invalid vehicle category.");
    }

    const fare = calculateCabFare({ tier: data.tier, category: data.category });
    const method = data.paymentMethod;
    if (method !== "RAZORPAY_ONLINE" && method !== "COD") {
      throw new Error("Invalid payment method.");
    }
    if (method === "COD" && fare.totalPaise > 500_000) {
      throw new Error("Cash / Pay to driver is capped at ₹5,000. Please pay online via Razorpay.");
    }

    if (method === "RAZORPAY_ONLINE") {
      const config = getRazorpayConfig();
      if (!config.hasCredentials || !config.keyId || !config.keySecret) {
        throw new Error("Online payment gateway unavailable. Please choose Pay to Driver.");
      }
      const rzp = data.razorpayPayment;
      if (!rzp?.razorpayOrderId || !rzp.razorpayPaymentId || !rzp.razorpaySignature) {
        throw new Error("Payment verification details missing.");
      }
      if (rzp.amountPaise !== fare.totalPaise) {
        throw new Error("Paid amount does not match server fare.");
      }
      const valid = verifyRazorpaySignature({
        razorpayOrderId: rzp.razorpayOrderId,
        razorpayPaymentId: rzp.razorpayPaymentId,
        razorpaySignature: rzp.razorpaySignature,
      });
      if (!valid) {
        throw new Error("Payment signature verification failed.");
      }
    }

    const sql = await getSql();
    const userId = String(context.userId);

    if (data.idempotencyKey) {
      const existing = await sql<{
        id: string;
        public_id: string;
        delivery_otp: string | null;
        total_paise: number;
        status: string;
      }>`
        SELECT id, public_id, delivery_otp, total_paise, status
        FROM orders
        WHERE idempotency_key = ${data.idempotencyKey}
        LIMIT 1
      `;
      if (existing[0]) {
        return {
          success: true,
          orderId: existing[0].id,
          publicId: existing[0].public_id,
          rideOtp: existing[0].delivery_otp || "0000",
          totalPaise: existing[0].total_paise,
          totalInr: existing[0].total_paise / 100,
          status: existing[0].status,
          paymentMethod: method,
          paymentStatus: method === "COD" ? "pending_collection" : "paid",
          etaMinutes: fare.etaMinutes,
        };
      }
    }

    let zoneId = "del-cp";
    try {
      const zones = await sql<{ id: string }>`SELECT id FROM service_zones WHERE active = true LIMIT 1`;
      if (zones[0]?.id) zoneId = zones[0].id;
    } catch {
      zoneId = "zne_1";
    }

    const orderId = newId("ord");
    const publicId = publicOrderCode("CAB");
    const rideOtp = String(crypto.randomInt(1000, 10000));
    const paymentStatus = method === "COD" ? "pending_collection" : "paid";
    const snapshot = {
      category: "CAB",
      serviceCategory: data.category,
      tier: data.tier,
      vehicleLabel: `${tierCfg.label} (${tierCfg.vehicleModel})`,
      pickup: {
        address: data.pickupAddress.trim(),
        contactName: data.passengerName?.trim() || "Passenger",
        contactPhone: cleanPhone,
      },
      drop: {
        address: data.dropAddress.trim(),
      },
      travelDate: data.travelDate,
      pickupTime: data.pickupTime,
    };
    const notesText = `[CAB] ${tierCfg.label} · ${data.category} · ${data.travelDate} ${data.pickupTime}`.slice(0, 240);

    await sql.transaction(async (tx) => {
      await tx`
        INSERT INTO orders (
          id, public_id, user_id, category, restaurant_id, outlet_id, zone_id,
          address_snapshot, parcel_details, status, payment_method, payment_status,
          idempotency_key, food_subtotal_paise, restaurant_discount_paise,
          platform_discount_paise, delivery_fee_paise, service_fee_paise,
          tax_paise, packaging_paise, total_paise, commission_bps, commission_paise,
          restaurant_payable_paise, notes, delivery_otp, data_label, placed_at, updated_at
        ) VALUES (
          ${orderId}, ${publicId}, ${userId}, ${"CAB"}, ${null}, ${null}, ${zoneId},
          ${JSON.stringify(snapshot)}, ${JSON.stringify(snapshot)}, ${"PLACED"}, ${method}, ${paymentStatus},
          ${data.idempotencyKey || newId("idk")}, ${fare.baseFarePaise}, ${0},
          ${0}, ${0}, ${0},
          ${fare.taxPaise}, ${0}, ${fare.totalPaise}, ${0}, ${0},
          ${0}, ${notesText}, ${rideOtp}, ${"REAL"}, NOW(), NOW()
        )
      `;
      await tx`
        INSERT INTO order_items (
          id, order_id, item_id, variant_id, name_snapshot, quantity,
          unit_price_paise, addons_snapshot, instructions, line_total_paise
        ) VALUES (
          ${newId("oit")}, ${orderId}, ${`cab_${data.tier.toLowerCase()}`}, ${null},
          ${`${tierCfg.label} · ${data.category}`}, ${1},
          ${fare.totalPaise}, ${"[]"}, ${`${data.pickupAddress.trim()} -> ${data.dropAddress.trim()}`}, ${fare.totalPaise}
        )
      `;
      await tx`
        INSERT INTO order_price_lines (
          id, order_id, code, name, amount_paise, source, funded_by, reason, sort_order
        ) VALUES (
          ${newId("opl")}, ${orderId}, ${"CAB_BASE"}, ${"Base Cab Fare"}, ${fare.baseFarePaise},
          ${"cab"}, ${"CUSTOMER"}, ${"Distance & vehicle tier tariff"}, ${0}
        ), (
          ${newId("opl")}, ${orderId}, ${"GST_5"}, ${"Statutory GST (5%)"}, ${fare.taxPaise},
          ${"cab"}, ${"CUSTOMER"}, ${"Transport GST"}, ${1}
        )
      `;
      await tx`
        INSERT INTO order_events (
          id, order_id, from_status, to_status, actor_user_id, actor_role, note, created_at
        ) VALUES (
          ${newId("oev")}, ${orderId}, ${null}, ${"PLACED"}, ${userId}, ${"CUSTOMER"},
          ${"Cab ride requested; awaiting live driver dispatch"}, NOW()
        )
      `;
    });

    return {
      success: true,
      orderId,
      publicId,
      rideOtp,
      totalPaise: fare.totalPaise,
      totalInr: fare.totalInr,
      status: "PLACED",
      paymentMethod: method,
      paymentStatus,
      etaMinutes: fare.etaMinutes,
    };
  });
