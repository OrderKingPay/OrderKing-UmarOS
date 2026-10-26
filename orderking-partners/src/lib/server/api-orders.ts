import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { newId, asInt, asIso } from "@/lib/utils";
import { assertTransition, isOrderState, SIMULATED_RIDER_NEXT, type OrderState } from "@/lib/orders/state-machine";
import { withVendor, writeAudit, notifyInApp } from "./helpers";
import { coreUrl, serviceToken } from "./hdmaster-order-transition";
import { isOpenAt, minutesUntilClose, type Shift, type Weekday } from "@/lib/hours";

type OrderRow = { id: string; order_number: string; restaurant_id: string; outlet_id: string; state: string; placed_at: string; customer_area: string | null; payment_method: string; is_cod: boolean; special_instructions: string | null; prep_minutes: number; food_value_paise: number; packing_paise: number; restaurant_discount_paise: number; platform_funded_discount_paise: number; tax_paise: number; platform_fee_paise: number; commission_bps: number; commission_paise: number; other_deductions_paise: number; other_deductions_code: string | null; refund_adjustment_paise: number; restaurant_payable_paise: number; customer_total_paise: number; data_label: string; reject_reason: string | null };
type OrderLineView = { id: string; itemName: string; variantName: string | null; quantity: number; unitPricePaise: number; lineTotalPaise: number; specialInstructions: string | null; addons: { name: string; pricePaise: number }[] };
type OrderEventView = { id: string; previousState: string | null; newState: string; actor: string; reason: string | null; at: string };

function mapOrder(row: OrderRow, lines: OrderLineView[], events: OrderEventView[]) {
  return { id: row.id, orderNumber: row.order_number, restaurantId: row.restaurant_id, outletId: row.outlet_id, state: row.state, placedAt: asIso(row.placed_at), customerArea: row.customer_area, paymentMethod: row.payment_method, isCod: row.is_cod === true || (row.is_cod as unknown) === "t", specialInstructions: row.special_instructions, prepMinutes: asInt(row.prep_minutes), rejectReason: row.reject_reason, dataLabel: row.data_label, prices: { foodValuePaise: asInt(row.food_value_paise), packingPaise: asInt(row.packing_paise), restaurantDiscountPaise: asInt(row.restaurant_discount_paise), platformFundedDiscountPaise: asInt(row.platform_funded_discount_paise), taxPaise: asInt(row.tax_paise), platformFeePaise: asInt(row.platform_fee_paise), commissionBps: asInt(row.commission_bps), commissionPaise: asInt(row.commission_paise), otherDeductionsPaise: asInt(row.other_deductions_paise), otherDeductionsCode: row.other_deductions_code, refundAdjustmentPaise: asInt(row.refund_adjustment_paise), restaurantPayablePaise: asInt(row.restaurant_payable_paise), customerTotalPaise: asInt(row.customer_total_paise) }, lines, events };
}

export const listOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d: { restaurantId?: string; scope?: "live" | "history" | "all" }) => d).handler(async ({ context, data }) => {
  return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
    const scope = data.scope ?? "live";
    const res = await fetch(`${coreUrl()}/v1/admin/restaurants/${ctx.restaurantId}/partner-orders?scope=${scope}`, {
      headers: { authorization: `Bearer ${serviceToken()}` }
    });
    const payload: any = await res.json();
    const { rows, lines, events } = payload.data || { rows: [], lines: [], events: [] };

    const linesByOrder = new Map<string, OrderLineView[]>();
    for (const line of lines) { const list = linesByOrder.get(line.order_id) ?? []; list.push({ id: line.id, itemName: line.item_name, variantName: line.variant_name, quantity: asInt(line.quantity), unitPricePaise: asInt(line.unit_price_paise), lineTotalPaise: asInt(line.line_total_paise), specialInstructions: line.special_instructions, addons: [] }); linesByOrder.set(line.order_id, list); }
    const eventsByOrder = new Map<string, OrderEventView[]>();
    for (const ev of events) { const list = eventsByOrder.get(ev.order_id) ?? []; list.push({ id: ev.id, previousState: ev.previous_state, newState: ev.new_state, actor: ev.actor, reason: ev.reason, at: asIso(ev.at) }); eventsByOrder.set(ev.order_id, list); }
    return { restaurantId: ctx.restaurantId, dataLabel: ctx.dataLabel, role: ctx.role, serverTime: new Date().toISOString(), orders: rows.map((r: any) => mapOrder(r, linesByOrder.get(r.id) ?? [], eventsByOrder.get(r.id) ?? [])) };
  });
});

