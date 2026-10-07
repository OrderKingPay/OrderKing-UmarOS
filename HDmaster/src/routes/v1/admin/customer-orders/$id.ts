import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v1/admin/customer-orders/$id")({
  
  server: {
    handlers: {
      GET: async ({ request, params }: any) => {
        const { handleCustomerOrderDetailHttp } = await import("@/lib/orderking/server/customer-order-http.server");
        return handleCustomerOrderDetailHttp(request, params.id);
      },
    },
  },
});
