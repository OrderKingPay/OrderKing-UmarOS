import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v1/payments/$")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request, params }: any) => {
        const { handlePaymentHttp } = await import("@/lib/orderking/server/payment-http.server");
        return handlePaymentHttp(request, params as Record<string, string | undefined>);
      },
    },
  },
});
