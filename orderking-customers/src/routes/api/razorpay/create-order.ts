import { createFileRoute } from "@tanstack/react-router";
import { assertSameOrigin, requestRiskFingerprint } from "@/lib/security/request-integrity";

export const Route = createFileRoute("/api/razorpay/create-order")({
server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          assertSameOrigin(request);
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
          const mode = (process.env.RAZORPAY_MODE ?? "live").trim().toLowerCase();
          const isTestKey = keyId.startsWith("rzp_test_");
          if (mode === "live" && isTestKey) {
            return Response.json({ error: "Live Razorpay mode refuses test credentials" }, { status: 503 });
          }
          if (mode === "sandbox" && !isTestKey) {
            return Response.json({ error: "Sandbox Razorpay mode requires test credentials" }, { status: 503 });
          }

          const Razorpay = (await import("razorpay")).default; const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
          const options = {
            amount: Math.round(amount * 100),
            currency,
            receipt: `rcpt_${(await import("node:crypto")).randomBytes(8).toString("hex")}`,
            notes: {
              orderking_user_id: user.id,
              purpose: "KINGPAY_WALLET_TOPUP",
              security_fingerprint: requestRiskFingerprint(request, user.id),
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

