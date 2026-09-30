import { createFileRoute } from "@tanstack/react-router";
import Razorpay from "razorpay";
import crypto from "crypto";

export const Route = createFileRoute("/api/razorpay/create-order")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const user = await getSessionUser();
          if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

          const body = await request.json();
          const amount = Number(body?.amount);
          const currency = String(body?.currency || "INR").toUpperCase();
          if (!Number.isFinite(amount) || amount <= 0 || amount > 200000) {
            return Response.json({ error: "Invalid amount" }, { status: 400 });
          }

          const keyId = process.env.RAZORPAY_KEY_ID?.trim();
          const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
          if (!keyId || !keySecret) {
            return Response.json({ error: "Razorpay keys not configured" }, { status: 503 });
          }

          const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
          const options = {
            amount: Math.round(amount * 100),
            currency,
            receipt: `rcpt_${crypto.randomBytes(8).toString("hex")}`,
            notes: {
              orderking_user_id: user.id,
              purpose: "KINGPAY_WALLET_TOPUP",
            },
          };

          const order = await instance.orders.create(options);
          return Response.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: keyId,
          });
        } catch (error) {
          console.error("Razorpay order error:", error);
          return Response.json({ error: "Failed to create Razorpay order" }, { status: 502 });
        }
      },
    },
  },
});
