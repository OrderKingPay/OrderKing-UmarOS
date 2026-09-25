import { createAPIFileRoute } from "@tanstack/start/api";
import { handleTravelHttp } from "@/lib/orderking/server/travel-http.server";

export const APIRoute = createAPIFileRoute("/api/v1/travel/search")({
  GET: async ({ request, params }: any) => {
    return handleTravelHttp(request, params as Record<string, string | undefined>);
  },
});