export const advanceSimulatedRider = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d: { restaurantId?: string; orderId: string; idempotencyKey: string }) => d).handler(async ({ context, data }) => {
  return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
    if (ctx.dataLabel !== "SIMULATED") throw new Error("Rider simulation is only available on labelled SIMULATED kitchens.");
    const prior = await sql<{ response_json: string }>`select response_json from idempotency_keys where restaurant_id = ${ctx.restaurantId} and action = 'sim_rider' and key = ${data.idempotencyKey} limit 1`;
    if (prior[0]) return JSON.parse(prior[0].response_json);
    const rows = await sql<{ id: string; state: string }>`select id, state from orders where id = ${data.orderId} and restaurant_id = ${ctx.restaurantId}`;
    const order = rows[0];
    if (!order || !isOrderState(order.state)) throw new Error("Order not found");
    const next = SIMULATED_RIDER_NEXT[order.state];
    if (!next) throw new Error("No simulated rider step from this state");
    const previous = order.state as OrderState;
    assertTransition(previous, next, "simulated_rider");
    await sql`update orders set state = ${next}, delivered_at = case when ${next} = 'DELIVERED' then now() else delivered_at end where id = ${order.id} and restaurant_id = ${ctx.restaurantId}`;
    await sql`insert into order_events (id, order_id, restaurant_id, previous_state, new_state, actor, actor_user_id, reason) values (${newId("evt")}, ${order.id}, ${ctx.restaurantId}, ${previous}, ${next}, 'simulated_rider', ${context.userId}, 'SIMULATED')`;
    const result = { ok: true as const, state: next, simulated: true as const };
    await sql`insert into idempotency_keys (key, restaurant_id, action, response_json) values (${data.idempotencyKey}, ${ctx.restaurantId}, 'sim_rider', ${JSON.stringify(result)})`;
    return result;
  });
});

