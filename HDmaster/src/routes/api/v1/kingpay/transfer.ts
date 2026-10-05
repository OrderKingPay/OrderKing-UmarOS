import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { verifyBearerJwt, requireJwtSubject, requireJwtRole } from "@/lib/orderking/security/rbac-vault";

const TransferRequestSchema = z.object({
  idempotencyKey: z.string().min(10),
  recipientAccountId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  memo: z.string().optional(),
});

export const Route = createFileRoute("/api/v1/kingpay/transfer")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const token = request.headers.get("Authorization") || "";
          const { payload } = await verifyBearerJwt(token);
          requireJwtRole(payload, ["FOUNDER", "ADMIN"]);
          requireJwtSubject(payload);

          const data = TransferRequestSchema.parse(await request.json());
          const consumerUpiEnabled =
            process.env.KINGPAY_CONSUMER_UPI_ENABLED === "true";
          const providerConfigured =
            Boolean(process.env.KINGPAY_TRANSFER_PROVIDER) &&
            Boolean(process.env.KINGPAY_TRANSFER_PROVIDER_ACCOUNT_ID);

          if (!consumerUpiEnabled || !providerConfigured) {
            return new Response(
              JSON.stringify({
                success: false,
                status: "PENDING_EXTERNAL_PROVIDER",
                idempotencyKey: data.idempotencyKey,
                message:
                  "KingPay consumer transfer is not enabled. A verified regulated transfer provider is required before money movement.",
              }),
              { status: 503, headers: { "Content-Type": "application/json" } },
            );
          }

          // Provider adapter is intentionally required here. Never write a
          // ledger transfer as completed merely because the request was valid.
          return new Response(
            JSON.stringify({
              success: false,
              status: "PENDING_EXTERNAL_PROVIDER",
              idempotencyKey: data.idempotencyKey,
              message:
                "Transfer provider adapter is not connected; no funds were moved and no ledger entry was posted.",
            }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        } catch (error: any) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Transfer failed",
              details: error instanceof Error ? error.message : "Unknown transfer error",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
