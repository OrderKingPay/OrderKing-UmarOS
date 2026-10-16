import { createFileRoute } from "@tanstack/react-router";
import {
  handleLatestRequest,
  handleSseRequest,
} from "@/lib/orderking/customization/sync-bus";

// @ts-ignore: Router tree is generated during build
export const Route = createFileRoute("/api/sync/customizations")({
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        try {
          const url = new URL(request.url);
          // If caller specifies ?latest=true or accepts application/json without event-stream, serve hydration JSON
          const acceptHeader = request.headers.get("Accept") || "";
          if (
            url.searchParams.get("latest") === "true" ||
            url.pathname.endsWith("/latest") ||
            (acceptHeader.includes("application/json") && !acceptHeader.includes("text/event-stream"))
          ) {
            return handleLatestRequest(request);
          }

          // Otherwise establish persistent Server-Sent Events (SSE) stream
          return handleSseRequest(request);
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: err?.message || "Sync route internal error",
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
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        });
      },
    },
  },
});
