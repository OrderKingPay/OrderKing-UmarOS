import { createFileRoute } from "@tanstack/react-router";
import { handleTravelHttp } from "@/lib/orderking/server/travel-http.server";

export const Route = createFileRoute("/api/v1/travel/search")({
  server: {
    handlers: {
      OPTIONS: async ({ request, params }) =>
        handleTravelHttp(request, params as Record<string, string | undefined>),
      GET: async ({ request, params }) =>
        handleTravelHttp(request, params as Record<string, string | undefined>),
    },
  },
});
