import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v1/admin/$resource/$id")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async ({ request, params }: any) => {
        const { handleAdminHttp } = await import("@/lib/orderking/server/admin-http.server");
        return handleAdminHttp(request, { _splat: `${params.resource}/${params.id}` });
      },
      POST: async ({ request, params }: any) => {
        const { handleAdminHttp } = await import("@/lib/orderking/server/admin-http.server");
        return handleAdminHttp(request, { _splat: `${params.resource}/${params.id}` });
      },
    },
  },
});
