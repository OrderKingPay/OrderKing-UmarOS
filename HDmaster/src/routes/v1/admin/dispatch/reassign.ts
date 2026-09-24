import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v1/admin/dispatch/reassign")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleAdminHttp } = await import("@/lib/orderking/server/admin-http.server");
        return handleAdminHttp(request, { _splat: "dispatch/reassign" });
      },
    },
  },
});
