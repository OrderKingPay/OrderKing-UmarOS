import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/security/gps-ping")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const { appendRiderSecurityEvent } = await import("@/lib/server/security-event-ledger");
          const user = await getSessionUser();
          if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

          const body = await request.json();
          const lat = Number(body?.lat);
          const lng = Number(body?.lng);
          const accuracy = Number(body?.accuracy);

          if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return Response.json({ error: "Invalid GPS coordinates" }, { status: 400 });
          }

          await appendRiderSecurityEvent({
            streamKey: "gps:rider:" + user.id,
            actorId: user.id,
            eventType: "GPS_PING",
            payload: {
              lat,
              lng,
              accuracy: Number.isFinite(accuracy) ? Math.max(0, accuracy) : null,
              capturedAt: typeof body?.capturedAt === "string" ? body.capturedAt : new Date().toISOString(),
            },
          });

          return Response.json({ accepted: true });
        } catch {
          return Response.json({ error: "GPS ledger unavailable" }, { status: 503 });
        }
      },
    },
  },
});
