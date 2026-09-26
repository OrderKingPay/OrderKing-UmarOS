import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { RiderEngine, rangePreset } from "@/lib/rider/engine";
import { PgStore } from "@/lib/rider/pg-store";
import { ensureLiveRiderAssigned, transitionLiveOrder, fetchLiveOffers, respondLiveOffer } from "./hdmaster-order-transition";
import {
  RiderError,
  type AvailabilityStatus,
  type LocaleCode,
  type RiderProfile,
} from "@/lib/rider/types";

async function engine() {
  const sql = await getSql();
  return new RiderEngine(new PgStore(sql));
}

function fail(e: unknown): never {
  if (e instanceof RiderError) throw e;
  throw e;
}

export const getPublicConfigFn = createServerFn({ method: "GET" }).handler(async () => {
  const e = await engine();
  return e.getPublicConfig();
});

export const bootstrapRiderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      const e = await engine();
      return await e.ensureRider({ id: context.userId });
    } catch (err) {
      fail(err);
    }
  });

export const getHomeFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      const e = await engine();
      await e.ensureRider({ id: context.userId });
      let home = await e.home(context.userId);
      if (process.env.HDMASTER_URL && process.env.ORDERKING_SERVICE_TOKEN) {
        try {
          const offers = await fetchLiveOffers(context.userId);
          if (offers && offers.length > 0) {
            const o = offers[0];
            const existingOffer = await e.getStore().getOpenOfferForRider(home.rider.id);
            if (!existingOffer || existingOffer.orderCode !== o.order_id) {
              if (existingOffer) {
                 await e.getStore().casOffer(existingOffer.id, home.rider.id, "EXPIRED");
              }
              const restaurant = { id: o.restaurant_id ?? "live_restaurant", name: o.restaurant_name ?? "Restaurant", area: "", address: o.restaurant_address ?? "", location: { lat: o.restaurant_lat ?? 0, lng: o.restaurant_lng ?? 0 }, phoneMasked: "XXX", specialPickupInstructions: null, preparationStatus: "READY" as const };
              const customer = { displayName: o.customer_name ?? "Customer", area: o.zone_name ?? "", address: o.customer_address ?? o.zone_name ?? "", contactMasked: null, contactAllowed: false, instructions: null };
              await e.getStore().insertDelivery({
                id: o.order_id,
                orderCode: o.order_id,
                orderId: o.order_id,
                offerId: o.id,
                userId: context.userId,
                riderId: home.rider.id,
                state: "OFFERED",
                dataMode: "LIVE",
                expectedPayoutPaise: o.expected_payout_paise ?? 0,
                restaurant,
                customer,
                pickupWindowStart: o.offered_at,
                pickupWindowEnd: o.expires_at,
                dropoffWindowStart: o.offered_at,
                dropoffWindowEnd: o.expires_at,
                routeScore: o.score,
                createdAt: o.offered_at,
              });
              await e.getStore().insertOffer({
                id: o.id,
                orderCode: o.order_id,
                riderId: home.rider.id,
                dataMode: "LIVE",
                status: "OPEN",
                expectedPayoutPaise: o.expected_payout_paise ?? 0,
                expectedDistanceM: o.distance_m ?? 0,
                expectedEtaSeconds: o.eta_seconds ?? 0,
                restaurant,
                customer,
                pickupWindowStart: o.offered_at,
                pickupWindowEnd: o.expires_at,
                dropoffWindowStart: o.offered_at,
                dropoffWindowEnd: o.expires_at,
                offeredAt: o.offered_at,
                expiresAt: o.expires_at,
                routeScore: o.score,
              }, context.userId);
              home = await e.home(context.userId);
            }
          }
        } catch (err) {
          console.error("Failed to fetch live offers", err);
        }
      }
      return home;
    } catch (err) {
      fail(err);
    }
  });

export const saveProfileFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: Partial<RiderProfile>) => input)
  .handler(async ({ context, data }) => {
    try {
      const e = await engine();
      await e.ensureRider({ id: context.userId });
      return await e.saveProfile(context.userId, data);
    } catch (err) {
      fail(err);
    }
  });

export const submitKycFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      const e = await engine();
      return await e.submitKyc(context.userId);
    } catch (err) {
      fail(err);
    }
  });

export const setStatusFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { status: AvailabilityStatus; confirmed: boolean }) => input)
  .handler(async ({ context, data }) => {
    try {
      const e = await engine();
      return await e.setStatus(context.userId, data.status, data.confirmed);
    } catch (err) {
      fail(err);
    }
  });

