import { requireUserId } from "@/lib/auth/verify.server";
import { ensureWorkspace, appendAudit, nid } from "@/lib/orderking/server/workspace.server";
import { ForbiddenError, requirePermission } from "@/lib/orderking/rbac";
import { assertCanonicalTransition, ORDER_CONTRACT_VERSION, type CanonicalOrderStatus } from "@/lib/orderking/orders/canonical-contract";
import { getSql } from "@/lib/db";
import { z } from "zod";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function fail(err: unknown) {
  if (err instanceof ForbiddenError) return json({ error: err.message, code: "FORBIDDEN" }, 403);
  const message = err instanceof Error ? err.message : "Unexpected error";
  if (message === "Unauthorized") return json({ error: message, code: "UNAUTHORIZED" }, 401);
  return json({ error: message, code: "BAD_REQUEST" }, 400);
}

function splatOf(params: Record<string, string | undefined>): string {
  return (params._splat ?? params["$"] ?? Object.values(params)[0] ?? "").replace(/^\/+|\/+$/g, "");
}

async function resolveAdminUserId(request: Request): Promise<string> {
  const authorization = request.headers.get("authorization")?.trim();
  const configuredToken = process.env.ORDERKING_SERVICE_TOKEN?.trim();
  const configuredUserId = process.env.ORDERKING_SERVICE_USER_ID?.trim();
  if (configuredToken && configuredUserId && authorization === `Bearer ${configuredToken}`) return configuredUserId;
  return requireUserId();
}

