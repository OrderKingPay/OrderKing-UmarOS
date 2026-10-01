// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/security/device-integrity")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const { appendPartnerSecurityEvent } = await import("@/lib/server/security-event-ledger");
          const user = await getSessionUser();
          if (!user) return Response.json({ allowed: false, risk: "UNAUTHENTICATED" }, { status: 401 });

          const body = await request.json();
          const deviceId = typeof body?.deviceId === "string" ? body.deviceId.trim() : "";
          const ua = request.headers.get("user-agent") || "";
          const suspicious = /HeadlessChrome|PhantomJS|Selenium|Playwright/i.test(ua);

          await appendPartnerSecurityEvent({
            streamKey: "security:partner:" + user.id,
            actorId: user.id,
            eventType: "DEVICE_INTEGRITY_SIGNAL",
            deviceId: deviceId || null,
            ipAddress: request.headers.get("x-forwarded-for"),
            payload: { risk: suspicious ? "HIGH" : "LOW", suspicious, userAgentLength: ua.length },
          });

          return Response.json({ allowed: !suspicious, risk: suspicious ? "HIGH" : "LOW", vpnAllowed: true });
        } catch {
          return Response.json({ allowed: true, risk: "UNKNOWN", degraded: true });
        }
      },
    },
  },
});

