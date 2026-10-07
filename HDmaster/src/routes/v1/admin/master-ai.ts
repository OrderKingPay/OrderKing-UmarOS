import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v1/admin/master-ai")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        const { handleMasterAiHttp } = await import("@/lib/orderking/server/master-ai-http.server");
        return handleMasterAiHttp(request);
      },
    },
  },
});