async function transitionRestaurantOrder(
  ws: Awaited<ReturnType<typeof ensureWorkspace>>,
  input: {
    orderId: string;
    restaurantId: string;
    from: CanonicalOrderStatus;
    to: CanonicalOrderStatus;
    reason?: string;
    idempotencyKey: string;
    correlationId?: string;
  },
) {
  requirePermission(ws.ctx, "modify_orders", { orgId: ws.ctx.orgId, cityId: ws.ctx.cityId });
  assertCanonicalTransition({
    contractVersion: ORDER_CONTRACT_VERSION,
    orderId: input.orderId,
    from: input.from,
    to: input.to,
    actor: "restaurant",
    idempotencyKey: input.idempotencyKey,
    reason: input.reason,
    correlationId: input.correlationId,
  });
  if (input.to === "RESTAURANT_REJECTED" && (!input.reason || input.reason.trim().length < 3)) {
    throw new Error("Restaurant rejection requires a reason");
  }

  const sql = await getSql();
  const existing = await sql.query<{ response_json: string }>(
    `select response_json from idempotency_keys where key=$1 and org_id=$2 limit 1`,
    [input.idempotencyKey, ws.ctx.orgId],
  );
  if (existing[0]) {
    try {
      return JSON.parse(existing[0].response_json) as Record<string, unknown>;
    } catch {
      throw new Error("Stored idempotency response is corrupt");
    }
  }

  const orderRows = await sql.query<{
    id: string;
    status: CanonicalOrderStatus;
    restaurant_id: string;
    city_id: string;
    data_mode: string;
    customer_id: string;
  }>(
    `select id, status, restaurant_id, city_id, data_mode, customer_id from orders
     where id=$1 and org_id=$2 ${ws.ctx.cityId ? "and city_id=$3" : ""} limit 1`,
    ws.ctx.cityId ? [input.orderId, ws.ctx.orgId, ws.ctx.cityId] : [input.orderId, ws.ctx.orgId],
  );
  const order = orderRows[0];
  if (!order) throw new ForbiddenError("Order not found");
  if (order.restaurant_id !== input.restaurantId) throw new ForbiddenError("Restaurant isolation");
  if (order.status !== input.from) throw new Error(`Stale order state: expected ${input.from}, found ${order.status}`);

  const updated = await sql.query<{ id: string }>(
    `update orders set
       status=$4,
       reject_reason=case when $4='RESTAURANT_REJECTED' then $6 else reject_reason end,
       confirmed_at=case when $4='CONFIRMED' then now() else confirmed_at end,
       ready_at=case when $4='READY' then now() else ready_at end
     where id=$1 and org_id=$2 and restaurant_id=$3 and status=$5
     returning id`,
    [input.orderId, ws.ctx.orgId, input.restaurantId, input.to, input.from, input.reason ?? null],
  );
  if (!updated[0]) throw new Error("Order transition lost a concurrency race; retry with a fresh order state");

  await sql.query(
    `insert into order_events (id, org_id, order_id, actor_employee_id, from_status, to_status, action, note)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [nid("ev"), ws.ctx.orgId, input.orderId, ws.ctx.employeeId, input.from, input.to, `restaurant.${input.to.toLowerCase()}`, input.reason ?? null],
  );
  await appendAudit({
    orgId: ws.ctx.orgId,
    employeeId: ws.ctx.employeeId,
    userId: ws.ctx.userId,
    roleKey: ws.ctx.actingRoleKey,
    action: "order.restaurant_transition",
    targetType: "order",
    targetId: input.orderId,
    previous: { status: input.from, restaurantId: input.restaurantId },
    next: { status: input.to, actor: "restaurant" },
    reason: input.reason,
  });

  // Fire push notification in the background
  const { NotificationService } = await import("@/lib/orderking/server/NotificationService");
  NotificationService.sendOrderStatusUpdate(
    ws.ctx.orgId,
    input.orderId,
    order.customer_id,
    input.to,
    { reason: input.reason ?? "" }
  ).catch(err => console.error("[NotificationError]", err));

  // Trigger autonomous algorithmic rider auto-dispatch without founder manual intervention
  if (input.to === "READY" || input.to === "PREPARING") {
    import("./auto-dispatch-engine.server.ts")
      .then(m => m.runAlgorithmicAutoDispatch())
      .catch(err => console.error("[AutoDispatchError]", err));
  }

  const result = {
    ok: true as const,
    contractVersion: ORDER_CONTRACT_VERSION,
    orderId: input.orderId,
    from: input.from,
    state: input.to,
    actor: "restaurant" as const,
    duplicate: false as const,
    dataMode: order.data_mode,
    dispatch: input.to === "READY" ? { status: "PENDING_MATCH" as const } : null,
  };
  await sql.query(
    `insert into idempotency_keys (key, org_id, employee_id, action, response_json)
     values ($1,$2,$3,$4,$5) on conflict (key) do nothing`,
    [input.idempotencyKey, ws.ctx.orgId, ws.ctx.employeeId, "order.restaurant_transition", JSON.stringify(result)],
  );
  return result;
}

export async function handleAdminHttp(
  request: Request,
  params: Record<string, string | undefined>,
): Promise<Response> {
  try {
    const userId = await resolveAdminUserId(request);
    const ws = await ensureWorkspace(userId);
    const q = await import("@/lib/orderking/server/queries.server");
    const path = splatOf(params);
    const method = request.method.toUpperCase();
    const url = new URL(request.url);
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;

    if (method === "GET" && path === "dashboard") return json({ data: await q.dashboardPayload(ws), label: "ACTUAL" });
    if (method === "GET" && path === "orders") {
      return json({ data: await q.listOrders(ws.ctx, {
        delayed: url.searchParams.get("delayed") === "1",
        status: url.searchParams.get("status") ?? undefined,
        cityId: url.searchParams.get("city") ?? undefined,
        restaurantId: url.searchParams.get("restaurantId") ?? undefined,
        minutes: url.searchParams.get("minutes") ? Number(url.searchParams.get("minutes")) : undefined,
      }) });
    }
    if (method === "GET" && path.startsWith("orders/")) return json({ data: await q.getOrder(ws.ctx, path.slice("orders/".length)) });
    if (method === "GET" && path === "restaurants") return json({ data: await q.listRestaurants(ws.ctx) });
    if (method === "GET" && path.startsWith("restaurants/") && !path.includes("/partner-")) {
      const rId = path.slice("restaurants/".length);
      return json({ data: await q.getRestaurant(ws.ctx, rId) });
    }
    if (method === "GET" && (path === "onboarding/submissions" || path === "onboarding")) {
      return json({ data: await q.listOnboardingSubmissions(ws.ctx) });
    }
    if (method === "GET" && path === "commercial-dials") {
      const { getCommercialDials } = await import("@/lib/orderking/server/commercial-dials.server");
      return json({ data: await getCommercialDials(ws.ctx) });
    }
    if (method === "GET" && path === "riders") return json({ data: await q.listRiders(ws.ctx) });
    if (method === "GET" && path.startsWith("restaurants/") && path.endsWith("/partner-dashboard")) {
      const rId = path.split("/")[1]!;
      return json({ data: await q.getPartnerDashboard(ws.ctx, rId) });
    }
    if (method === "GET" && path.startsWith("restaurants/") && path.endsWith("/partner-orders")) {
      const rId = path.split("/")[1]!;
      const scope = (url.searchParams.get("scope") as any) ?? "live";
      return json({ data: await q.listPartnerOrders(ws.ctx, rId, scope) });
    }
    if (method === "GET" && path === "customers") return json({ data: await q.listCustomers(ws.ctx) });
    if (method === "GET" && path.startsWith("customers/")) return json({ data: await q.getCustomer(ws.ctx, path.slice("customers/".length)) });
    if (method === "GET" && path === "support") return json({ data: await q.listTickets(ws.ctx) });
    if (method === "GET" && path === "analytics") return json({ data: await q.analyticsSeries(ws.ctx) });
    if (method === "GET" && path === "finance") return json({ data: { summary: await q.financeSummary(ws.ctx), profitability: await q.profitability(ws.ctx) } });
    if (method === "GET" && path === "settlements") return json({ data: await q.listSettlementBatches(ws.ctx, url.searchParams.get("party") === "RIDER" ? "RIDER" : "RESTAURANT") });
    if (method === "GET" && path === "audit") return json({ data: await q.listAudit(ws.ctx, url.searchParams.get("q") ?? undefined) });
    if (method === "GET" && path === "settings") return json({ data: await q.getSettings(ws.ctx) });
    if (method === "GET" && path === "governance") return json({ data: await q.getPlatformGovernance(ws.ctx) });
    if (method === "GET" && path === "configurations") return json({ data: await q.listAppConfigurations(ws.ctx, url.searchParams.get("category") ?? undefined) });
    if (method === "GET" && path.startsWith("configurations/")) return json({ data: await q.getAppConfiguration(ws.ctx, path.slice("configurations/".length)) });
    if (method === "GET" && path === "feature-flags") return json({ data: await q.listFlags(ws.ctx) });
    if (method === "GET" && path === "branding") return json({ data: await q.getBranding(ws.ctx) });
    if (method === "GET" && path === "health") return json({ data: await q.systemHealth(ws.ctx) });
    if (method === "POST" && path === "ai") return json({ error: "Use the Command assistant surface for AI. HTTP AI is reserved for Window 5." }, 501);

    if (method === "POST" && /^orders\/.+\/transition$/.test(path)) {
      if (!idempotencyKey || idempotencyKey.length < 8) return json({ error: "Idempotency-Key header is required", code: "IDEMPOTENCY_REQUIRED" }, 400);
      const orderId = path.split("/")[1]!;
      const transitionSchema = z.object({
        restaurantId: z.string().min(1),
        from: z.string().min(1) as z.ZodType<CanonicalOrderStatus>,
        to: z.string().min(1) as z.ZodType<CanonicalOrderStatus>,
        reason: z.string().optional(),
        correlationId: z.string().optional(),
        contractVersion: z.string().optional()
      });
      let body;
      try {
        body = transitionSchema.parse(await request.json());
      } catch (e: any) {
        return json({ error: "Invalid request payload", details: e.errors, code: "INVALID_REQUEST" }, 400);
      }
      if (body.contractVersion !== ORDER_CONTRACT_VERSION) return json({ error: "Unsupported order contract version", code: "CONTRACT_VERSION_UNSUPPORTED" }, 409);
      if (!body.restaurantId || !body.from || !body.to) return json({ error: "restaurantId, from and to are required", code: "INVALID_REQUEST" }, 400);
      return json({ data: await transitionRestaurantOrder(ws, { orderId, restaurantId: body.restaurantId, from: body.from, to: body.to, reason: body.reason, idempotencyKey, correlationId: body.correlationId }) });
    }

    if (method === "POST" && /^orders\/.+\/dispatch-rider$/.test(path)) {
      const orderId = path.split("/")[1]!;
      const { runAlgorithmicAutoDispatch } = await import("./auto-dispatch-engine.server.ts");
      const result = await runAlgorithmicAutoDispatch();
      return json({ ok: true, orderId, autoDispatchResult: result });
    }

    if (method === "POST" && /^restaurants\/.+\/approve$/.test(path)) {
      const rId = path.split("/")[1]!;
      const approveSchema = z.object({ reason: z.string().optional() });
      let body: { reason?: string } = {};
      try {
        const text = await request.text();
        if (text) body = approveSchema.parse(JSON.parse(text));
      } catch {}
      const reason = body.reason || "UmarOS Admin partner onboarding verification approval";
      const result = await q.setRestaurantStatus(ws, rId, "ACTIVE", reason);
      return json({ ok: true, data: result });
    }
    if (method === "POST" && /^restaurants\/.+\/status$/.test(path)) {
      const rId = path.split("/")[1]!;
      const statusSchema = z.object({ status: z.string().min(1), reason: z.string().min(1) });
      let body;
      try { body = statusSchema.parse(await request.json()); } catch (e: any) { return json({ error: "Invalid payload", details: e.errors }, 400); }
      const result = await q.setRestaurantStatus(ws, rId, body.status, body.reason);
      return json({ ok: true, data: result });
    }
    if (method === "POST" && (path === "onboarding/approve" || path === "onboarding/verify")) {
      const approveSchema = z.object({ restaurantId: z.string().min(1), reason: z.string().optional() });
      let body;
      try { body = approveSchema.parse(await request.json()); } catch (e: any) { return json({ error: "Invalid payload", details: e.errors }, 400); }
      const result = await q.setRestaurantStatus(ws, body.restaurantId, "ACTIVE", body.reason || "UmarOS Partner Onboarding Instant Verification");
      return json({ ok: true, data: result });
    }
    if (method === "POST" && path === "commercial-dials/platform-fee") {
      const { updatePlatformFeeDial } = await import("@/lib/orderking/server/commercial-dials.server");
      const schema = z.object({ feePaise: z.number().min(0), reason: z.string().min(1) });
      let body;
      try { body = schema.parse(await request.json()); } catch (e: any) { return json({ error: "Invalid payload", details: e.errors }, 400); }
      const result = await updatePlatformFeeDial(ws, body.feePaise, body.reason);
      return json({ ok: true, data: result });
    }
    if (method === "POST" && path === "commercial-dials/outlet-commission") {
      const { updateOutletCommission } = await import("@/lib/orderking/server/commercial-dials.server");
      const schema = z.object({ restaurantId: z.string().min(1), commissionBps: z.number().min(0).max(3500), reason: z.string().min(1) });
      let body;
      try { body = schema.parse(await request.json()); } catch (e: any) { return json({ error: "Invalid payload", details: e.errors }, 400); }
      const result = await updateOutletCommission(ws, body.restaurantId, body.commissionBps, body.reason);
      return json({ ok: true, data: result });
    }
    if (method === "POST" && path === "settings") {
      const schema = z.object({
        settings: z.record(z.string(), z.any()),
        reason: z.string().optional().default("Updated via UmarOS Central Governance Engine")
      });
      let body;
      try { body = schema.parse(await request.json()); } catch (e: any) { return json({ error: "Invalid payload", details: e.errors }, 400); }
      const result = await q.saveSettings(ws, body.settings as any, body.reason);
      return json({ ok: true, data: result });
    }
    if (method === "POST" && path === "governance") {
      const schema = z.object({
        modules: z.record(z.string(), z.any()).optional(),
        pricingDeliveryRules: z.record(z.string(), z.any()).optional(),
        dynamicBranding: z.record(z.string(), z.any()).optional(),
        settings: z.record(z.string(), z.any()).optional(),
        reason: z.string().optional().default("Updated via UmarOS Central Governance Engine")
      });
      let body;
      try { body = schema.parse(await request.json()); } catch (e: any) { return json({ error: "Invalid payload", details: e.errors }, 400); }
      const result = await q.savePlatformGovernance(ws, {
        modules: body.modules,
        pricingDeliveryRules: body.pricingDeliveryRules,
        dynamicBranding: body.dynamicBranding,
        settings: body.settings,
        reason: body.reason,
      });
      return json({ ok: true, data: result });
    }
    if (method === "POST" && path === "configurations") {
      const schema = z.object({
        key: z.string().min(1),
        value: z.any(),
        category: z.string().optional().default("general"),
        reason: z.string().optional().default("Updated via UmarOS Configurations Engine")
      });
      let body;
      try { body = schema.parse(await request.json()); } catch (e: any) { return json({ error: "Invalid payload", details: e.errors }, 400); }
      const result = await q.setAppConfiguration(ws, body.key, body.value, body.category, body.reason);
      return json({ ok: true, data: result });
    }

    if (method === "POST" && path === "dispatch/reassign") {
      const reassignSchema = z.object({ orderId: z.string().min(1), riderId: z.string().min(1), reason: z.string().min(1) });
      let body;
      try { body = reassignSchema.parse(await request.json()); } catch (e: any) { return json({ error: "Invalid payload", details: e.errors }, 400); }
      await q.interveneOrder(ws, { orderId: body.orderId, action: "assign_rider", riderId: body.riderId, reason: body.reason, idempotencyKey });
      return json({ ok: true, note: "Dispatch reassignment executed and committed to core dispatch ledger." });
    }
    if (method === "POST" && /^orders\/.+\/refund$/.test(path)) {
      const orderId = path.split("/")[1]!;
      const refundSchema = z.object({ reason: z.string().min(1), amountPaise: z.number().optional() });
      let body;
      try { body = refundSchema.parse(await request.json()); } catch (e: any) { return json({ error: "Invalid payload", details: e.errors }, 400); }
      await q.interveneOrder(ws, { orderId, action: "refund", reason: body.reason, amountPaise: body.amountPaise, idempotencyKey });
      return json({ ok: true, label: "ACTUAL" });
    }
    if (method === "POST" && /^orders\/.+\/cancel$/.test(path)) {
      const orderId = path.split("/")[1]!;
      const cancelSchema = z.object({ reason: z.string().min(1) });
      let body;
      try { body = cancelSchema.parse(await request.json()); } catch (e: any) { return json({ error: "Invalid payload", details: e.errors }, 400); }
      await q.interveneOrder(ws, { orderId, action: "cancel", reason: body.reason, idempotencyKey });
      return json({ ok: true, label: "ACTUAL" });
    }
    if (method === "POST" && path === "support") {
      const supportSchema = z.object({ id: z.string().optional(), action: z.enum(["assign", "note", "reply", "resolve", "reopen"]), body: z.string().optional(), resolutionCode: z.string().optional() });
      let body;
      try { body = supportSchema.parse(await request.json()); } catch (e: any) { return json({ error: "Invalid payload", details: e.errors }, 400); }
      if (!body.id) return json({ error: "Ticket id required" }, 400);
      await q.mutateTicket(ws, { ...body, id: body.id, idempotencyKey });
      return json({ ok: true });
    }
    if (method === "POST" && /^settlements\/.+\/approve$/.test(path)) {
      const id = path.split("/")[1]!;
      const approveSchema = z.object({ reason: z.string().min(1), decision: z.enum(["APPROVED", "REJECTED"]).optional() });
      let body;
      try { body = approveSchema.parse(await request.json()); } catch (e: any) { return json({ error: "Invalid payload", details: e.errors }, 400); }
      const result = await q.approveSettlement(ws, id, body.decision ?? "APPROVED", body.reason);
      return json({ ok: true, note: result.note });
    }
    if (method === "PATCH" || method === "PUT" || method === "DELETE") {
      if (path.startsWith("audit")) return json({ error: "Audit log is append-only", code: "FORBIDDEN" }, 405);
    }
    return json({ error: "Not found", path: `/v1/admin/${path}` }, 404);
  } catch (err) {
    return fail(err);
  }
}
