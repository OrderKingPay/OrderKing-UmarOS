// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v1/admin/customer-orders/$id/cancel")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request, params }: any) => {
        const { handleCustomerOrderCancelHttp } = await import("@/lib/orderking/server/customer-order-http.server");
        return handleCustomerOrderCancelHttp(request, params.id);
      },
    },
  },
});
