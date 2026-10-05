
import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";

const kingPayWalletEnabled = process.env.KINGPAY_WALLET_ENABLED === "true";

export const Route = createFileRoute("/api/razorpay/verify")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        if (!kingPayWalletEnabled) {
          return new Response(
            JSON.stringify({
              error: "KingPay wallet verification is disabled until a real wallet/regulated payment ledger is connected.",
              state: "DISABLED",
            }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        }
        try {
          const body = await request.json();
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

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

          if (generatedSignature === razorpay_signature) {
            // Payment is verified
            // Here you would typically update the user's wallet balance in the database
            
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
