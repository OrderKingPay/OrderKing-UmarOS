import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { newId } from "@/lib/ids";

export type OrderReview = {
  id: string;
  orderId: string;
  restaurantId: string;
  rating: number;
  body: string;
  responseBody: string | null;
  createdAt: string;
};

export const submitOrderReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { orderId: string; rating: number; body?: string }) => input)
  .handler(async ({ context, data }) => {
    const rating = Math.min(5, Math.max(1, Math.floor(data.rating)));
    const body = (data.body ?? "").trim().slice(0, 500);

    const sql = await getSql();

    // Verify order exists, belongs to customer, and is delivered
    const orders = await sql<{ id: string; restaurant_id: string; status: string; data_label: string }>`
      select id, restaurant_id, status, data_label from orders where id = ${data.orderId} and user_id = ${context.userId}
    `;
    const order = orders[0];
    if (!order) throw new Error("Order not found or access denied.");
    if (order.status !== "DELIVERED") throw new Error("You can only review an order after it has been delivered.");

    // Ensure reviews table exists (matches OrderKing partner table schema)
    await sql`
      create table if not exists reviews (
        id text primary key,
        restaurant_id text not null,
        order_id text,
        rating integer not null,
        body text not null default '',
        data_label text not null default 'REAL',
        created_at timestamptz not null default now()
      )
    `;

    // Check if review already exists for this order
    const existing = await sql<{ id: string }>`
      select id from reviews where order_id = ${data.orderId}
    `;

    let reviewId: string;
    if (existing[0]) {
      reviewId = existing[0].id;
      await sql`
        update reviews
        set rating = ${rating}, body = ${body}, created_at = now()
        where id = ${reviewId}
      `;
    } else {
      reviewId = newId("rev");
      await sql`
        insert into reviews (id, restaurant_id, order_id, rating, body, data_label, created_at)
        values (${reviewId}, ${order.restaurant_id}, ${order.id}, ${rating}, ${body}, ${order.data_label}, now())
      `;
    }

    // Write audit event
    await sql`
      insert into order_events (id, order_id, from_status, to_status, actor_user_id, actor_role, note)
      values (${newId("oev")}, ${order.id}, ${order.status}, ${order.status}, ${context.userId}, 'customer', ${`Rated ${rating} stars: ${body.slice(0, 40)}`})
    `;

    return { ok: true, reviewId, rating, body };
  });

export const getOrderReview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { orderId: string }) => input)
  .handler(async ({ context, data }): Promise<{ review: OrderReview | null }> => {
    const sql = await getSql();
    // Verify user owns order
    const orders = await sql<{ id: string }>`
      select id from orders where id = ${data.orderId} and user_id = ${context.userId}
    `;
    if (!orders[0]) return { review: null };

    // Ensure reviews table exists
    await sql`
      create table if not exists reviews (
        id text primary key,
        restaurant_id text not null,
        order_id text,
        rating integer not null,
        body text not null default '',
        data_label text not null default 'REAL',
        created_at timestamptz not null default now()
      )
    `;

    await sql`
      create table if not exists review_responses (
        id text primary key,
        review_id text unique not null,
        restaurant_id text not null,
        author_user_id text not null,
        body text not null,
        created_at timestamptz not null default now()
      )
    `;

    const rows = await sql<{
      id: string;
      order_id: string;
      restaurant_id: string;
      rating: number;
      body: string;
      response_body: string | null;
      created_at: string;
    }>`
      select r.id, r.order_id, r.restaurant_id, r.rating, r.body, rr.body as response_body, r.created_at::text as created_at
      from reviews r
      left join review_responses rr on rr.review_id = r.id
      where r.order_id = ${data.orderId}
      limit 1
    `;

    const r = rows[0];
    if (!r) return { review: null };

    return {
      review: {
        id: r.id,
        orderId: r.order_id,
        restaurantId: r.restaurant_id,
        rating: Number(r.rating),
        body: r.body,
        responseBody: r.response_body,
        createdAt: r.created_at,
      },
    };
  });