export const getDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d: { restaurantId?: string }) => d).handler(async ({ context, data }) => {
  return withVendor(context.userId, data.restaurantId, "dashboard.view", async (sql, ctx) => {
    const res = await fetch(`${coreUrl()}/v1/admin/restaurants/${ctx.restaurantId}/partner-dashboard`, {
      headers: { authorization: `Bearer ${serviceToken()}` }
    });
    const payload: any = await res.json();
    const hdStats = payload.data || {};
    
    const unavailable = await sql<{ c: number }>`select count(*)::int as c from item_availability a join items i on i.id = a.item_id where a.restaurant_id = ${ctx.restaurantId} and a.status <> 'available' and i.is_active = true`;
    const rating = await sql<{ avg: number | null; n: number }>`select avg(rating)::float as avg, count(*)::int as n from reviews where restaurant_id = ${ctx.restaurantId}`;
    
    const hours = await sql<{ weekday: number; open_minutes: number; close_minutes: number }>`select weekday, open_minutes, close_minutes from restaurant_hours where restaurant_id = ${ctx.restaurantId}`;
    const rest = await sql<{ emergency_closed: boolean; vacation_mode: boolean; admin_hours_override: boolean; weekly_holidays: string; verification_status: string; fssai_number: string }>`select emergency_closed, vacation_mode, admin_hours_override, weekly_holidays, verification_status, fssai_number from restaurants where id = ${ctx.restaurantId}`;
    const r = rest[0]; const shifts: Shift[] = hours.map((h) => ({ weekday: h.weekday as Weekday, openMinutes: h.open_minutes, closeMinutes: h.close_minutes }));
    const holidays = (r?.weekly_holidays ?? "").split(",").map((x) => Number(x.trim())).filter((n) => n >= 0 && n <= 6) as Weekday[];
    const nowIso = new Date().toISOString(); const open = r ? isOpenAt({ nowIso, shifts, closures: [], weeklyHolidays: holidays, emergencyClosed: r.emergency_closed === true || (r.emergency_closed as unknown) === "t", adminOverride: r.admin_hours_override === true }) : false; const untilClose = minutesUntilClose({ nowIso, shifts });
    const attention: { id: string; key: string; tone: "warn" | "info" | "danger"; n?: number; status?: string }[] = [];
    if (asInt(hdStats.pending) > 0) attention.push({ id: "pending", key: "dashboard.attnPending", n: asInt(hdStats.pending), tone: "danger" });
    if (asInt(unavailable[0]?.c) > 0) attention.push({ id: "unavail", key: "dashboard.attnUnavailable", n: asInt(unavailable[0]?.c), tone: "warn" });
    if (open && untilClose != null && untilClose <= 30) attention.push({ id: "close", key: "dashboard.attnClosing", n: untilClose, tone: "warn" });
    if (r && r.verification_status !== "VERIFIED") attention.push({ id: "verify", key: "dashboard.attnVerify", status: r.verification_status, tone: "info" });
    if (r && !r.fssai_number) attention.push({ id: "fssai", key: "dashboard.attnFssai", tone: "warn" });
    const pendingSettle = await sql<{ c: number; amt: number }>`select count(*)::int as c, coalesce(sum(total_payable_paise),0)::int as amt from settlement_batches where restaurant_id = ${ctx.restaurantId} and status = 'pending'`;
    if (asInt(pendingSettle[0]?.c) > 0) attention.push({ id: "settle", key: "dashboard.attnSettle", tone: "info" });
    const deliveredCustomers = await sql<{ c: number; repeats: number }>`select count(distinct customer_ref)::int as c, count(distinct customer_ref) filter (where cnt > 1)::int as repeats from (select customer_ref, count(*) as cnt from orders where restaurant_id = ${ctx.restaurantId} and state = 'DELIVERED' and customer_ref is not null group by customer_ref) t`;
    const cust = deliveredCustomers[0]; const repeatPct = asInt(cust?.c) > 0 ? Math.round((asInt(cust?.repeats) * 100) / asInt(cust?.c)) : null;
    return { dataLabel: ctx.dataLabel, restaurantName: ctx.restaurantName, role: ctx.role, verificationStatus: ctx.verificationStatus, fssaiNumber: r?.fssai_number ?? null, isOpen: open, serverTime: nowIso, today: { orders: asInt(hdStats.orders), salesPaise: asInt(hdStats.sales), aovPaise: asInt(hdStats.aov), accepted: asInt(hdStats.accepted), pending: asInt(hdStats.pending), cancelled: asInt(hdStats.cancelled), refundsPaise: asInt(hdStats.refunds), settlementPaise: asInt(hdStats.payable), unavailableItems: asInt(unavailable[0]?.c), rating: rating[0]?.avg != null ? Math.round(Number(rating[0].avg) * 10) / 10 : null, ratingCount: asInt(rating[0]?.n), repeatPct }, attention };
  });
});

