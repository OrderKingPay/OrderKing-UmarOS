import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v1/travel/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { handleTravelHttp } = await import("@/lib/orderking/server/travel-http.server");
        return handleTravelHttp(request, params as Record<string, string | undefined>);
      },
      POST: async ({ request, params }) => {
        const { handleTravelHttp } = await import("@/lib/orderking/server/travel-http.server");
        return handleTravelHttp(request, params as Record<string, string | undefined>);
      },
    },
  },
});
