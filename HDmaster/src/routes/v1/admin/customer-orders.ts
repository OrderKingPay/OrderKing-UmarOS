import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v1/admin/customer-orders")({
  
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        const { handleCustomerOrderListHttp } = await import("@/lib/orderking/server/customer-order-http.server");
        return handleCustomerOrderListHttp(request);
      },
      POST: async ({ request }: any) => {
        const { handleCustomerOrderHttp } = await import("@/lib/orderking/server/customer-order-http.server");
        return handleCustomerOrderHttp(request);
      },
    },
  },
});
