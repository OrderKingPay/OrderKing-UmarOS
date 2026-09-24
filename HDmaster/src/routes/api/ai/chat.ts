import { createFileRoute } from "@tanstack/react-router";
import { executeFounderAiChat, type AiChatRequest, type StreamEvent } from "@/lib/orderking/server/ai-chat-service.server";

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as AiChatRequest;
          const acceptHeader = request.headers.get("accept") || "";
          const prefersStream = acceptHeader.includes("text/event-stream") || true;

          if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
            return new Response(JSON.stringify({ error: "messages array is required" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          if (prefersStream) {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
              async start(controller) {
                try {
                  await executeFounderAiChat(body, (event: StreamEvent) => {
                    const sseChunk = `data: ${JSON.stringify(event)}\n\n`;
                    controller.enqueue(encoder.encode(sseChunk));
                  });
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
          const result = await executeFounderAiChat(body);
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
