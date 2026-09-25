import { randomInt } from "node:crypto";
import { requirePermission } from "@/lib/orderking/rbac";
import { appendAudit, ensureWorkspace, nid } from "@/lib/orderking/server/workspace.server";
import { getSql } from "@/lib/db";

function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }); }
function serviceUserId(request: Request): string { const authorization = request.headers.get("authorization")?.trim(); const token = process.env.ORDERKING_SERVICE_TOKEN?.trim(); const userId = process.env.ORDERKING_SERVICE_USER_ID?.trim(); if (!token || !userId || authorization !== `Bearer ${token}`) throw new Error("Unauthorized"); return userId; }

type CustomerOrderInput = {
  customerRef: string; restaurantId: string; cityId: string; zoneId: string; paymentMethod: "COD" | "UPI_SANDBOX" | "KING_PAY";
  foodPaise: number; restaurantDiscountPaise: number; platformDiscountPaise: number; deliveryFeePaise: number; serviceFeePaise: number; taxPaise: number; totalPaise: number; commissionPaise: number;
  address: { line1: string; area: string; landmark?: string; instructions?: string; label?: string; lat?: number; lng?: number }; notes?: string;
  lines: { itemId: string; name: string; qty: number; unitPaise: number }[];
};

async function authorizeService(request: Request) {
  const userId = serviceUserId(request);
  const ws = await ensureWorkspace(userId);
  return { userId, ws };
}

