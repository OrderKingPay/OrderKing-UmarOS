import { a as newId } from "./utils-BZJZXT5Z.mjs";
import { r as createServerFn } from "./ssr.mjs";
import { t as authMiddleware } from "./middleware-DsMHvbSu.mjs";
import { a as withVendor, i as notifyInApp, o as writeAudit, t as createServerRpc } from "./helpers-DJHrKkmK.mjs";
import { a as isRejectReason, i as isOrderState } from "./state-machine-DxXhKfD0.mjs";
import process from "node:process";
//#region node_modules/.nitro/vite/services/ssr/assets/hdmaster-order-transition-7rNR99pw.js
var CONTRACT_VERSION = "1";
function coreUrl() {
	const value = process.env.HDMASTER_URL?.trim();
	if (!value) throw new Error("HDMASTER_URL is not configured");
	return value.replace(/\/+$/, "");
}
function serviceToken() {
	const value = process.env.ORDERKING_SERVICE_TOKEN?.trim() || process.env.ORDERKING_SERVICE_TOKEN?.trim();
	if (!value) throw new Error("ORDERKING_SERVICE_TOKEN is not configured");
	return value;
}
function canonicalFrom(state) {
	switch (state) {
		case "PLACED": return "PENDING";
		case "ACCEPTED": return "CONFIRMED";
		case "PREPARING": return "PREPARING";
		case "READY": return "READY";
		default: throw new Error(`Order state ${state} cannot be transitioned by a restaurant`);
	}
}
function canonicalTo(action) {
	switch (action) {
		case "accept": return "CONFIRMED";
		case "reject": return "RESTAURANT_REJECTED";
		case "preparing": return "PREPARING";
		case "ready": return "READY";
	}
}
function localToCanonicalState(state) {
	if (!isOrderState(state)) throw new Error("Corrupt order state");
	return canonicalFrom(state);
}
function localStateFor(action) {
	return action === "accept" ? "ACCEPTED" : action === "reject" ? "REJECTED" : action === "preparing" ? "PREPARING" : "READY";
}
var transitionOrderViaHDmaster_createServerFn_handler = createServerRpc({
	id: "2bce48553a9158ea9749c9874b7cf5e0e41364507c0a634c77492defabb7b646",
	name: "transitionOrderViaHDmaster",
	filename: "src/lib/server/hdmaster-order-transition.ts"
}, (opts) => transitionOrderViaHDmaster.__executeServer(opts));
var transitionOrderViaHDmaster = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((d) => d).handler(transitionOrderViaHDmaster_createServerFn_handler, async ({ context, data }) => {
	const perm = data.action === "accept" ? "orders.accept" : data.action === "reject" ? "orders.reject" : data.action === "preparing" ? "orders.prepare" : "orders.ready";
	return withVendor(context.userId, data.restaurantId, perm, async (sql, ctx) => {
		if (!data.idempotencyKey || data.idempotencyKey.length < 8) throw new Error("Idempotency key required");
		const prior = await sql`
        select response_json from idempotency_keys
        where restaurant_id = ${ctx.restaurantId} and action = ${`core_${data.action}`} and key = ${data.idempotencyKey}
        limit 1
      `;
		if (prior[0]) return JSON.parse(prior[0].response_json);
		const order = (await sql`
        select id, state, data_label from orders
        where id = ${data.orderId} and restaurant_id = ${ctx.restaurantId}
        limit 1
      `)[0];
		if (!order || !isOrderState(order.state)) throw new Error("Order not found or has an invalid state");
		if (data.action === "reject" && (!data.reason || !isRejectReason(data.reason))) throw new Error("A valid reject reason is required");
		const from = localToCanonicalState(order.state);
		const to = canonicalTo(data.action);
		const response = await fetch(`${coreUrl()}/v1/admin/orders/${encodeURIComponent(order.id)}/transition`, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				authorization: `Bearer ${serviceToken()}`,
				"Idempotency-Key": data.idempotencyKey,
				"X-Correlation-Id": `partner:${ctx.restaurantId}:${order.id}:${data.action}`
			},
			body: JSON.stringify({
				contractVersion: CONTRACT_VERSION,
				restaurantId: ctx.restaurantId,
				from,
				to,
				reason: data.reason,
				correlationId: `partner:${ctx.restaurantId}:${order.id}:${data.action}`
			})
		});
		const payload = await response.json().catch(() => ({}));
		if (!response.ok || !payload.data?.state) throw new Error(payload.error ?? `HDmaster order transition failed (${response.status})`);
		const next = localStateFor(data.action);
		if ((await sql`
        update orders set state = ${next},
          reject_reason = ${data.action === "reject" ? data.reason ?? null : null},
          accepted_at = case when ${next} = 'ACCEPTED' then now() else accepted_at end,
          ready_at = case when ${next} = 'READY' then now() else ready_at end
        where id = ${order.id} and restaurant_id = ${ctx.restaurantId} and state = ${order.state}
      `).length !== 1) throw new Error("Local Partner projection changed concurrently; refresh and retry");
		await sql`
        insert into order_events (id, order_id, restaurant_id, previous_state, new_state, actor, actor_user_id, reason)
        values (${newId("evt")}, ${order.id}, ${ctx.restaurantId}, ${order.state}, ${next}, 'restaurant', ${context.userId}, ${data.reason ?? null})
      `;
		await writeAudit(sql, {
			restaurantId: ctx.restaurantId,
			actorUserId: context.userId,
			action: `order_${data.action}_via_hdmaster`,
			entityType: "order",
			entityId: order.id,
			detail: `${order.state}→${next}; canonical ${from}→${payload.data.state}`
		});
		await notifyInApp(sql, {
			restaurantId: ctx.restaurantId,
			type: "order_status",
			title: next,
			body: `${order.state} → ${next}`
		});
		const result = {
			ok: true,
			state: next,
			canonicalState: payload.data.state,
			duplicate: Boolean(payload.data.duplicate),
			dispatchQueued: next === "READY",
			authoritative: "HDmaster"
		};
		await sql`
        insert into idempotency_keys (key, restaurant_id, action, response_json)
        values (${data.idempotencyKey}, ${ctx.restaurantId}, ${`core_${data.action}`}, ${JSON.stringify(result)})
      `;
		return result;
	});
});
//#endregion
export { transitionOrderViaHDmaster_createServerFn_handler };
