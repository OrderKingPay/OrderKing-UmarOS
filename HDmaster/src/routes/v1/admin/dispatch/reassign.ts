// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v1/admin/dispatch/reassign")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        const { handleAdminHttp } = await import("@/lib/orderking/server/admin-http.server");
        return handleAdminHttp(request, { _splat: "dispatch/reassign" });
      },
    },
  },
});
