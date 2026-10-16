import { createFileRoute } from "@tanstack/react-router";
import { DEFAULT_CUSTOMIZATION_STATE } from "@orderking/ui";
import { loadConfig } from "@/lib/server/load-config";

async function buildLatestPayload() {
  let cfg: any = null;
  try {
    cfg = await loadConfig();
  } catch {
    // fallback
  }

  const isDark = cfg?.brand?.themeMode === "dark";
  const state = {
    ...DEFAULT_CUSTOMIZATION_STATE,
    version: 1,
    updatedAt: new Date().toISOString(),
    designTokens: {
      ...DEFAULT_CUSTOMIZATION_STATE.designTokens,
      palette: {
        ...DEFAULT_CUSTOMIZATION_STATE.designTokens.palette,
        primary: cfg?.brand?.primaryColor || DEFAULT_CUSTOMIZATION_STATE.designTokens.palette.primary,
        accent: cfg?.brand?.accentColor || cfg?.brand?.primaryColor || DEFAULT_CUSTOMIZATION_STATE.designTokens.palette.accent,
        background: isDark ? "#0f172a" : (cfg?.brand?.backgroundColor || "#FCFAF7"),
        surface: isDark ? "#1e293b" : (cfg?.brand?.surfaceColor || "#FCFAF7"),
        surfaceElevated: isDark ? "#334155" : "#FFFFFF",
        foreground: isDark ? "#f8fafc" : (cfg?.brand?.textColor || "#1C1C1C"),
        muted: isDark ? "#94a3b8" : (cfg?.brand?.mutedColor || "#6B7280"),
      },
    },
    payoutPolicy: {
      monsoonSurgePaise: cfg?.marketplace?.rainSurgePaise ?? 2500,
      rainSurgeBonusPaise: cfg?.marketplace?.rainSurgePaise ?? 2500,
    },
  };

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    actionType: "HYDRATE_LATEST",
    state,
    success: true,
  };
}

export const Route = createFileRoute("/api/sync/customizations")({
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        try {
          const url = new URL(request.url);
          const acceptHeader = request.headers.get("Accept") || "";

          // HDmaster Proxy if configured
          const hdmasterUrl = process.env.HDMASTER_URL?.replace(/\/$/, "");
          if (hdmasterUrl) {
            try {
              const res = await fetch(`${hdmasterUrl}/api/sync/customizations${url.search}`, {
                headers: {
                  Accept: acceptHeader,
                  Authorization: request.headers.get("Authorization") || "",
                },
              });
              if (res.ok) {
                return new Response(res.body, {
                  status: res.status,
                  headers: res.headers,
                });
              }
            } catch {
              // fall through to internal fallback
            }
          }

          // Hydration endpoint check
          if (
            url.searchParams.get("latest") === "true" ||
            url.pathname.endsWith("/latest") ||
            (acceptHeader.includes("application/json") && !acceptHeader.includes("text/event-stream"))
          ) {
            const payload = await buildLatestPayload();
            return new Response(JSON.stringify(payload), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=5, stale-while-revalidate=15",
                "Access-Control-Allow-Origin": "*",
              },
            });
          }

          // SSE Stream Handler
          const payload = await buildLatestPayload();
          const encoder = new TextEncoder();

          let timer: ReturnType<typeof setInterval> | null = null;
          const stream = new ReadableStream({
            start(controller) {
              // Send initial state
              const initialFrame = `event: customization_sync\ndata: ${JSON.stringify(payload)}\n\n`;
              controller.enqueue(encoder.encode(initialFrame));

              // 15-second heartbeat
              timer = setInterval(() => {
                try {
                  const pingFrame = `: heartbeat ${Date.now()}\n\n`;
                  controller.enqueue(encoder.encode(pingFrame));
                } catch {
                  if (timer) clearInterval(timer);
                }
              }, 15000);
            },
            cancel() {
              if (timer) clearInterval(timer);
            },
          });

          return new Response(stream, {
            status: 200,
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: err?.message || "Sync route internal error" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        });
      },
    },
  },
});
