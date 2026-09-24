import { createFileRoute } from "@tanstack/react-router";
import { testModelConnectivity, getVerifiedModelRegistry } from "@/lib/orderking/ai/real-model-registry";

export const Route = createFileRoute("/api/ai/test-connection")({
  server: {
    handlers: {
      GET: async () => {
        const registry = getVerifiedModelRegistry();
        return new Response(JSON.stringify(registry), {
          status: 200,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { modelId?: string };
          const modelId = body?.modelId || "sovereign-ultra";
          const result = await testModelConnectivity(modelId);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json; charset=utf-8" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              status: "ERROR",
              message: error instanceof Error ? error.message : "Failed to test connectivity",
            }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});
