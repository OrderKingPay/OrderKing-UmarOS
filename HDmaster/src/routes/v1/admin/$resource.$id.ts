import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v1/admin/$resource/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { handleAdminHttp } = await import("@/lib/orderking/server/admin-http.server");
        return handleAdminHttp(request, { _splat: `${params.resource}/${params.id}` });
      },
      POST: async ({ request, params }) => {
        const { handleAdminHttp } = await import("@/lib/orderking/server/admin-http.server");
        return handleAdminHttp(request, { _splat: `${params.resource}/${params.id}` });
      },
    },
  },
});
