import { createFileRoute } from "@tanstack/react-router";
import { handleLatestRequest, handleLatestPostRequest } from "@/lib/orderking/customization/sync-bus";

// @ts-ignore: Router tree is generated during build
export const Route = createFileRoute("/api/sync/customizations/latest")({
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        try {
          return handleLatestRequest(request);
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: err?.message || "Hydration route internal error",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
      POST: async ({ request }: any) => {
        try {
          return await handleLatestPostRequest(request);
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: err?.message || "Failed to persist customization config",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        });
      },
    },
  },
});