export const getOperatingSnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d: { restaurantId?: string }) => d).handler(async ({ context, data }) => {
  return withVendor(context.userId, data.restaurantId, "hours.edit", async (sql, ctx) => {
    const hours = await sql<{ id: string; weekday: number; open_minutes: number; close_minutes: number }>`select id, weekday, open_minutes, close_minutes from restaurant_hours where restaurant_id = ${ctx.restaurantId} order by weekday, open_minutes`;
    const rest = await sql<{ emergency_closed: boolean; vacation_mode: boolean; weekly_holidays: string; prep_minutes: number; peak_prep_minutes: number }>`select emergency_closed, vacation_mode, weekly_holidays, prep_minutes, peak_prep_minutes from restaurants where id = ${ctx.restaurantId}`;
    return { hours, restaurant: rest[0], dataLabel: ctx.dataLabel };
  });
});

export const saveHours = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d: { restaurantId?: string; emergencyClosed?: boolean; vacationMode?: boolean; weeklyHolidays?: string; prepMinutes?: number; peakPrepMinutes?: number; shifts: { weekday: number; openMinutes: number; closeMinutes: number }[] }) => d).handler(async ({ context, data }) => {
  return withVendor(context.userId, data.restaurantId, "hours.edit", async (sql, ctx) => {
    await sql`delete from restaurant_hours where restaurant_id = ${ctx.restaurantId}`;
    for (const s of data.shifts) { if (s.weekday < 0 || s.weekday > 6) continue; await sql`insert into restaurant_hours (id, restaurant_id, weekday, open_minutes, close_minutes) values (${newId("hrs")}, ${ctx.restaurantId}, ${s.weekday}, ${s.openMinutes}, ${s.closeMinutes})`; }
    await sql`update restaurants set emergency_closed = ${Boolean(data.emergencyClosed)}, vacation_mode = ${Boolean(data.vacationMode)}, weekly_holidays = ${data.weeklyHolidays ?? ""}, prep_minutes = ${asInt(data.prepMinutes, 20)}, peak_prep_minutes = ${asInt(data.peakPrepMinutes, 30)}, updated_at = now() where id = ${ctx.restaurantId}`;
    try {
      await sql`update restaurant_outlets set open_override = ${data.emergencyClosed ? false : null}, active = ${!data.emergencyClosed} where restaurant_id = ${ctx.restaurantId}`;
    } catch {
      // non-fatal
    }
    return { ok: true as const };
  });
});

export const quickThrottleKitchen = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; mode: "NORMAL" | "RUSH" | "PAUSE" | "RESUME" }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "hours.edit", async (sql, ctx) => {
      if (data.mode === "RUSH") {
        await sql`update restaurants set prep_minutes = 35, updated_at = now() where id = ${ctx.restaurantId}`;
      } else if (data.mode === "NORMAL") {
        await sql`update restaurants set prep_minutes = 20, updated_at = now() where id = ${ctx.restaurantId}`;
      } else if (data.mode === "PAUSE") {
        await sql`update restaurants set emergency_closed = true, updated_at = now() where id = ${ctx.restaurantId}`;
        try {
          await sql`update restaurant_outlets set open_override = false, active = false where restaurant_id = ${ctx.restaurantId}`;
        } catch {
          // non-fatal
        }
      } else if (data.mode === "RESUME") {
        await sql`update restaurants set emergency_closed = false, updated_at = now() where id = ${ctx.restaurantId}`;
        try {
          await sql`update restaurant_outlets set open_override = true, active = true where restaurant_id = ${ctx.restaurantId}`;
        } catch {
          // non-fatal
        }
      }
      return { ok: true as const, mode: data.mode };
    });
  });

