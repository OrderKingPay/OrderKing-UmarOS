import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser } from "@/lib/auth/verify.server";
import { paymentLimiter } from "@/lib/security/rate-limiter";

export const Route = createFileRoute("/api/razorpay/create-order")({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const user = await getSessionUser();
          if (!user?.id) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Rate limiting protection
          const rateCheck = paymentLimiter.isAllowed(user.id);
          if (!rateCheck.allowed) {
            return new Response(
              JSON.stringify({ error: "Too many payment requests. Please wait a moment." }),
              {
                status: 429,
                headers: {
                  "Content-Type": "application/json",
                  "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)),
                },
              }
            );
          }

          const body = await request.json();
          const { amount, currency = "INR" } = body;

          if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > 100000) {
            return new Response(JSON.stringify({ error: "Valid positive amount is required" }), {
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

          if (!process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_") && !process.env.RAZORPAY_KEY_ID.startsWith("rzp_live_")) {
            return new Response(
              JSON.stringify({ error: "RAZORPAY_KEY_ID must be a valid key starting with 'rzp_test_' or 'rzp_live_'" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const token = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");

          // Amount in smallest unit (paise for INR)
          const options = {
            amount: Math.round(amount * 100),
            currency,
            receipt: "rcpt_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16),
          };

          const res = await fetch("https://api.razorpay.com/v1/orders", {
             method: "POST",
             headers: {
               "Authorization": "Basic " + token,
               "Content-Type": "application/json"
             },
             body: JSON.stringify(options)
          });
          const order = await res.json().catch(() => ({}));

          if (!res.ok) {
            const errDescription = order?.error?.description || `Razorpay order creation failed (${res.status})`;
            return new Response(JSON.stringify({ error: errDescription }), {
              status: res.status >= 400 && res.status < 600 ? res.status : 502,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (!order?.id) {
            return new Response(JSON.stringify({ error: "Invalid response from Razorpay gateway" }), {
              status: 502,
              headers: { "Content-Type": "application/json" },
            });
          }

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
