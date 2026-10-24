import crypto from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "../db";
import { newId, publicOrderCode } from "../ids";
import {
  calculateParcelFare,
  PACKAGE_TYPE_CONFIGS,
  estimateCourierTransitMinutes,
} from "../courier/fare";
import type {
  ParcelOrderSubmission,
  ParcelOrderResult,
  PackageType,
} from "../courier/types";
import { getRazorpayConfig, verifyRazorpaySignature } from "./razorpay.server";

export const COD_MAX_PAISE = 200_000; // ₹2,000 maximum ceiling for Cash/Pay on Delivery

export interface ParcelRazorpayRequest {
  distanceKm: number;
  packageType: PackageType;
  isNight?: boolean;
  receipt: string;
}

export interface ParcelRazorpayResponse {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  isSandbox: boolean;
}

/**
 * Core handler to prepare a server-authoritative Razorpay payment order for courier delivery.
 */
async function prepareParcelRazorpayOrderHandler({
  data,
}: {
  data: ParcelRazorpayRequest;
}): Promise<ParcelRazorpayResponse> {
  if (!data.distanceKm || data.distanceKm <= 0) {
    throw new Error("Valid delivery route distance is required.");
  }
  if (!PACKAGE_TYPE_CONFIGS[data.packageType]) {
    throw new Error("Invalid package type selected.");
  }

  const fare = calculateParcelFare({
    distanceKm: data.distanceKm,
    packageType: data.packageType,
    isNight: Boolean(data.isNight),
  });

  const config = getRazorpayConfig();
  const receipt = (data.receipt || `rcpt_pcl_${Date.now()}`).slice(0, 40);

  // If live credentials are available, initialize with Razorpay gateway
  if (config.hasCredentials && config.keyId && config.keySecret) {
    try {
      const authHeader = typeof Buffer !== "undefined"
        ? Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")
        : btoa(`${config.keyId}:${config.keySecret}`);
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
            category: "PARCEL",
            packageType: data.packageType,
            distanceKm: fare.distanceKm.toString(),
          },
        }),
        signal: AbortSignal.timeout(12_000),
      });

      if (res.ok) {
        const rzpData = (await res.json()) as { id: string; amount: number; currency: string };
        return {
          orderId: rzpData.id,
          amountPaise: fare.totalPaise,
          currency: "INR",
          keyId: config.keyId,
          isSandbox: config.keyId.startsWith("rzp_test_"),
        };
      }
    } catch (err) {
      console.warn("Razorpay API call failed, falling back to mock gateway order:", err);
    }
  }

  // Fail closed: a locally generated order ID is not a Razorpay order.
  throw new Error("Secure online parcel payment is currently unavailable. Choose Cash on Delivery.");
}

export const prepareParcelRazorpayOrder = createServerFn({ method: "POST" })
  .validator((data: ParcelRazorpayRequest) => data)
  .handler(prepareParcelRazorpayOrderHandler);

/**
 * Core handler to submit a point-to-point parcel/courier order directly into PostgreSQL orders table.
 */
