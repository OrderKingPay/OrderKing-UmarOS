import { createFileRoute } from "@tanstack/react-router";
import type { CanonicalOrderStatus } from "@/lib/orderking/orders/canonical-contract";

const CONTRACT_VERSION = "1" as const;

function isCanonicalStatus(value: string): value is CanonicalOrderStatus {
  return [
    "PENDING", "CONFIRMED", "PREPARING", "READY", "RIDER_ASSIGNED", "PICKED_UP",
    "ON_THE_WAY", "ARRIVING", "DELIVERED", "CANCELLED", "PAYMENT_FAILED",
    "RESTAURANT_REJECTED", "RIDER_CANCELLED", "DELIVERY_FAILED", "CUSTOMER_UNAVAILABLE",
    "REFUND_PENDING", "REFUNDED", "DISPUTED",
  ].includes(value);
}

export const Route = createFileRoute("/v1/admin/orders/$id/rider-transition")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request, params }: any) => {
        const body = (await request.json()) as {
          riderId?: string;
          from?: string;
          to?: string;
          reason?: string;
          correlationId?: string;
          contractVersion?: string;
          lat?: number;
          lng?: number;
          accuracy?: number;
        };
        if (body.contractVersion !== CONTRACT_VERSION) {
          return new Response(JSON.stringify({ error: "Unsupported order contract version", code: "CONTRACT_VERSION_UNSUPPORTED" }), {
            status: 409,
            headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
          });
        }
        if (!body.riderId || !body.from || !body.to || !isCanonicalStatus(body.from) || !isCanonicalStatus(body.to)) {
          return new Response(JSON.stringify({ error: "riderId, from and to are required valid canonical statuses", code: "INVALID_REQUEST" }), {
            status: 400,
            headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
          });
        }
        const idempotencyKey = request.headers.get("Idempotency-Key") ?? "";
        const { handleRiderOrderTransition } = await import("@/lib/orderking/server/rider-http.server");
        return handleRiderOrderTransition(request, {
          orderId: params.id,
          riderId: body.riderId,
          from: body.from,
          to: body.to,
          reason: body.reason,
          idempotencyKey,
          correlationId: body.correlationId,
          lat: body.lat,
          lng: body.lng,
          accuracy: body.accuracy,
        });
      },
    },
  },
});