export async function handleCustomerOrderHttp(request: Request): Promise<Response> {
  try {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
    if (!idempotencyKey || idempotencyKey.length < 8) return json({ error: "Idempotency-Key is required", code: "IDEMPOTENCY_REQUIRED" }, 400);
    const { ws } = await authorizeService(request);
    requirePermission(ws.ctx, "modify_orders", { orgId: ws.ctx.orgId, cityId: ws.ctx.cityId });
    const input = (await request.json()) as CustomerOrderInput;
    if (!input.customerRef || !input.restaurantId || !input.cityId || !input.zoneId || !input.lines?.length) return json({ error: "customerRef, restaurantId, cityId, zoneId and lines are required", code: "INVALID_REQUEST" }, 400);
    if (input.paymentMethod === "UPI_SANDBOX" && ws.dataMode === "PRODUCTION") return json({ error: "Sandbox payment is not permitted in PRODUCTION", code: "PAYMENT_MODE_INVALID" }, 409);
    if (input.totalPaise < 0 || input.foodPaise < 0 || input.lines.some((line) => line.qty <= 0 || line.unitPaise < 0)) return json({ error: "Invalid monetary or quantity values", code: "INVALID_AMOUNT" }, 400);
    const sql = await getSql();
    const duplicate = await sql<{ response_json: string }>`select response_json from idempotency_keys where key=${idempotencyKey} and org_id=${ws.ctx.orgId} limit 1`;
    if (duplicate[0]) return json({ data: JSON.parse(duplicate[0].response_json) });
    const restaurant = await sql<{ id: string; city_id: string; zone_id: string; status: string }>`select id, city_id, zone_id, status from restaurants where id=${input.restaurantId} and org_id=${ws.ctx.orgId} limit 1`;
    if (!restaurant[0]) return json({ error: "Restaurant not found", code: "RESTAURANT_NOT_FOUND" }, 404);
    if (restaurant[0].city_id !== input.cityId || restaurant[0].zone_id !== input.zoneId) return json({ error: "Restaurant serviceability mismatch", code: "SERVICEABILITY_MISMATCH" }, 409);
    if (!["ACTIVE", "OPEN"].includes(restaurant[0].status)) return json({ error: "Restaurant is not accepting orders", code: "RESTAURANT_UNAVAILABLE" }, 409);
    const menu = await sql<{ id: string; name: string; price_paise: number; available: number }>`select id,name,price_paise,available from menu_items where org_id=${ws.ctx.orgId} and restaurant_id=${input.restaurantId}`;
    const menuById = new Map(menu.map((item) => [item.id, item]));
    for (const line of input.lines) { const item = menuById.get(line.itemId); if (!item || !item.available) return json({ error: `Menu item unavailable: ${line.itemId}`, code: "MENU_ITEM_UNAVAILABLE" }, 409); if (item.price_paise !== line.unitPaise) return json({ error: `Menu price changed for ${item.name}; refresh the menu and retry`, code: "MENU_PRICE_CHANGED" }, 409); }
    const customerRows = await sql<{ id: string }>`select id from customers where org_id=${ws.ctx.orgId} and display_ref=${input.customerRef} limit 1`;
    let customerId = customerRows[0]?.id;
    if (!customerId) { customerId = nid("cus"); await sql`insert into customers (id,org_id,city_id,display_ref,phone_masked,status,data_mode) values (${customerId},${ws.ctx.orgId},${input.cityId},${input.customerRef},'MASKED','ACTIVE',${ws.dataMode})`; }
    const orderId = nid("ord");
      if (input.paymentMethod === "KING_PAY") {
        const { kingpayLedgerEngine } = await import("@/lib/orderking/finance/kingpay-ledger-engine");
        const entry = kingpayLedgerEngine.processPayment(
          idempotencyKey + ":wallet",
          customerId,
          input.restaurantId,
          input.totalPaise / 100,
          2
        );
        if (entry.status === "BLOCKED_AML") return json({ error: "Payment blocked by AML policy", code: "AML_BLOCKED" }, 403);
      }
    if (process.env.VERCEL_ENV === "production" && input.paymentMethod === "UPI_SANDBOX") {
      return json({ error: "Sandbox UPI is not available in production.", code: "SANDBOX_PAYMENT_BLOCKED" }, 400);
    }
    const paymentStatus = input.paymentMethod === "COD" ? "PENDING" : input.paymentMethod === "KING_PAY" ? "PAID_WALLET" : "AUTHORIZED_SANDBOX";
    await sql`insert into orders (id,org_id,city_id,zone_id,restaurant_id,customer_id,status,payment_status,payment_method,food_paise,restaurant_discount_paise,platform_discount_paise,delivery_fee_paise,service_fee_paise,tax_paise,total_paise,commission_paise,promised_at,placed_at,data_mode,delivery_address_json,delivery_lat,delivery_lng,delivery_otp) values (${orderId},${ws.ctx.orgId},${input.cityId},${input.zoneId},${input.restaurantId},${customerId},'PENDING',${paymentStatus},${input.paymentMethod},${input.foodPaise},${input.restaurantDiscountPaise},${input.platformDiscountPaise},${input.deliveryFeePaise},${input.serviceFeePaise},${input.taxPaise},${input.totalPaise},${input.commissionPaise},now()+interval '45 minutes',now(),${ws.dataMode},${JSON.stringify(input.address)},${input.address.lat ?? null},${input.address.lng ?? null},${randomInt(1000, 10000).toString()})`;
    for (const line of input.lines) await sql`insert into order_items (id,org_id,order_id,menu_item_id,name,qty,unit_paise) values (${nid("oit")},${ws.ctx.orgId},${orderId},${line.itemId},${line.name},${line.qty},${line.unitPaise})`;
    await sql`insert into order_events (id,org_id,order_id,actor_employee_id,from_status,to_status,action,note) values (${nid("ev")},${ws.ctx.orgId},${orderId},${ws.ctx.employeeId},null,'PENDING','customer.order_created',${JSON.stringify({ customerRef: input.customerRef, address: input.address, notes: input.notes ?? null })})`;
    await appendAudit({ orgId: ws.ctx.orgId, employeeId: ws.ctx.employeeId, userId: ws.ctx.userId, roleKey: ws.ctx.actingRoleKey, action: "order.customer_created", targetType: "order", targetId: orderId, next: { status: "PENDING", customerId, restaurantId: input.restaurantId, dataMode: ws.dataMode }, reason: "Customer application order" });
    const result = { orderId, status: "PENDING", paymentStatus, totalPaise: input.totalPaise, dataMode: ws.dataMode };
    await sql`insert into idempotency_keys (key,org_id,employee_id,action,response_json) values (${idempotencyKey},${ws.ctx.orgId},${ws.ctx.employeeId},'order.customer_create',${JSON.stringify(result)}) on conflict (key) do nothing`;
    return json({ data: result });
  } catch (err) { const message = err instanceof Error ? err.message : "Unexpected error"; return json({ error: message, code: message === "Unauthorized" ? "UNAUTHORIZED" : "BAD_REQUEST" }, message === "Unauthorized" ? 401 : 400); }
}