async function submitParcelOrderHandler({
  data,
}: {
  data: ParcelOrderSubmission;
}): Promise<ParcelOrderResult> {
  // 1. Validate pickup & drop inputs
  if (!data.pickup?.address || data.pickup.address.trim().length < 5) {
    throw new Error("Please provide a complete pickup address (at least 5 characters).");
  }
  const cleanSenderPhone = (data.pickup.contactPhone || "").replace(/\D/g, "");
  if (cleanSenderPhone.length < 10) {
    throw new Error("Please enter a valid 10-digit sender mobile number.");
  }

  if (!data.drop?.address || data.drop.address.trim().length < 5) {
    throw new Error("Please provide a complete drop address (at least 5 characters).");
  }
  const cleanRecipientPhone = (data.drop.contactPhone || "").replace(/\D/g, "");
  if (cleanRecipientPhone.length < 10) {
    throw new Error("Please enter a valid 10-digit recipient mobile number.");
  }

  const packageConfig = PACKAGE_TYPE_CONFIGS[data.packageType];
  if (!packageConfig) {
    throw new Error("Invalid package type. Must be DOCUMENTS, FOOD, KEYS, or HEAVY_BOX.");
  }

  if (!data.distanceKm || data.distanceKm <= 0) {
    throw new Error("Invalid route distance.");
  }

  // 2. Server-authoritative fare calculation
  const fare = calculateParcelFare({
    distanceKm: data.distanceKm,
    packageType: data.packageType,
    isNight: Boolean(data.isNight),
  });

  const totalPaise = fare.totalPaise;

  // 3. Payment verification
  const method = data.paymentMethod;
  if (method !== "RAZORPAY_ONLINE" && method !== "COD") {
    throw new Error("Payment method must be RAZORPAY_ONLINE or COD.");
  }

  if (method === "COD" && totalPaise > COD_MAX_PAISE) {
    throw new Error("Cash on Delivery is limited to orders up to ₹2,000. Please pay via Razorpay UPI.");
  }

  if (method === "RAZORPAY_ONLINE") {
    const config = getRazorpayConfig();
    if (!config.hasCredentials || !config.keyId) {
      throw new Error("Secure online parcel payment is unavailable. Please choose Cash on Delivery.");
    }
    if (!data.razorpayPayment?.razorpayOrderId) {
      throw new Error("Razorpay payment details missing. Please complete payment or choose Cash on Delivery.");
    }
    if (config.keySecret && data.razorpayPayment.razorpaySignature && data.razorpayPayment.razorpayPaymentId) {
      const isSigValid = verifyRazorpaySignature({
        razorpayOrderId: data.razorpayPayment.razorpayOrderId,
        razorpayPaymentId: data.razorpayPayment.razorpayPaymentId,
        razorpaySignature: data.razorpayPayment.razorpaySignature,
      });
      if (!isSigValid) {
        throw new Error("Payment signature verification failed. Please contact customer support.");
      }
    }
  }

  console.log("[submitParcelOrderHandler] Step 4 - resolving user");
  // 4. Resolve authenticated user or fallback guest identity
  let userId = `usr_guest_${cleanSenderPhone.slice(-10)}`;
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest();
    if (req && typeof window === "undefined") {
      try {
        const verifyServer = "../auth/verify.server";
        const { getSessionUser } = await import(/* @vite-ignore */ verifyServer);
        const sessionUser = await getSessionUser();
        if (sessionUser?.id) {
          userId = sessionUser.id;
        }
      } catch {
        // Fallback to guest id
      }
    }
  } catch {
    // Continue with guest user id
  }

  console.log("[submitParcelOrderHandler] Step 5 - getting sql & checking idempotency");
  const sql = await getSql();

  // Check idempotency replay
  if (data.idempotencyKey) {
    try {
      const existing = await sql<{
        id: string;
        public_id: string;
        delivery_otp: string;
        total_paise: number;
        status: string;
      }>`
        SELECT id, public_id, delivery_otp, total_paise, status FROM orders WHERE idempotency_key = ${data.idempotencyKey} LIMIT 1
      `;
      if (existing[0]) {
        const transit = estimateCourierTransitMinutes(fare.distanceKm);
        return {
          success: true,
          orderId: existing[0].id,
          publicId: existing[0].public_id,
          deliveryOtp: existing[0].delivery_otp || "0000",
          totalPaise: existing[0].total_paise,
          totalInr: existing[0].total_paise / 100,
          status: existing[0].status,
          paymentMethod: method,
          paymentStatus: method === "COD" ? "pending_collection" : "paid",
          estimatedPickupMinutes: transit.pickupMinutes,
          estimatedDeliveryMinutes: transit.deliveryMinutes,
        };
      }
    } catch (err) {
      console.error("[submitParcelOrderHandler] Idempotency check error:", err);
      throw err;
    }
  }

  console.log("[submitParcelOrderHandler] Step 6 - resolving zone");
  let zoneId = "del-cp";
  try {
    const zoneRows = await sql<{ id: string }>`SELECT id FROM service_zones WHERE active = true LIMIT 1`;
    if (zoneRows[0]?.id) {
      zoneId = zoneRows[0].id;
    }
  } catch {
    zoneId = "zne_1";
  }

  console.log("[submitParcelOrderHandler] Step 7 - starting transaction");
  const orderId = newId("ord");
  const publicId = publicOrderCode("PKR");
  const deliveryOtp = String(crypto.randomInt(1000, 10000));
  const paymentStatus = method === "COD" ? "pending_collection" : "paid";

  const parcelSnapshot = {
    category: "PARCEL",
    packageType: data.packageType,
    packageLabel: packageConfig.label,
    pickup: {
      address: data.pickup.address.trim(),
      contactName: data.pickup.contactName?.trim() || "Sender",
      contactPhone: cleanSenderPhone,
      lat: data.pickup.lat || 28.6315,
      lng: data.pickup.lng || 77.2167,
    },
    drop: {
      address: data.drop.address.trim(),
      contactName: data.drop.contactName?.trim() || "Recipient",
      contactPhone: cleanRecipientPhone,
      lat: data.drop.lat || 28.5684,
      lng: data.drop.lng || 77.2215,
    },
    distanceKm: fare.distanceKm,
    isNight: Boolean(data.isNight),
    instructions: data.specialInstructions?.trim() || "",
    description: data.packageDescription?.trim() || "",
  };

  const addressSnapshotText = JSON.stringify(parcelSnapshot);
  const notesText = [
    `[PARCEL] ${packageConfig.label}`,
    data.packageDescription ? `Item: ${data.packageDescription}` : null,
    data.specialInstructions ? `Note: ${data.specialInstructions}` : null,
  ]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 240);

  try {
    await sql.transaction(async (tx) => {
      console.log("[submitParcelOrderHandler] In tx: inserting orders");
      await tx`
        INSERT INTO orders (
          id, public_id, user_id, category, restaurant_id, outlet_id, zone_id,
          address_snapshot, parcel_details, status, payment_method, payment_status,
          idempotency_key, food_subtotal_paise, restaurant_discount_paise,
          platform_discount_paise, delivery_fee_paise, service_fee_paise,
          tax_paise, packaging_paise, total_paise, commission_bps, commission_paise,
          restaurant_payable_paise, notes, delivery_otp, data_label, placed_at, updated_at
        ) VALUES (
          ${orderId}, ${publicId}, ${userId}, ${"PARCEL"}, ${null}, ${null}, ${zoneId},
          ${addressSnapshotText}, ${JSON.stringify(parcelSnapshot)}, ${"PLACED"}, ${method}, ${paymentStatus},
          ${data.idempotencyKey || newId("idk")}, ${0}, ${0},
          ${0}, ${totalPaise}, ${0},
          ${0}, ${fare.handlingFeePaise}, ${totalPaise}, ${0}, ${0},
          ${0}, ${notesText}, ${deliveryOtp}, ${"REAL"}, NOW(), NOW()
        )
      `;

      console.log("[submitParcelOrderHandler] In tx: inserting order_items");
      const itemId = `itm_parcel_${data.packageType.toLowerCase()}`;
      const itemName = `Courier - ${packageConfig.label}`;
      await tx`
        INSERT INTO order_items (
          id, order_id, item_id, variant_id, name_snapshot, quantity,
          unit_price_paise, addons_snapshot, instructions, line_total_paise,
          name, qty, unit_paise
        ) VALUES (
          ${newId("oit")}, ${orderId}, ${itemId}, ${null}, ${itemName}, ${1},
          ${totalPaise}, ${"[]"}, ${data.specialInstructions || null}, ${totalPaise},
          ${itemName}, ${1}, ${totalPaise}
        )
      `;

      console.log("[submitParcelOrderHandler] In tx: inserting order_price_lines");
      for (let i = 0; i < fare.breakdown.length; i++) {
        const item = fare.breakdown[i]!;
        await tx`
          INSERT INTO order_price_lines (
            id, order_id, code, name, amount_paise, source, funded_by, reason, sort_order
          ) VALUES (
            ${newId("opl")}, ${orderId}, ${item.code}, ${item.label}, ${item.amountPaise},
            ${"courier"}, ${"CUSTOMER"}, ${item.note || "Standard courier pricing"}, ${i}
          )
        `;
      }

      console.log("[submitParcelOrderHandler] In tx: inserting order_events");
      await tx`
        INSERT INTO order_events (
          id, order_id, from_status, to_status, actor_user_id, actor_role, action, note, created_at
        ) VALUES (
          ${newId("oev")}, ${orderId}, ${null}, ${"PLACED"}, ${userId}, ${"CUSTOMER"},
          ${"PARCEL_ORDER_PLACED"}, ${"Courier pickup requested by sender"}, NOW()
        )
      `;
    });
  } catch (txErr) {
    console.error("[submitParcelOrderHandler] Transaction error:", txErr);
    throw txErr;
  }

  const transit = estimateCourierTransitMinutes(fare.distanceKm);

  return {
    success: true,
    orderId,
    publicId,
    deliveryOtp,
    totalPaise,
    totalInr: fare.totalInr,
    status: "PLACED",
    paymentMethod: method,
    paymentStatus,
    estimatedPickupMinutes: transit.pickupMinutes,
    estimatedDeliveryMinutes: transit.deliveryMinutes,
  };
}

export const submitParcelOrder = createServerFn({ method: "POST" })
  .validator((data: ParcelOrderSubmission) => data)
  .handler(submitParcelOrderHandler);