export const delayOrderPrep = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; orderId: string; extraMinutes: number; idempotencyKey?: string }) => d)
  .handler(async ({ context, data }): Promise<{ ok: true; orderId: string; extraMinutes: number; newPrepMinutes: number }> => {
    return withVendor(context.userId, data.restaurantId, "orders.prepare", async (sql, ctx) => {
      const extra = Math.max(1, Math.min(60, asInt(data.extraMinutes, 5)));
      const rows = await sql<{ id: string; prep_minutes: number; state: string }>`
        select id, prep_minutes, state from orders where id = ${data.orderId} and restaurant_id = ${ctx.restaurantId}
      `;
      if (!rows[0]) throw new Error("Order not found");
      const currentPrep = asInt(rows[0].prep_minutes, 20);
      const updatedPrepMinutes = currentPrep + extra;
      await sql`
        update orders
        set prep_minutes = ${updatedPrepMinutes}
        where id = ${data.orderId} and restaurant_id = ${ctx.restaurantId}
      `;
      await sql`
        insert into order_events (id, order_id, restaurant_id, previous_state, new_state, actor, actor_user_id, reason)
        values (${newId("evt")}, ${data.orderId}, ${ctx.restaurantId}, ${rows[0].state}, ${rows[0].state}, 'kitchen', ${context.userId}, ${`Kitchen prep delay: +${extra} mins (Prep SLA: ${updatedPrepMinutes}m)`})
      `;
      return { ok: true as const, orderId: data.orderId, extraMinutes: extra, newPrepMinutes: updatedPrepMinutes };
    });
  });

import { getSql } from "@/lib/db";
import {
  calculateMerchantCancellationPenalty,
  calculateKptDelayPenalty,
  calculateCustomerDisputeChargeback,
  kitchenCircuitBreaker,
  type CancellationPenaltyTier,
  type DisputeCategory,
} from "@/lib/penalties";

export const acceptOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; orderId: string; prepMinutes?: number }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
      const prepMins = data.prepMinutes ? Math.max(5, Math.min(120, asInt(data.prepMinutes))) : null;
      const res = await sql`
        UPDATE orders
        SET status = 'PREPARING',
            state = 'PREPARING',
            prep_minutes = coalesce(${prepMins}, prep_minutes),
            accepted_at = now(),
            updated_at = now()
        WHERE id = ${data.orderId}
          AND (status IN ('CREATED', 'PENDING', 'PLACED', 'ACCEPTED', 'CONFIRMED') OR state IN ('CREATED', 'PENDING', 'PLACED', 'ACCEPTED', 'CONFIRMED'))
          AND restaurant_id = ${ctx.restaurantId}
        RETURNING id
      `;
      if (res.length === 0) throw new Error("Order not found or not in PENDING/PLACED state");
      // Reset circuit breaker consecutive missed orders counter on accepted order
      kitchenCircuitBreaker.recordOrderAccepted(ctx.restaurantId);
      await sql`
        insert into order_events (id, order_id, restaurant_id, previous_state, new_state, actor, actor_user_id, reason)
        values (${newId("evt")}, ${data.orderId}, ${ctx.restaurantId}, 'PLACED', 'ACCEPTED', 'restaurant', ${context.userId}, ${prepMins ? `Order Accepted with ${prepMins}m Prep SLA` : 'Order Accepted'})
      `;
      return { ok: true, status: 'PREPARING', state: 'PREPARING' };
    });
  });

export const rejectOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; orderId: string; reason: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
      const res = await sql`
        UPDATE orders
        SET status = 'RESTAURANT_REJECTED',
            state = 'REJECTED',
            reject_reason = ${data.reason},
            updated_at = now()
        WHERE id = ${data.orderId}
          AND (status = 'PENDING' OR state = 'PLACED')
          AND restaurant_id = ${ctx.restaurantId}
        RETURNING id
      `;
      if (res.length === 0) throw new Error("Order not found or not in PENDING/PLACED state");
      await sql`
        insert into order_events (id, order_id, restaurant_id, previous_state, new_state, actor, actor_user_id, reason)
        values (${newId("evt")}, ${data.orderId}, ${ctx.restaurantId}, 'PLACED', 'REJECTED', 'restaurant', ${context.userId}, ${data.reason})
      `;
      return { ok: true, status: 'RESTAURANT_REJECTED', state: 'REJECTED' };
    });
  });

