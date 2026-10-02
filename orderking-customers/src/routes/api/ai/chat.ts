
import { createFileRoute } from "@tanstack/react-router";
import { executeFounderAiChat, type AiChatRequest, type StreamEvent } from "@/lib/server/ai-chat-service.server";
import { requireUserId } from "@/lib/auth/verify.server";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";

export const Route = createFileRoute("/api/ai/chat")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          assertSameSiteRequest();
          const userId = await requireUserId();
          const body = (await request.json()) as AiChatRequest;
          const acceptHeader = request.headers.get("accept") || "";
          const prefersStream = acceptHeader.includes("text/event-stream");

          if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
            return new Response(JSON.stringify({ error: "messages array is required" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          const customerBody: AiChatRequest = {
            messages: body.messages.slice(-12).map((m) => ({
              role: m.role === "assistant" ? "assistant" : "user",
              content: String(m.content ?? "").slice(0, 6000),
              attachments: (m.attachments ?? []).slice(0, 3).map((a) => ({
                name: String(a.name ?? "attachment").slice(0, 120),
                type: String(a.type ?? "application/octet-stream").slice(0, 120),
                content: String(a.content ?? "").slice(0, 3000),
                size: typeof a.size === "number" ? Math.min(a.size, 10_000_000) : undefined,
              })),
            })),
            mode: "fast",
          };

          if (prefersStream) {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
              async start(controller) {
                try {
                  await executeFounderAiChat(
                    customerBody,
                    (event: StreamEvent) => {
                      const sseChunk = `data: ${JSON.stringify(event)}\n\n`;
                      controller.enqueue(encoder.encode(sseChunk));
                    },
                    { customerSafe: true, verifiedUserId: userId },
                  );
                  controller.close();
                } catch (err) {
                  const errorEvent: StreamEvent = {
                    type: "error",
                    data: { message: err instanceof Error ? err.message : String(err) },
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
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
              },
            });
          }

          // Non-streaming fallback
          const result = await executeFounderAiChat(customerBody, undefined, {
            customerSafe: true,
            verifiedUserId: userId,
          });
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json; charset=utf-8" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Internal chat error" }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});
