
import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";
import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";
import { timingSafeHexCompare } from "@/lib/security/crypto-safe";
import { paymentLimiter } from "@/lib/security/rate-limiter";

export const Route = createFileRoute("/api/razorpay/verify")({
  
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
          const rateCheck = paymentLimiter.isAllowed(clientIp);
          if (!rateCheck.allowed) {
            return new Response(
              JSON.stringify({ error: "Too many payment verification requests. Please wait a moment." }),
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
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = body;

          const secret = process.env.RAZORPAY_KEY_SECRET;

          if (!secret) {
            return new Response(JSON.stringify({ error: "Server config error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return new Response(JSON.stringify({ error: "Missing required verification parameters" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (!/^[a-zA-Z0-9_]{6,64}$/.test(razorpay_order_id) || !/^[a-zA-Z0-9_]{6,64}$/.test(razorpay_payment_id)) {
            return new Response(JSON.stringify({ error: "Invalid payment identifier format" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const expectedHex = crypto
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

          const isValid = timingSafeHexCompare(expectedHex, razorpay_signature);

          if (isValid) {
            const user = await getSessionUser();
            if (!user) {
              return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
              });
            }

            const keyId = process.env.RAZORPAY_KEY_ID;
            let verifiedAmountPaise = 0;

            if (keyId && secret) {
              const basicAuth = Buffer.from(`${keyId}:${secret}`).toString("base64");
              const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
                headers: { Authorization: `Basic ${basicAuth}` },
              });
              if (!rzpRes.ok) {
                return new Response(JSON.stringify({ error: "Failed to verify payment with Razorpay gateway" }), {
                  status: 400,
                  headers: { "Content-Type": "application/json" },
                });
              }
              const paymentData = await rzpRes.json();
              if (paymentData.status !== "captured" && paymentData.status !== "authorized") {
                return new Response(JSON.stringify({ error: `Payment not completed (status: ${paymentData.status})` }), {
                  status: 400,
                  headers: { "Content-Type": "application/json" },
                });
              }
              if (paymentData.order_id && paymentData.order_id !== razorpay_order_id) {
                return new Response(JSON.stringify({ error: "Order ID mismatch" }), {
                  status: 400,
                  headers: { "Content-Type": "application/json" },
                });
              }
              verifiedAmountPaise = Number(paymentData.amount);
            } else {
              return new Response(JSON.stringify({ error: "Razorpay credentials unconfigured on server" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
              });
            }

            const sql = await getSql();
            const txId = `rzp_credit_${razorpay_payment_id}`;
            let alreadyCredited = false;

            if (verifiedAmountPaise > 0) {
              await sql.transaction(async (tx) => {
                await tx`
                  INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins)
                  VALUES (${user.id}, 0, 0)
                  ON CONFLICT (user_id) DO NOTHING
                `;

                // Row-level lock on wallet
                await tx`
                  SELECT balance_paise FROM kingpay_wallets
                  WHERE user_id = ${user.id}
                  FOR UPDATE
                `;

                // Replay prevention inside transaction
                const existingTx = await tx`
                  SELECT id FROM kingpay_transactions
                  WHERE id = ${txId} OR description LIKE ${`%${razorpay_payment_id}%`}
                  LIMIT 1
                `;
                if (existingTx.length > 0) {
                  alreadyCredited = true;
                  return;
                }

                await tx`
                  UPDATE kingpay_wallets
                  SET balance_paise = balance_paise + ${verifiedAmountPaise}, updated_at = NOW()
                  WHERE user_id = ${user.id}
                `;

                await tx`
                  INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description)
                  VALUES (${txId}, ${user.id}, ${verifiedAmountPaise}, 'CREDIT', ${`Razorpay Add Money: ${razorpay_payment_id}`})
                `;
              });
            }

            if (alreadyCredited) {
              return new Response(JSON.stringify({ success: true, message: "Payment already credited" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            return new Response(JSON.stringify({ success: true, creditedPaise: verifiedAmountPaise }), {
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

