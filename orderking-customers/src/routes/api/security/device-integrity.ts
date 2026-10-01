import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "node:crypto";

export const Route = createFileRoute("/api/security/device-integrity")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const { appendCustomerSecurityEvent } = await import("@/lib/security/customer-event-ledger.server");
          const user = await getSessionUser();
          if (!user) return Response.json({ allowed: false, risk: "UNAUTHENTICATED" }, { status: 401 });

          const body = await request.json();
          const deviceId = typeof body?.deviceId === "string" ? body.deviceId.trim() : "";
          const ua = request.headers.get("user-agent") || "";
          const origin = request.headers.get("origin") || "";
          const secFetchSite = request.headers.get("sec-fetch-site") || "";
          const automationSignal = /HeadlessChrome|PhantomJS|Selenium|Playwright/i.test(ua);
          const crossSite = secFetchSite === "cross-site" && Boolean(origin) && !/orderking/i.test(origin);
          const risk = automationSignal || crossSite ? "HIGH" : !deviceId ? "MEDIUM" : "LOW";

          await appendCustomerSecurityEvent({
            streamKey: "security:user:" + user.id,
            actorId: user.id,
            actorType: "CUSTOMER",
            eventType: "DEVICE_INTEGRITY_SIGNAL",
            deviceId: deviceId || null,
            ipAddress: request.headers.get("x-forwarded-for"),
            payload: {
              risk,
              automationSignal,
              crossSite,
              userAgentHash: createHash("sha256").update(ua).digest("hex"),
            },
          });

          return Response.json({ allowed: risk !== "HIGH", risk, vpnAllowed: true });
        } catch {
          return Response.json({ allowed: true, risk: "UNKNOWN", degraded: true });
        }
      },
    },
  },
});
