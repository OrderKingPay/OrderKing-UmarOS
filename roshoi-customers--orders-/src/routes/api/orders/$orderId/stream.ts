import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/orders/$orderId/stream")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { orderId } = params;
        const sql = await getSql();

        const encoder = new TextEncoder();
        let interval: NodeJS.Timeout | null = null;
        let progressStep = 0;

        const stream = new ReadableStream({
          async start(controller) {
            // Helper to push SSE data formatted event
            const pushEvent = (data: Record<string, unknown>) => {
              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
              } catch {
                // Controller may already be closed if client disconnected
              }
            };

            // Initial query
            try {
              const rows = await sql<{
                id: string;
                status: string;
                placed_at: string;
                outlet_id: string;
              }>`select id, status, placed_at::text as placed_at, outlet_id from orders where id = ${orderId}`;
              const order = rows[0];

              if (!order) {
                pushEvent({
                  orderId,
                  status: "NOT_FOUND",
                  timestamp: new Date().toISOString(),
                });
                controller.close();
                return;
              }

              // Send initial status
              pushEvent({
                orderId: order.id,
                status: order.status,
                eta: ["DELIVERED", "CANCELLED"].includes(order.status) ? 0 : 25,
                timestamp: new Date().toISOString(),
              });

              // If order is already completed, close immediately
              if (["DELIVERED", "CANCELLED"].includes(order.status)) {
                controller.close();
                return;
              }

              // Periodic polling & GPS telemetry push (every 3 seconds)
              interval = setInterval(async () => {
                try {
                  const checkRows = await sql<{
                    id: string;
                    status: string;
                  }>`select id, status from orders where id = ${orderId}`;
                  const current = checkRows[0];

                  if (!current) {
                    if (interval) clearInterval(interval);
                    controller.close();
                    return;
                  }

                  progressStep += 1;
                  const isDelivering = ["RIDER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(current.status);
                  const eta = isDelivering ? Math.max(2, 20 - progressStep) : 25;

                  // Heartbeat event with ETA and status
                  pushEvent({
                    orderId: current.id,
                    status: current.status,
                    eta,
                    step: progressStep,
                    timestamp: new Date().toISOString(),
                  });

                  if (["DELIVERED", "CANCELLED"].includes(current.status)) {
                    if (interval) clearInterval(interval);
                    controller.close();
                  }
                } catch {
                  if (interval) clearInterval(interval);
                  try {
                    controller.close();
                  } catch {
                    // Ignore
                  }
                }
              }, 3000);
            } catch (err) {
              pushEvent({ error: err instanceof Error ? err.message : "Internal error" });
              controller.close();
            }
          },
          cancel() {
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
          },
        });

        // Abort cleanup
        request.signal.addEventListener("abort", () => {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