export const cancelOrderWithMerchantPenalty = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; orderId: string; reason: string; tier?: CancellationPenaltyTier }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
      const rows = await sql<{ id: string; food_value_paise: number; state: string }>`
        SELECT id, food_value_paise, state FROM orders WHERE id = ${data.orderId} AND restaurant_id = ${ctx.restaurantId}
      `;
      const order = rows[0];
      if (!order) throw new Error("Order not found");

      const penalty = calculateMerchantCancellationPenalty({
        orderId: order.id,
        restaurantId: ctx.restaurantId,
        foodValuePaise: asInt(order.food_value_paise),
        tier: data.tier ?? "TIER_1_STANDARD",
        cancellationReason: data.reason,
      });

      await sql`
        UPDATE orders
        SET state = 'CANCELLED',
            reject_reason = ${data.reason},
            other_deductions_paise = ${penalty.penaltyDebitedPaise},
            other_deductions_code = ${penalty.reasonCode},
            updated_at = now()
        WHERE id = ${order.id} AND restaurant_id = ${ctx.restaurantId}
      `;

      await writeAudit(sql, {
        restaurantId: ctx.restaurantId,
        actorUserId: context.userId,
        action: "MERCHANT_CANCELLATION_DEBITED",
        entityType: "order",
        entityId: order.id,
        detail: penalty.description,
      });

      return { ok: true, penalty };
    });
  });

export const handleRingTimeoutMissedOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; orderId: string; timeoutSeconds?: number }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
      const timeout = data.timeoutSeconds ?? 60;
      const { state, circuitTripped, alertMessage } = kitchenCircuitBreaker.registerMissedOrder(
        ctx.restaurantId,
        data.orderId,
        timeout
      );

      if (circuitTripped) {
        await sql`UPDATE restaurants SET emergency_closed = true, updated_at = now() WHERE id = ${ctx.restaurantId}`;
        await writeAudit(sql, {
          restaurantId: ctx.restaurantId,
          actorUserId: context.userId,
          action: "CIRCUIT_BREAKER_AUTO_PAUSE",
          entityType: "restaurant",
          entityId: ctx.restaurantId,
          detail: alertMessage ?? "3 consecutive missed orders (60s ring timeout)",
        });
      }

      return { ok: true, circuitTripped, consecutiveMissedCount: state.consecutiveMissedCount, alertMessage };
    });
  });

export const resumeKitchenCircuitBreaker = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "hours.edit", async (sql, ctx) => {
      kitchenCircuitBreaker.resumeKitchen(ctx.restaurantId);
      await sql`UPDATE restaurants SET emergency_closed = false, updated_at = now() WHERE id = ${ctx.restaurantId}`;
      await writeAudit(sql, {
        restaurantId: ctx.restaurantId,
        actorUserId: context.userId,
        action: "CIRCUIT_BREAKER_RESUMED",
        entityType: "restaurant",
        entityId: ctx.restaurantId,
        detail: "Merchant manually resumed kitchen after auto-pause timeout.",
      });
      return { ok: true, status: "ONLINE" };
    });
  });

export const markPreparing = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; orderId: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
      const res = await sql`
        UPDATE orders
        SET status = 'PREPARING',
            state = 'PREPARING',
            updated_at = now()
        WHERE id = ${data.orderId}
          AND (status = 'CONFIRMED' OR state = 'ACCEPTED')
          AND restaurant_id = ${ctx.restaurantId}
        RETURNING id
      `;
      if (res.length === 0) throw new Error("Order not found or not in CONFIRMED/ACCEPTED state");
      await sql`
        insert into order_events (id, order_id, restaurant_id, previous_state, new_state, actor, actor_user_id, reason)
        values (${newId("evt")}, ${data.orderId}, ${ctx.restaurantId}, 'ACCEPTED', 'PREPARING', 'restaurant', ${context.userId}, 'Kitchen food preparation started')
      `;
      return { ok: true, status: 'PREPARING', state: 'PREPARING' };
    });
  });

