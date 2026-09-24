import { createFileRoute } from "@tanstack/react-router";
import { testModelConnectivity } from "@/lib/ai/real-model-registry";

export const Route = createFileRoute("/api/admin/test-connection")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as { modelId: string };
          const result = await testModelConnectivity(body.modelId);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          console.error("POST /api/admin/test-connection error:", error);
          return new Response(
            JSON.stringify({ error: "Internal error testing connection" }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});
