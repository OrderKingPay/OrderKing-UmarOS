// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { executeFounderAiChat, type AiChatRequest } from "@/lib/orderking/server/ai-chat-service.server";
import { createSseStream } from "@/lib/orderking/infrastructure/sse-hub";
import { enforceRateLimit } from "@/lib/orderking/security/rate-limiter";
import { requireUserId } from "@/lib/auth/verify.server";
import { ensureWorkspace } from "@/lib/orderking/server/workspace.server";

export const Route = createFileRoute("/api/ai/chat")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const userId = await requireUserId();
          const workspace = await ensureWorkspace(userId);
          if (!workspace.ctx.permissions.includes("access_AI")) {
            return new Response(JSON.stringify({ error: "AI access permission required" }), {
              status: 403,
              headers: { "content-type": "application/json", "cache-control": "no-store" },
            });
          }

          const rateLimitResponse = await enforceRateLimit(request, `ai-chat:${userId}`, {
            windowMs: 60_000,
            maxRequests: 20,
          });
          if (rateLimitResponse) return rateLimitResponse;

          const body = (await request.json()) as AiChatRequest;
          if (body.apiKeys && Object.keys(body.apiKeys).length > 0) {
            return new Response(JSON.stringify({ error: "Provider API keys must never be sent from the browser." }), {
              status: 400,
              headers: { "content-type": "application/json", "cache-control": "no-store" },
            });
          }
          if (body.messages.length > 32 || body.messages.some((m) => typeof m.content !== "string" || m.content.length > 8000)) {
            return new Response(JSON.stringify({ error: "Chat payload exceeds allowed limits." }), {
              status: 413,
              headers: { "content-type": "application/json", "cache-control": "no-store" },
            });
          }
          const acceptHeader = request.headers.get("accept") || "";
          const prefersStream = acceptHeader.includes("text/event-stream");

          if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
            return new Response(JSON.stringify({ error: "messages array is required" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          if (prefersStream) {
            const stream = createSseStream(
              async (emit, signal) => {
                await executeFounderAiChat(body, (event) => {
                  if (!signal.aborted) emit({ data: event });
                });
              },
              request,
            );

            return new Response(stream, {
              status: 200,
              headers: {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
              },
            });
          }

          const result = await executeFounderAiChat(body);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json; charset=utf-8" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Internal chat error" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