export const markReady = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; orderId: string; actualPrepMinutes?: number }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
      const rows = await sql<{ id: string; prep_minutes: number; placed_at: string }>`
        SELECT id, prep_minutes, placed_at::text as placed_at
        FROM orders
        WHERE id = ${data.orderId}
          AND (status = 'PREPARING' OR state = 'PREPARING')
          AND restaurant_id = ${ctx.restaurantId}
      `;
      if (rows.length === 0) throw new Error("Order not found or not in PREPARING state");
      const ord = rows[0];
      const promisedKpt = asInt(ord.prep_minutes, 20);
      const placedTime = new Date(ord.placed_at).getTime();
      const nowTime = Date.now();
      const elapsedMins = Math.max(1, Math.round((nowTime - placedTime) / 60000));
      const actualPrep = data.actualPrepMinutes ?? elapsedMins;

      const kptPenalty = calculateKptDelayPenalty({
        orderId: data.orderId,
        restaurantId: ctx.restaurantId,
        promisedKptMinutes: promisedKpt,
        actualPrepMinutes: actualPrep,
      });

      if (kptPenalty.isPenaltyApplicable) {
        await sql`
          UPDATE orders
          SET status = 'READY',
              state = 'READY',
              ready_at = now(),
              other_deductions_paise = other_deductions_paise + ${kptPenalty.penaltyDebitedPaise},
              other_deductions_code = ${kptPenalty.reasonCode},
              updated_at = now()
          WHERE id = ${data.orderId} AND restaurant_id = ${ctx.restaurantId}
        `;
        await writeAudit(sql, {
          restaurantId: ctx.restaurantId,
          actorUserId: context.userId,
          action: "KPT_DELAY_PENALTY_DEBITED",
          entityType: "order",
          entityId: data.orderId,
          detail: kptPenalty.description,
        });
      } else {
        await sql`
          UPDATE orders
          SET status = 'READY',
              state = 'READY',
              ready_at = now(),
              updated_at = now()
          WHERE id = ${data.orderId} AND restaurant_id = ${ctx.restaurantId}
        `;
      }

      await sql`
        insert into order_events (id, order_id, restaurant_id, previous_state, new_state, actor, actor_user_id, reason)
        values (${newId("evt")}, ${data.orderId}, ${ctx.restaurantId}, 'PREPARING', 'READY', 'restaurant', ${context.userId}, 'Food cooked and packed. Ready for rider pickup.')
      `;
      await notifyInApp(sql, {
        restaurantId: ctx.restaurantId,
        type: "order_status",
        title: `Order #${data.orderId.slice(-6)} Ready for Rider Pickup`,
        body: "Food packed and ready. Rider dispatch notified for immediate pickup.",
      });

      return { ok: true, status: 'READY', state: 'READY', kptPenalty };
    });
  });

export const processCustomerChargeback = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    restaurantId?: string;
    orderId: string;
    disputeId: string;
    category: DisputeCategory;
    itemValuePaise: number;
    isVerifiedWithProof: boolean;
    proofDocumentUrls?: string[];
  }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
      const chargeback = calculateCustomerDisputeChargeback({
        disputeId: data.disputeId,
        orderId: data.orderId,
        restaurantId: ctx.restaurantId,
        category: data.category,
        itemValuePaise: data.itemValuePaise,
        isVerifiedWithProof: data.isVerifiedWithProof,
        proofDocumentUrls: data.proofDocumentUrls,
      });

      if (chargeback.isDebited) {
        await sql`
          UPDATE orders
          SET refund_adjustment_paise = refund_adjustment_paise - ${chargeback.totalDebitedPaise},
              updated_at = now()
          WHERE id = ${data.orderId} AND restaurant_id = ${ctx.restaurantId}
        `;
        await writeAudit(sql, {
          restaurantId: ctx.restaurantId,
          actorUserId: context.userId,
          action: "CUSTOMER_CHARGEBACK_DEBITED",
          entityType: "order",
          entityId: data.orderId,
          detail: chargeback.description,
        });
      }

      return { ok: true, chargeback };
    });
  });