export const respondOfferFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      offerId: string;
      decision: "ACCEPT" | "DECLINE";
      reason?: string;
      idempotencyKey: string;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    try {
      const e = await engine();
      const offer = await e.getStore().getOfferById(data.offerId);
      if (offer && offer.dataMode === "LIVE" && process.env.HDMASTER_URL && process.env.ORDERKING_SERVICE_TOKEN) {
        try {
          await respondLiveOffer({ offerId: data.offerId, decision: data.decision, reason: data.reason, idempotencyKey: data.idempotencyKey, riderUserId: context.userId });
        } catch (err) {
          console.error("Failed to respond to live offer", err);
        }
      }
      return await e.respondOffer(
        context.userId,
        data.offerId,
        data.decision,
        data.reason,
        data.idempotencyKey,
      );
    } catch (err) {
      fail(err);
    }
  });

export const deliveryActionFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      deliveryId: string;
      action:
        | "ARRIVING"
        | "ARRIVE_RESTAURANT"
        | "NOT_READY"
        | "PICKUP"
        | "START"
        | "ARRIVE_CUSTOMER"
        | "COLLECT_CASH"
        | "DELIVER"
        | "UNAVAILABLE"
        | "CONTACT"
        | "CANCEL"
        | "POD";
      idempotencyKey: string;
      pickupCode?: string;
      otp?: string;
      reason?: string;
      confirmed?: boolean;
      expectedReadyAt?: string;
      pod?: { method: "PHOTO" | "OTP"; contentType?: string; dataUrl?: string; bytes?: number };
    }) => input,
  )
  .handler(async ({ context, data }) => {
    try {
      const e = await engine();
      const id = data.deliveryId;
      const key = data.idempotencyKey;

      const liveSyncAction = ["PICKUP", "START", "ARRIVE_CUSTOMER", "DELIVER", "UNAVAILABLE", "CANCEL"].includes(data.action);
      if (liveSyncAction) {
        const current = await e.getDelivery(context.userId, id);
        if (current.dataMode === "LIVE") {
          if (data.action === "PICKUP" && ["OFFERED", "ACCEPTED", "ARRIVING_AT_RESTAURANT", "ARRIVED_AT_RESTAURANT"].includes(current.state)) {
            await ensureLiveRiderAssigned({ orderId: current.orderId, riderId: current.riderId, riderUserId: context.userId, idempotencyKey: `${key}:assign` });
          }
          await transitionLiveOrder({
            orderId: current.orderId,
            riderId: current.riderId,
            riderUserId: context.userId,
            deliveryState: current.state,
            action: data.action,
            idempotencyKey: key,
            reason: data.reason,
          });
        }
      }

      switch (data.action) {
        case "ARRIVING":
          return { delivery: await e.arriving(context.userId, id, key) };
        case "ARRIVE_RESTAURANT":
          return { delivery: await e.arriveRestaurant(context.userId, id, key) };
        case "NOT_READY":
          return {
            delivery: await e.restaurantNotReady(context.userId, id, data.expectedReadyAt ?? null),
          };
        case "PICKUP":
          return {
            delivery: await e.pickup(
              context.userId,
              id,
              { method: "ORDER_CODE", code: data.pickupCode },
              key,
            ),
          };
        case "START":
          return { delivery: await e.startDelivery(context.userId, id, key) };
        case "ARRIVE_CUSTOMER":
          return { delivery: await e.arriveCustomer(context.userId, id, key) };
        case "COLLECT_CASH":
          return { cash: await e.collectCash(context.userId, id, key) };
        case "DELIVER":
          return { delivery: await e.deliver(context.userId, id, data.otp, key) };
        case "UNAVAILABLE":
          return { delivery: await e.customerUnavailable(context.userId, id) };
        case "CONTACT":
          return { delivery: await e.contactAttempt(context.userId, id) };
        case "CANCEL":
          return {
            delivery: await e.cancelDelivery(
              context.userId,
              id,
              data.reason ?? "",
              Boolean(data.confirmed),
              key,
            ),
          };
        case "POD":
          if (!data.pod) throw new RiderError("INVALID", "Photo proof is required", 400);
          return { pod: await e.addPod(context.userId, id, data.pod) };
        default:
          throw new RiderError("INVALID", "Unknown action", 400);
      }
    } catch (err) {
      fail(err);
    }
  });

export const postLocationFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: { lat: number; lng: number; accuracyM: number | null; deliveryId: string | null }) =>
      input,
  )
  .handler(async ({ context, data }) => {
    try {
      const e = await engine();
      return await e.postLocation(
        context.userId,
        { lat: data.lat, lng: data.lng },
        data.accuracyM,
        data.deliveryId,
      );
    } catch (err) {
      fail(err);
    }
  });

export const getEarningsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { preset: "today" | "yesterday" | "week" | "month"; from?: string; to?: string }) => input)
  .handler(async ({ context, data }) => {
    try {
      const e = await engine();
      const range =
        data.from && data.to ? { from: data.from, to: data.to } : rangePreset(data.preset);
      return await e.earnings(context.userId, range);
    } catch (err) {
      fail(err);
    }
  });

