import { createAPIFileRoute } from "@tanstack/react-start/api";
import { handleTravelHttp } from "@/lib/orderking/server/travel-http.server";

export const APIRoute = createAPIFileRoute("/api/v1/travel/search")({
  GET: async ({ request, params }) => {
    return handleTravelHttp(request, params as Record<string, string | undefined>);
  },
});
