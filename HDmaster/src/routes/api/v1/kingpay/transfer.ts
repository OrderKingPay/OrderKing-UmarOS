import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { recordDoubleEntry } from "@/lib/orderking/finance/canonical-ledger";
import { RBACVault } from "@/lib/orderking/security/rbac-vault";
import { randomUUID } from "crypto";

const TransferRequestSchema = z.object({
  idempotencyKey: z.string().min(10),
  recipientAccountId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  memo: z.string().optional()
});

export const Route = createFileRoute("/api/v1/kingpay/transfer" as any)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = request.headers.get("Authorization") || "";
          const auth = RBACVault.verifyAndAuthorize(token.replace("Bearer ", ""), ["FOUNDER", "ADMIN"]);

          const body = await request.json();
          const data = TransferRequestSchema.parse(body);

          await recordDoubleEntry({
            idempotencyKey: data.idempotencyKey,
            eventType: "KINGPAY_USER_TRANSFER",
            memo: data.memo,
            entries: [
              {
                accountId: auth.userId,
                direction: "DEBIT",
                amountPaise: data.amountPaise,
                entityId: "USER"
              },
              {
                accountId: data.recipientAccountId,
                direction: "CREDIT",
                amountPaise: data.amountPaise,
                entityId: "USER"
              }
            ]
          });

          return new Response(JSON.stringify({ 
            success: true, 
            status: "TRANSFERRED",
            idempotencyKey: data.idempotencyKey
          }), { status: 200, headers: { "Content-Type": "application/json" } });

        } catch (error: any) {
          return new Response(JSON.stringify({ 
            error: "Transfer Failed. Mathematical safety enforced.",
            details: error.message 
          }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
      }
    }
  }
});