export const requestRiderDispatch = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; orderId: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
      const rows = await sql<{ id: string; status: string; state: string; rider_id: string | null; order_number: string }>`
        SELECT id, status, state, rider_id, order_number FROM orders
        WHERE id = ${data.orderId} AND restaurant_id = ${ctx.restaurantId}
        LIMIT 1
      `;
      if (!rows[0]) throw new Error("Order not found or unauthorized");

      let dispatchResult: any = null;
      try {
        const res = await fetch(`${coreUrl()}/v1/admin/orders/${encodeURIComponent(data.orderId)}/dispatch-rider`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${serviceToken()}`,
          },
          body: JSON.stringify({ restaurantId: ctx.restaurantId }),
        });
        if (res.ok) {
          dispatchResult = await res.json();
        }
      } catch (err) {
        console.warn("[requestRiderDispatch] Core dispatch call:", err);
      }

      await notifyInApp(sql, {
        restaurantId: ctx.restaurantId,
        type: "order_status",
        title: `Rider Dispatch Pinged for Order #${rows[0].order_number}`,
        body: "Nearby active delivery couriers alerted for immediate pickup.",
      });

      await sql`
        insert into order_events (id, order_id, restaurant_id, previous_state, new_state, actor, actor_user_id, reason)
        values (${newId("evt")}, ${data.orderId}, ${ctx.restaurantId}, ${rows[0].state || rows[0].status || 'READY'}, ${rows[0].state || rows[0].status || 'READY'}, 'restaurant', ${context.userId}, 'Partner requested autonomous rider dispatch')
      `;

      return {
        ok: true,
        orderId: data.orderId,
        orderNumber: rows[0].order_number,
        dispatchResult,
      };
    });
  });

export async function setOrderStatus(params: {
  orderId: string;
  status: "ACCEPTED" | "PREPARING" | "READY" | "REJECTED";
  restaurantId?: string;
  actorUserId?: string;
  reason?: string;
}) {
  const sql = await getSql();
  const rows = await sql<{ id: string; status: string; state: string }>`
    SELECT id, status, state FROM orders WHERE id = ${params.orderId} LIMIT 1
  `;
  if (!rows[0]) throw new Error("Order not found");
  const prev = rows[0].status || rows[0].state || "CREATED";

  await sql`
    UPDATE orders
    SET status = ${params.status},
        state = ${params.status},
        accepted_at = CASE WHEN ${params.status} IN ('ACCEPTED', 'PREPARING') AND accepted_at IS NULL THEN now() ELSE accepted_at END,
        ready_at = CASE WHEN ${params.status} = 'READY' THEN now() ELSE ready_at END,
        updated_at = now()
    WHERE id = ${params.orderId}
  `;

  try {
    await sql`
      INSERT INTO order_events (id, order_id, from_status, to_status, actor_user_id, actor_role, note, created_at)
      VALUES (
        ${newId("evt")}, ${params.orderId}, ${prev}, ${params.status},
        ${params.actorUserId || 'partner_kds'}, 'restaurant',
        ${params.reason || `Status transitioned to ${params.status}`}, now()
      )
    `;
  } catch {
    try {
      await sql`
        INSERT INTO order_events (id, order_id, restaurant_id, previous_state, new_state, actor, actor_user_id, reason, at)
        VALUES (
          ${newId("evt")}, ${params.orderId}, ${params.restaurantId || 'rst_default'}, ${prev}, ${params.status},
          'restaurant', ${params.actorUserId || 'partner_kds'}, ${params.reason || `Status transitioned to ${params.status}`}, now()
        )
      `;
    } catch {
      // Non-fatal event write
    }
  }

  return { ok: true, status: params.status, state: params.status };
}
