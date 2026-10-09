
import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";
import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";

export const Route = createFileRoute("/api/razorpay/verify")({
  
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const body = await request.json();
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = body;

          const secret = process.env.RAZORPAY_KEY_SECRET;

          if (!secret) {
            return new Response(JSON.stringify({ error: "Server config error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const hmac = crypto.createHmac("sha256", secret);
          hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
          const generatedSignature = hmac.digest("hex");

          let isValid = false;
          try {
            isValid = crypto.timingSafeEqual(
              Buffer.from(generatedSignature, "hex"),
              Buffer.from(razorpay_signature, "hex")
            );
          } catch (e) {
            isValid = false;
          }

          if (isValid) {
            // Payment is verified
            // Update the user's wallet balance in the database
            const user = await getSessionUser();
            if (user) {
              const sql = await getSql();
              const amountPaise = Math.round(amount * 100);
              if (amountPaise > 0) {
                await sql.transaction(async (tx) => {
                  await tx`INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins) VALUES (${user.id}, 0, 0) ON CONFLICT DO NOTHING`;
                  await tx`UPDATE kingpay_wallets SET balance_paise = balance_paise + ${amountPaise}, updated_at = NOW() WHERE user_id = ${user.id}`;
                  await tx`INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description) VALUES (${crypto.randomUUID()}, ${user.id}, ${amountPaise}, 'CREDIT', 'Razorpay Add Money')`;
                });
              }
            }
            
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } else {
            return new Response(JSON.stringify({ error: "Invalid signature" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch (error) {
          console.error("Razorpay verify error:", error);
          return new Response(JSON.stringify({ error: "Verification failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});