export const getHistoryFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { preset: "today" | "yesterday" | "week" | "month" }) => input)
  .handler(async ({ context, data }) => {
    try {
      const e = await engine();
      return await e.history(context.userId, rangePreset(data.preset));
    } catch (err) {
      fail(err);
    }
  });

export const getSettlementsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      const e = await engine();
      return await e.settlements(context.userId);
    } catch (err) {
      fail(err);
    }
  });

export const getPerformanceFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      const e = await engine();
      return await e.performance(context.userId);
    } catch (err) {
      fail(err);
    }
  });

export const createTicketFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      topic:
        | "ORDER_ISSUE"
        | "RESTAURANT_ISSUE"
        | "CUSTOMER_UNAVAILABLE"
        | "CASH_DISPUTE"
        | "PAYMENT_ISSUE"
        | "APP_ISSUE"
        | "VEHICLE_PROBLEM"
        | "SAFETY_ISSUE"
        | "OTHER";
      message: string;
      deliveryId?: string | null;
      idempotencyKey: string;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    try {
      const e = await engine();
      return await e.createTicket(
        context.userId,
        { topic: data.topic, message: data.message, deliveryId: data.deliveryId },
        data.idempotencyKey,
      );
    } catch (err) {
      fail(err);
    }
  });

export const listTicketsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      const e = await engine();
      return await e.tickets(context.userId);
    } catch (err) {
      fail(err);
    }
  });

export const reportSafetyFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      kind:
        | "EMERGENCY_CALL"
        | "SHARE_LOCATION"
        | "UNSAFE_SITUATION"
        | "ROAD_BLOCKAGE"
        | "ACCIDENT"
        | "CUSTOMER_ISSUE"
        | "RESTAURANT_ISSUE"
        | "PLATFORM_SUPPORT";
      note: string;
      deliveryId?: string | null;
      lat?: number | null;
      lng?: number | null;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    try {
      const e = await engine();
      return await e.safety(context.userId, {
        kind: data.kind,
        note: data.note,
        deliveryId: data.deliveryId,
        location: data.lat != null && data.lng != null ? { lat: data.lat, lng: data.lng } : null,
      });
    } catch (err) {
      fail(err);
    }
  });

export const listNotificationsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      const e = await engine();
      return await e.notifications(context.userId);
    } catch (err) {
      fail(err);
    }
  });

export const setLocaleFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { locale: LocaleCode }) => input)
  .handler(async ({ context, data }) => {
    try {
      const e = await engine();
      await e.ensureRider({ id: context.userId });
      return await e.setLocale(context.userId, data.locale);
    } catch (err) {
      fail(err);
    }
  });

export const getDeliveryFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { deliveryId: string }) => input)
  .handler(async ({ context, data }) => {
    try {
      const e = await engine();
      const delivery = await e.getDelivery(context.userId, data.deliveryId);
      const otpResult =
        process.env.NODE_ENV === "production"
          ? null
          : await e.otpForSimulation(context.userId, data.deliveryId);
      const simulatedOtp = typeof otpResult === "string" ? otpResult : null;
      return { delivery, simulatedOtp };
    } catch (err) {
      fail(err);
    }
  });

export const assistantSnapshotFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      const e = await engine();
      return await e.snapshotForAssistant(context.userId);
    } catch (err) {
      fail(err);
    }
  });



export const riderAiSupportFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { message: string; locale?: LocaleCode; deliveryId?: string | null }) => input)
  .handler(async ({ context, data }) => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new RiderError("AI_UNAVAILABLE", "OpenAI support is not configured on the rider server.", 503);
    const message = data.message.trim();
    if (!message) throw new RiderError("INVALID", "Describe the issue first.", 400);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_RIDER_MODEL?.trim() || "gpt-5.6-luna",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: [
              "You are OrderKing Rider AI Support.",
              "Give concise, practical, safety-first guidance for delivery partners.",
              "Never claim money was credited, a call was placed, a rider was reassigned, or an operational action occurred unless a verified tool result confirms it.",
              "For financial, safety, account, KYC, or delivery-state mutations, explain the next verified action and escalate when required.",
              "If the issue requires a platform mutation, direct the rider to the appropriate in-app action or support ticket.",
              `Rider user id: ${context.userId}`,
              `Locale: ${data.locale ?? "en"}`,
              `Delivery id: ${data.deliveryId ?? "none"}`,
            ].join("\n"),
          },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new RiderError("AI_UNAVAILABLE", `OpenAI support request failed (${response.status}). ${body.slice(0, 300)}`, 503);
    }
    const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) throw new RiderError("AI_UNAVAILABLE", "OpenAI returned no support response.", 503);
    return { provider: "openai", model: process.env.OPENAI_RIDER_MODEL?.trim() || "gpt-5.6-luna", text };
  });
