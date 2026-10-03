// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/test-openai")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async () => new Response(JSON.stringify({
        status: "DISABLED",
        code: "USE_GOVERNED_MASTER_AI",
        message: "This standalone OpenAI test route is disabled. Use the authenticated Master AI/provider-status path; no hardcoded model, query token, deployment platform, or verified-success claim is exposed here.",
      }), {
        status: 410,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      }),
    },
  },
});