export async function handleCustomerOrderCancelHttp(request: Request, orderId: string): Promise<Response> {
  try {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
    if (!idempotencyKey || idempotencyKey.length < 8) return json({ error: "Idempotency-Key is required", code: "IDEMPOTENCY_REQUIRED" }, 400);
    const { ws } = await authorizeService(request);
    requirePermission(ws.ctx, "cancel_orders", { orgId: ws.ctx.orgId, cityId: ws.ctx.cityId });
    const body = (await request.json().catch(() => ({}))) as { customerRef?: string; reason?: string };
    if (!body.customerRef) return json({ error: "customerRef is required", code: "INVALID_REQUEST" }, 400);
    const sql = await getSql();
    const duplicate = await sql<{ response_json: string }>`select response_json from idempotency_keys where key=${idempotencyKey} and org_id=${ws.ctx.orgId} limit 1`;
    if (duplicate[0]) return json({ data: JSON.parse(duplicate[0].response_json) });
    const rows = await sql<{ id: string; status: string; customer_ref: string }>`select o.id,o.status,c.display_ref as customer_ref from orders o join customers c on c.id=o.customer_id where o.id=${orderId} and o.org_id=${ws.ctx.orgId} and o.city_id=${ws.ctx.cityId} limit 1`;
    const order = rows[0];
    if (!order) return json({ error: "Order not found", code: "ORDER_NOT_FOUND" }, 404);
    if (order.customer_ref !== body.customerRef) return json({ error: "Order does not belong to customer", code: "FORBIDDEN" }, 403);
    if (!["PENDING", "CONFIRMED"].includes(order.status)) return json({ error: "Order can no longer be cancelled", code: "CANCELLATION_NOT_ALLOWED", status: order.status }, 409);
    await sql`update orders set status='CANCELLED', updated_at=now() where id=${order.id} and org_id=${ws.ctx.orgId} and status=${order.status}`;
    await sql`insert into order_events (id,org_id,order_id,actor_employee_id,from_status,to_status,action,note) values (${nid("ev")},${ws.ctx.orgId},${order.id},${ws.ctx.employeeId},${order.status},'CANCELLED','customer.order_cancelled',${JSON.stringify({ customerRef: body.customerRef, reason: body.reason ?? null })})`;
    await appendAudit({ orgId: ws.ctx.orgId, employeeId: ws.ctx.employeeId, userId: ws.ctx.userId, roleKey: ws.ctx.actingRoleKey, action: "order.customer_cancelled", targetType: "order", targetId: order.id, next: { status: "CANCELLED" }, reason: body.reason ?? "Customer cancellation" });
    const result = { orderId: order.id, status: "CANCELLED", authoritative: "HDmaster" as const };
    await sql`insert into idempotency_keys (key,org_id,employee_id,action,response_json) values (${idempotencyKey},${ws.ctx.orgId},${ws.ctx.employeeId},'order.customer_cancel',${JSON.stringify(result)}) on conflict (key) do nothing`;
    return json({ data: result });
  } catch (err) { const message = err instanceof Error ? err.message : "Unexpected error"; return json({ error: message, code: message === "Unauthorized" ? "UNAUTHORIZED" : "BAD_REQUEST" }, message === "Unauthorized" ? 401 : 400); }
}
export async function handleCustomerOrderListHttp(request: Request): Promise<Response> {
  try {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const { ws } = await authorizeService(request);
    const url = new URL(request.url);
    const customerRef = url.searchParams.get("customerRef");
    if (!customerRef) return json({ error: "customerRef is required" }, 400);
    const sql = await getSql();
    const customerRows = await sql<{ id: string }>`select id from customers where org_id=${ws.ctx.orgId} and display_ref=${customerRef} limit 1`;
    const customerId = customerRows[0]?.id;
    if (!customerId) return json({ data: { orders: [] } });
    
    const rows = await sql<{
      id: string, status: string, total_paise: number, placed_at: string, data_mode: string,
      restaurant_name: string, restaurant_slug: string, preview: string | null
    }>`select o.id, o.status, o.total_paise, o.placed_at::text, o.data_mode, r.name as restaurant_name, r.slug as restaurant_slug, 
    (select string_agg(name, ', ') from (select name from order_items where order_id=o.id limit 3) s) as preview
    from orders o join restaurants r on r.id=o.restaurant_id 
    where o.customer_id=${customerId} and o.org_id=${ws.ctx.orgId} order by o.placed_at desc limit 50`;
    
    const orders = rows.map((r) => ({
      id: r.id, status: r.status, totalPaise: r.total_paise, placedAt: r.placed_at, dataMode: r.data_mode,
      restaurantName: r.restaurant_name, restaurantSlug: r.restaurant_slug, itemPreview: r.preview ?? ""
    }));
    return json({ data: { orders } });
  } catch (err) { const message = err instanceof Error ? err.message : "Unexpected error"; return json({ error: message }, 400); }
}

