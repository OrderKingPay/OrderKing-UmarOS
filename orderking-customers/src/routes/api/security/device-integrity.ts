import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/security/device-integrity")({
server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const { getSql } = await import("@/lib/db");
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

          const sql = await getSql();
          await sql`
            SELECT public.orderking_emit_immutable_event(
              ${"security:user:" + user.id},
              ${user.id},
              ${user.id},
              NULL,
              'security',
              ${deviceId || null},
              'DEVICE_INTEGRITY_SIGNAL',
              NOW(),
              ${JSON.stringify({
                risk,
                automationSignal,
                crossSite,
                userAgentHash: (await import("node:crypto")).createHash("sha256").update(ua).digest("hex"),
                ipAddress: request.headers.get("x-forwarded-for"),
              })}::jsonb
            )
          `;

          return Response.json({ allowed: risk !== "HIGH", risk, vpnAllowed: true });
        } catch {
          return Response.json({ allowed: true, risk: "UNKNOWN", degraded: true });
        }
      },
    },
  },
});

