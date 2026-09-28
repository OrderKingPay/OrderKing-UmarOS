import { a as newId, n as asInt, r as asIso } from "./utils-BZJZXT5Z.mjs";
import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-DsMHvbSu.mjs";
import { r as serviceToken, t as coreUrl } from "./hdmaster-order-transition-BLAHw5vH.mjs";
import { a as withVendor, t as createServerRpc } from "./helpers-DJHrKkmK.mjs";
import { i as isOrderState, n as SIMULATED_RIDER_NEXT, r as assertTransition } from "./state-machine-DxXhKfD0.mjs";
import { i as minutesUntilClose, n as isOpenAt } from "./hours-CQlwh30e.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-orders-BtqerNuy.js
function mapOrder(row, lines, events) {
	return {
		id: row.id,
		orderNumber: row.order_number,
		restaurantId: row.restaurant_id,
		outletId: row.outlet_id,
		state: row.state,
		placedAt: asIso(row.placed_at),
		customerArea: row.customer_area,
		paymentMethod: row.payment_method,
		isCod: row.is_cod === true || row.is_cod === "t",
		specialInstructions: row.special_instructions,
		prepMinutes: asInt(row.prep_minutes),
		rejectReason: row.reject_reason,
		dataLabel: row.data_label,
		prices: {
			foodValuePaise: asInt(row.food_value_paise),
			packingPaise: asInt(row.packing_paise),
			restaurantDiscountPaise: asInt(row.restaurant_discount_paise),
			platformFundedDiscountPaise: asInt(row.platform_funded_discount_paise),
			taxPaise: asInt(row.tax_paise),
			platformFeePaise: asInt(row.platform_fee_paise),
			commissionBps: asInt(row.commission_bps),
			commissionPaise: asInt(row.commission_paise),
			otherDeductionsPaise: asInt(row.other_deductions_paise),
			otherDeductionsCode: row.other_deductions_code,
			refundAdjustmentPaise: asInt(row.refund_adjustment_paise),
			restaurantPayablePaise: asInt(row.restaurant_payable_paise),
			customerTotalPaise: asInt(row.customer_total_paise)
		},
		lines,
		events
	};
}
var listOrders_createServerFn_handler = createServerRpc({
	id: "c8c37c09ba07ecfe2b47463f962436c7847d47e407b9d51f39b43b3139795738",
	name: "listOrders",
	filename: "src/lib/server/api-orders.ts"
}, (opts) => listOrders.__executeServer(opts));
var listOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(listOrders_createServerFn_handler, async ({ context, data }) => {
	return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
		const scope = data.scope ?? "live";
		const { rows, lines, events } = (await (await fetch(`${coreUrl()}/v1/admin/restaurants/${ctx.restaurantId}/partner-orders?scope=${scope}`, { headers: { authorization: `Bearer ${serviceToken()}` } })).json()).data || {
			rows: [],
			lines: [],
			events: []
		};
		const linesByOrder = /* @__PURE__ */ new Map();
		for (const line of lines) {
			const list = linesByOrder.get(line.order_id) ?? [];
			list.push({
				id: line.id,
				itemName: line.item_name,
				variantName: line.variant_name,
				quantity: asInt(line.quantity),
				unitPricePaise: asInt(line.unit_price_paise),
				lineTotalPaise: asInt(line.line_total_paise),
				specialInstructions: line.special_instructions,
				addons: []
			});
			linesByOrder.set(line.order_id, list);
		}
		const eventsByOrder = /* @__PURE__ */ new Map();
		for (const ev of events) {
			const list = eventsByOrder.get(ev.order_id) ?? [];
			list.push({
				id: ev.id,
				previousState: ev.previous_state,
				newState: ev.new_state,
				actor: ev.actor,
				reason: ev.reason,
				at: asIso(ev.at)
			});
			eventsByOrder.set(ev.order_id, list);
		}
		return {
			restaurantId: ctx.restaurantId,
			dataLabel: ctx.dataLabel,
			role: ctx.role,
			serverTime: (/* @__PURE__ */ new Date()).toISOString(),
			orders: rows.map((r) => mapOrder(r, linesByOrder.get(r.id) ?? [], eventsByOrder.get(r.id) ?? []))
		};
	});
});
var advanceSimulatedRider_createServerFn_handler = createServerRpc({
	id: "1b734824599414618d62e0e2a27f257918eabfd5fad2b14500ff2f024a5be314",
	name: "advanceSimulatedRider",
	filename: "src/lib/server/api-orders.ts"
}, (opts) => advanceSimulatedRider.__executeServer(opts));
var advanceSimulatedRider = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(advanceSimulatedRider_createServerFn_handler, async ({ context, data }) => {
	return withVendor(context.userId, data.restaurantId, "orders.view", async (sql, ctx) => {
		if (ctx.dataLabel !== "SIMULATED") throw new Error("Rider simulation is only available on labelled SIMULATED kitchens.");
		const prior = await sql`select response_json from idempotency_keys where restaurant_id = ${ctx.restaurantId} and action = 'sim_rider' and key = ${data.idempotencyKey} limit 1`;
		if (prior[0]) return JSON.parse(prior[0].response_json);
		const order = (await sql`select id, state from orders where id = ${data.orderId} and restaurant_id = ${ctx.restaurantId}`)[0];
		if (!order || !isOrderState(order.state)) throw new Error("Order not found");
		const next = SIMULATED_RIDER_NEXT[order.state];
		if (!next) throw new Error("No simulated rider step from this state");
		const previous = order.state;
		assertTransition(previous, next, "simulated_rider");
		await sql`update orders set state = ${next}, delivered_at = case when ${next} = 'DELIVERED' then now() else delivered_at end where id = ${order.id} and restaurant_id = ${ctx.restaurantId}`;
		await sql`insert into order_events (id, order_id, restaurant_id, previous_state, new_state, actor, actor_user_id, reason) values (${newId("evt")}, ${order.id}, ${ctx.restaurantId}, ${previous}, ${next}, 'simulated_rider', ${context.userId}, 'SIMULATED')`;
		const result = {
			ok: true,
			state: next,
			simulated: true
		};
		await sql`insert into idempotency_keys (key, restaurant_id, action, response_json) values (${data.idempotencyKey}, ${ctx.restaurantId}, 'sim_rider', ${JSON.stringify(result)})`;
		return result;
	});
});
var getDashboard_createServerFn_handler = createServerRpc({
	id: "45eecb9802db3a8af9d742694b69311436aa7d0ce13249e32932ee78afc3bab7",
	name: "getDashboard",
	filename: "src/lib/server/api-orders.ts"
}, (opts) => getDashboard.__executeServer(opts));
var getDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(getDashboard_createServerFn_handler, async ({ context, data }) => {
	return withVendor(context.userId, data.restaurantId, "dashboard.view", async (sql, ctx) => {
		const hdStats = (await (await fetch(`${coreUrl()}/v1/admin/restaurants/${ctx.restaurantId}/partner-dashboard`, { headers: { authorization: `Bearer ${serviceToken()}` } })).json()).data || {};
		const unavailable = await sql`select count(*)::int as c from item_availability a join items i on i.id = a.item_id where a.restaurant_id = ${ctx.restaurantId} and a.status <> 'available' and i.is_active = true`;
		const rating = await sql`select avg(rating)::float as avg, count(*)::int as n from reviews where restaurant_id = ${ctx.restaurantId}`;
		const hours = await sql`select weekday, open_minutes, close_minutes from restaurant_hours where restaurant_id = ${ctx.restaurantId}`;
		const r = (await sql`select emergency_closed, vacation_mode, admin_hours_override, weekly_holidays, verification_status, fssai_number from restaurants where id = ${ctx.restaurantId}`)[0];
		const shifts = hours.map((h) => ({
			weekday: h.weekday,
			openMinutes: h.open_minutes,
			closeMinutes: h.close_minutes
		}));
		const holidays = (r?.weekly_holidays ?? "").split(",").map((x) => Number(x.trim())).filter((n) => n >= 0 && n <= 6);
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		const open = r ? isOpenAt({
			nowIso,
			shifts,
			closures: [],
			weeklyHolidays: holidays,
			emergencyClosed: r.emergency_closed === true || r.emergency_closed === "t",
			adminOverride: r.admin_hours_override === true
		}) : false;
		const untilClose = minutesUntilClose({
			nowIso,
			shifts
		});
		const attention = [];
		if (asInt(hdStats.pending) > 0) attention.push({
			id: "pending",
			key: "dashboard.attnPending",
			n: asInt(hdStats.pending),
			tone: "danger"
		});
		if (asInt(unavailable[0]?.c) > 0) attention.push({
			id: "unavail",
			key: "dashboard.attnUnavailable",
			n: asInt(unavailable[0]?.c),
			tone: "warn"
		});
		if (open && untilClose != null && untilClose <= 30) attention.push({
			id: "close",
			key: "dashboard.attnClosing",
			n: untilClose,
			tone: "warn"
		});
		if (r && r.verification_status !== "VERIFIED") attention.push({
			id: "verify",
			key: "dashboard.attnVerify",
			status: r.verification_status,
			tone: "info"
		});
		if (r && !r.fssai_number) attention.push({
			id: "fssai",
			key: "dashboard.attnFssai",
			tone: "warn"
		});
		if (asInt((await sql`select count(*)::int as c, coalesce(sum(total_payable_paise),0)::int as amt from settlement_batches where restaurant_id = ${ctx.restaurantId} and status = 'pending'`)[0]?.c) > 0) attention.push({
			id: "settle",
			key: "dashboard.attnSettle",
			tone: "info"
		});
		const cust = (await sql`select count(distinct customer_ref)::int as c, count(distinct customer_ref) filter (where cnt > 1)::int as repeats from (select customer_ref, count(*) as cnt from orders where restaurant_id = ${ctx.restaurantId} and state = 'DELIVERED' and customer_ref is not null group by customer_ref) t`)[0];
		const repeatPct = asInt(cust?.c) > 0 ? Math.round(asInt(cust?.repeats) * 100 / asInt(cust?.c)) : null;
		return {
			dataLabel: ctx.dataLabel,
			restaurantName: ctx.restaurantName,
			role: ctx.role,
			verificationStatus: ctx.verificationStatus,
			isOpen: open,
			serverTime: nowIso,
			today: {
				orders: asInt(hdStats.orders),
				salesPaise: asInt(hdStats.sales),
				aovPaise: asInt(hdStats.aov),
				accepted: asInt(hdStats.accepted),
				pending: asInt(hdStats.pending),
				cancelled: asInt(hdStats.cancelled),
				refundsPaise: asInt(hdStats.refunds),
				settlementPaise: asInt(hdStats.payable),
				unavailableItems: asInt(unavailable[0]?.c),
				rating: rating[0]?.avg != null ? Math.round(Number(rating[0].avg) * 10) / 10 : null,
				ratingCount: asInt(rating[0]?.n),
				repeatPct
			},
			attention
		};
	});
});
var getOperatingSnapshot_createServerFn_handler = createServerRpc({
	id: "ffa61d595de0c2d85935c70833c9e8a639508e781b0d12e54ab23e265a5a80ce",
	name: "getOperatingSnapshot",
	filename: "src/lib/server/api-orders.ts"
}, (opts) => getOperatingSnapshot.__executeServer(opts));
var getOperatingSnapshot = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((d) => d).handler(getOperatingSnapshot_createServerFn_handler, async ({ context, data }) => {
	return withVendor(context.userId, data.restaurantId, "hours.edit", async (sql, ctx) => {
		return {
			hours: await sql`select id, weekday, open_minutes, close_minutes from restaurant_hours where restaurant_id = ${ctx.restaurantId} order by weekday, open_minutes`,
			restaurant: (await sql`select emergency_closed, vacation_mode, weekly_holidays, prep_minutes, peak_prep_minutes from restaurants where id = ${ctx.restaurantId}`)[0],
			dataLabel: ctx.dataLabel
		};
	});
});
var saveHours_createServerFn_handler = createServerRpc({
	id: "fd97d75f6fb3e2ec2fb9024c8f8be9544fcf58a644712948f5d9eef1a4cc79af",
	name: "saveHours",
	filename: "src/lib/server/api-orders.ts"
}, (opts) => saveHours.__executeServer(opts));
var saveHours = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(saveHours_createServerFn_handler, async ({ context, data }) => {
	return withVendor(context.userId, data.restaurantId, "hours.edit", async (sql, ctx) => {
		await sql`delete from restaurant_hours where restaurant_id = ${ctx.restaurantId}`;
		for (const s of data.shifts) {
			if (s.weekday < 0 || s.weekday > 6) continue;
			await sql`insert into restaurant_hours (id, restaurant_id, weekday, open_minutes, close_minutes) values (${newId("hrs")}, ${ctx.restaurantId}, ${s.weekday}, ${s.openMinutes}, ${s.closeMinutes})`;
		}
		await sql`update restaurants set emergency_closed = ${Boolean(data.emergencyClosed)}, vacation_mode = ${Boolean(data.vacationMode)}, weekly_holidays = ${data.weeklyHolidays ?? ""}, prep_minutes = ${asInt(data.prepMinutes, 20)}, peak_prep_minutes = ${asInt(data.peakPrepMinutes, 30)}, updated_at = now() where id = ${ctx.restaurantId}`;
		return { ok: true };
	});
});
var quickThrottleKitchen_createServerFn_handler = createServerRpc({
	id: "42f02f5548e63e388012f2448d385af1fe5856fb486e92c4803d3a3b0adcc603",
	name: "quickThrottleKitchen",
	filename: "src/lib/server/api-orders.ts"
}, (opts) => quickThrottleKitchen.__executeServer(opts));
var quickThrottleKitchen = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(quickThrottleKitchen_createServerFn_handler, async ({ context, data }) => {
	return withVendor(context.userId, data.restaurantId, "hours.edit", async (sql, ctx) => {
		if (data.mode === "RUSH") await sql`update restaurants set prep_minutes = 35, updated_at = now() where id = ${ctx.restaurantId}`;
		else if (data.mode === "NORMAL") await sql`update restaurants set prep_minutes = 20, updated_at = now() where id = ${ctx.restaurantId}`;
		else if (data.mode === "PAUSE") await sql`update restaurants set emergency_closed = true, updated_at = now() where id = ${ctx.restaurantId}`;
		else if (data.mode === "RESUME") await sql`update restaurants set emergency_closed = false, updated_at = now() where id = ${ctx.restaurantId}`;
		return {
			ok: true,
			mode: data.mode
		};
	});
});
//#endregion
export { advanceSimulatedRider_createServerFn_handler, getDashboard_createServerFn_handler, getOperatingSnapshot_createServerFn_handler, listOrders_createServerFn_handler, quickThrottleKitchen_createServerFn_handler, saveHours_createServerFn_handler };
