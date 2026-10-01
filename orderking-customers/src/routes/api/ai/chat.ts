import { createFileRoute } from "@tanstack/react-router";
import { executeFounderAiChat, type AiChatRequest, type StreamEvent } from "@/lib/server/ai-chat-service.server";
import { getSessionUser } from "@/lib/auth/verify.server";
import { enforceRateLimit } from "@/lib/security/rate-limiter";
import { emitImmutableEvent } from "@/lib/security/immutable-events.server";

const MAX_MESSAGES = 32;
const MAX_MESSAGE_CHARS = 8000;
const MAX_TOTAL_CHARS = 40_000;

function validateChatRequest(body: AiChatRequest) {
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    throw new Error("messages array is required");
  }
  if (body.messages.length > MAX_MESSAGES) {
    throw new Error("Too many messages in one request.");
  }

  let total = 0;
  for (const message of body.messages) {
    if (!message || !["user", "assistant", "system"].includes(message.role)) {
      throw new Error("Invalid message role.");
    }
    if (typeof message.content !== "string") {
      throw new Error("Message content must be text.");
    }
    if (message.content.length > MAX_MESSAGE_CHARS) {
      throw new Error("A message exceeds the maximum allowed size.");
    }
    total += message.content.length;
  }

  if (total > MAX_TOTAL_CHARS) {
    throw new Error("Chat request exceeds the maximum context payload.");
  }

  if (body.apiKeys && Object.keys(body.apiKeys).length > 0) {
    throw new Error("Provider API keys must never be sent from the customer browser.");
  }
}

export const Route = createFileRoute("/api/ai/chat")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const user = await getSessionUser();
          if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "content-type": "application/json", "cache-control": "no-store" },
            });
          }

          const rateLimitResponse = await enforceRateLimit(request, `customer-ai:${user.id}`, {
            windowMs: 60_000,
            maxRequests: 20,
          });
          if (rateLimitResponse) return rateLimitResponse;

          const body = (await request.json()) as AiChatRequest & { locale?: string };
          validateChatRequest(body);

          const acceptHeader = request.headers.get("accept") || "";
          const prefersStream = acceptHeader.includes("text/event-stream");

          if (prefersStream) {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
              async start(controller) {
                try {
                  await executeFounderAiChat({ ...body, apiKeys: undefined, userId: user.id, locale: body.locale }, (event: StreamEvent) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                  });
                  controller.close();
                } catch (err) {
                  const errorEvent: StreamEvent = {
                    type: "error",
                    data: { message: err instanceof Error ? err.message : "Internal chat error" },
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
                  controller.close();
                }
              },
            });

            return new Response(stream, {
              status: 200,
              headers: {
                "Content-Type": "text/event-stream; charset=utf-8",
                "Cache-Control": "no-store, no-cache, no-transform",
                "X-Content-Type-Options": "nosniff",
                Connection: "keep-alive",
              },
            });
          }

          const result = await executeFounderAiChat({ ...body, apiKeys: undefined, userId: user.id, locale: body.locale });
          await emitImmutableEvent({
            scope: user.id,
            eventType: "customer_ai_request",
            sourceTable: "ai_requests",
            sourceId: crypto.randomUUID(),
            actorUserId: user.id,
            payload: { locale: body.locale ?? null, mode: body.mode ?? "auto", messageCount: body.messages.length },
          });
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Internal chat error";
          const status = message === "Unauthorized" ? 401 : 400;
          return new Response(JSON.stringify({ error: message }), {
            status,
            headers: { "content-type": "application/json", "cache-control": "no-store" },
          });
        }
      },
    },
  },
});
