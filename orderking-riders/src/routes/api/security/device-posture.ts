// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/security/device-posture")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const { getSql } = await import("@/lib/db");
          const user = await getSessionUser();
          if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

          const body = await request.json();
          const safeBool = (v: unknown) => v === true;
          const hardwareClass = Number.isFinite(Number(body?.hardwareClass))
            ? Math.max(1, Math.min(16, Math.round(Number(body.hardwareClass))))
            : null;

          const signals = {
            secureContext: safeBool(body?.secureContext),
            webdriver: safeBool(body?.webdriver),
            cookieEnabled: safeBool(body?.cookieEnabled),
            storageAvailable: safeBool(body?.storageAvailable),
            cryptoAvailable: safeBool(body?.cryptoAvailable),
            online: safeBool(body?.online),
          };

          let riskScore = 0;
          if (!signals.secureContext) riskScore += 35;
          if (signals.webdriver) riskScore += 45;
          if (!signals.cookieEnabled) riskScore += 5;
          if (!signals.storageAvailable) riskScore += 5;
          if (!signals.cryptoAvailable) riskScore += 10;

          const decision = riskScore >= 70 ? "BLOCK" : riskScore >= 40 ? "STEP_UP" : "ALLOW";

          const sql = await getSql();
          await sql`
            INSERT INTO device_posture_events (
              id,user_id,app_id,secure_context,webdriver,cookie_enabled,
              storage_available,crypto_available,online,platform_family,
              language,timezone,hardware_class,risk_score,decision,evidence
            ) VALUES (
              ${crypto.randomUUID()},${user.id},RIDER,
              ${signals.secureContext},${signals.webdriver},${signals.cookieEnabled},
              ${signals.storageAvailable},${signals.cryptoAvailable},${signals.online},
              ${typeof body?.platformFamily === "string" ? body.platformFamily.slice(0,40) : null},
              ${typeof body?.language === "string" ? body.language.slice(0,20) : null},
              ${typeof body?.timezone === "string" ? body.timezone.slice(0,64) : null},
              ${hardwareClass},${riskScore},${decision},
              ${JSON.stringify({ vpnAllowed: true, source: "browser_posture", userAgentServerHash: null })}
            )
          `;

          return Response.json({ success: true, decision, riskScore });
        } catch (error) {
          console.error("[device-posture] failed:", error);
          return Response.json({ success: false, status: "UNAVAILABLE" }, { status: 503 });
        }
      },
    },
  },
});

