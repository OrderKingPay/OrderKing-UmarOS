
import { createFileRoute } from "@tanstack/react-router";
import Razorpay from "razorpay";
import crypto from "crypto";

const kingPayWalletEnabled = process.env.KINGPAY_WALLET_ENABLED === "true";

export const Route = createFileRoute("/api/razorpay/create-order")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        if (!kingPayWalletEnabled) {
          return new Response(
            JSON.stringify({
              error: "KingPay wallet top-up is disabled until a real wallet/regulated payment ledger is connected.",
              state: "DISABLED",
            }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        }
        try {
          const body = await request.json();
          const { amount, currency = "INR" } = body;

          if (!amount) {
            return new Response(JSON.stringify({ error: "Amount is required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return new Response(
              JSON.stringify({ error: "Razorpay keys not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });

          // Amount in smallest unit (paise for INR)
          const options = {
            amount: Math.round(amount * 100),
            currency,
            receipt: `rcpt_${crypto.randomBytes(8).toString("hex")}`,
          };

          const order = await instance.orders.create(options);

          return new Response(JSON.stringify({
             ...order,
             key_id: process.env.RAZORPAY_KEY_ID
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Razorpay order error:", error);
          return new Response(
            JSON.stringify({ error: "Failed to create order" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
