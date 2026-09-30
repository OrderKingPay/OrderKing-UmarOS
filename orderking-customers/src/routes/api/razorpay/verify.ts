import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";
import Razorpay from "razorpay";

export const Route = createFileRoute("/api/razorpay/verify")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const { getSql } = await import("@/lib/db");
          const user = await getSessionUser();
          if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

          const body = await request.json();
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};
          if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return Response.json({ error: "Incomplete Razorpay verification payload" }, { status: 400 });
          }

          const keyId = process.env.RAZORPAY_KEY_ID?.trim();
          const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
          if (!keyId || !keySecret) return Response.json({ error: "Payment provider not configured" }, { status: 503 });

          const generated = crypto
            .createHmac("sha256", keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");
          const given = String(razorpay_signature).trim();
          if (given.length !== generated.length ||
              !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(generated))) {
            return Response.json({ error: "Invalid signature" }, { status: 400 });
          }

          const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
          const order = await razorpay.orders.fetch(razorpay_order_id);
          const notes = (order.notes || {}) as Record<string, string>;
          if (notes.orderking_user_id !== user.id || notes.purpose !== "KINGPAY_WALLET_TOPUP") {
            return Response.json({ error: "Order ownership mismatch" }, { status: 403 });
          }

          const sql = await getSql();
          const txId = `rzp_${razorpay_payment_id}`;
          const existing = await sql`SELECT id FROM kingpay_transactions WHERE id = ${txId}`;
          if (existing.length > 0) {
            const current = await sql<{ balance_paise: number }>`SELECT balance_paise FROM kingpay_wallets WHERE user_id = ${user.id}`;
            return Response.json({ success: true, duplicate: true, balance: Number(current[0]?.balance_paise || 0) / 100 });
          }

          await sql.transaction(async (tx) => {
            await tx`INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins) VALUES (${user.id}, 0, 0) ON CONFLICT DO NOTHING`;
            await tx`UPDATE kingpay_wallets SET balance_paise = balance_paise + ${order.amount}, updated_at = NOW() WHERE user_id = ${user.id}`;
            await tx`
              INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description)
              VALUES (${txId}, ${user.id}, ${order.amount}, 'CREDIT', ${"Razorpay wallet top-up " + razorpay_payment_id})
            `;
          });

          const current = await sql<{ balance_paise: number }>`SELECT balance_paise FROM kingpay_wallets WHERE user_id = ${user.id}`;
          return Response.json({
            success: true,
            duplicate: false,
            balance: Number(current[0]?.balance_paise || 0) / 100,
          });
        } catch (error: any) {
          console.error("Razorpay verify error:", error);
          return Response.json({ error: "Verification failed" }, { status: 502 });
        }
      },
    },
  },
});