export async function handleCustomerOrderDetailHttp(request: Request, orderId: string): Promise<Response> {
  try {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const { ws } = await authorizeService(request);
    const url = new URL(request.url);
    const customerRef = url.searchParams.get("customerRef");
    if (!customerRef) return json({ error: "customerRef is required" }, 400);
    const sql = await getSql();
    
    const rows = await sql<{
      id: string, status: string, total_paise: number, placed_at: string, data_mode: string,
      restaurant_id: string, payment_method: string, payment_status: string, delivery_otp: string,
      delivery_address_json: string, notes: string | null,
      restaurant_name: string, restaurant_slug: string, customer_ref: string
    }>`select o.id, o.status, o.total_paise, o.placed_at::text, o.data_mode, o.restaurant_id, o.payment_method, o.payment_status, o.delivery_otp, o.delivery_address_json, o.notes, r.name as restaurant_name, r.slug as restaurant_slug, c.display_ref as customer_ref 
    from orders o join restaurants r on r.id=o.restaurant_id join customers c on c.id=o.customer_id 
    where o.id=${orderId} and o.org_id=${ws.ctx.orgId} limit 1`;
    
    const order = rows[0];
    if (!order) return json({ error: "Order not found" }, 404);
    if (order.customer_ref !== customerRef) return json({ error: "Order does not belong to customer" }, 403);
    
    const items = await sql<{ menu_item_id: string, name: string, qty: number, unit_paise: number }>`select menu_item_id, name, qty, unit_paise from order_items where order_id=${orderId}`;
    const events = await sql<{ to_status: string, created_at: string, note: string | null }>`select to_status, created_at::text, note from order_events where order_id=${orderId} order by created_at`;
    
    return json({ data: { order: {
      id: order.id, status: order.status, totalPaise: order.total_paise, placedAt: order.placed_at, dataMode: order.data_mode,
      restaurantId: order.restaurant_id, restaurantName: order.restaurant_name, restaurantSlug: order.restaurant_slug,
      paymentMethod: order.payment_method, paymentStatus: order.payment_status, deliveryOtp: order.delivery_otp,
      addressSnapshot: JSON.parse(order.delivery_address_json), notes: order.notes,
      items: items.map(i => ({ itemId: i.menu_item_id, name: i.name, quantity: i.qty, lineTotalPaise: i.qty * i.unit_paise })),
      events: events.map(e => ({ toStatus: e.to_status, createdAt: e.created_at, note: e.note }))
    }}});
  } catch (err) { const message = err instanceof Error ? err.message : "Unexpected error"; return json({ error: message }, 400); }
}

