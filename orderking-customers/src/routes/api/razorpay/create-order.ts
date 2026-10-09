import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/razorpay/create-order")({
  
  server: {
    handlers: {
      POST: async ({ request }: any) => {
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

          if (!process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_")) {
            return new Response(
              JSON.stringify({ error: "Strict enforcement: RAZORPAY_KEY_ID MUST use a sandbox/test key starting with 'rzp_test_'" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const token = btoa(process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET);
          
          // Amount in smallest unit (paise for INR)
          const options = {
            amount: Math.round(amount * 100),
            currency,
            receipt: 'rcpt_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16),
          };

          const res = await fetch("https://api.razorpay.com/v1/orders", {
             method: "POST",
             headers: {
               "Authorization": "Basic " + token,
               "Content-Type": "application/json"
             },
             body: JSON.stringify(options)
          });
          const order = await res.json();

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
