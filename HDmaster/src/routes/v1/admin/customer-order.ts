import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v1/admin/customer-order")({
  
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        const { handleCustomerOrderReadHttp } = await import("@/lib/orderking/server/customer-order-read-http.server");
        return handleCustomerOrderReadHttp(request);
      },
    },
  },
});
