import { createFileRoute } from "@tanstack/react-router";
import { DEFAULT_CUSTOMIZATION_STATE } from "@orderking/ui";
import { getSql } from "@/lib/db";

async function buildLatestPayload() {
  let state: any = {
    ...DEFAULT_CUSTOMIZATION_STATE,
    version: 1,
    updatedAt: new Date().toISOString(),
  };

  try {
    const sql = await getSql();
    const rows = await sql<{ key: string; value: any }>`
      SELECT key, value FROM public.umar_os_config 
      WHERE key IN ('platform_customizations', 'founder_fees', 'design_tokens')
    `;

    for (const r of rows || []) {
      const val = typeof r.value === "string" ? JSON.parse(r.value) : r.value;
      if (r.key === "founder_fees" && val) {
        if (val.food_platform_fee) {
          state.merchantEconomics = {
            ...state.merchantEconomics,
            commissionTierStandardPercent: Number(val.food_platform_fee) || 22,
          };
        }
        if (val.dynamic_delivery_base_paise) {
          state.customerPricing = {
            ...state.customerPricing,
            baseDeliveryFeeRupees: Math.round(Number(val.dynamic_delivery_base_paise) / 100),
          };
          state.payoutPolicy = {
            ...state.payoutPolicy,
            baseFarePaise: Number(val.dynamic_delivery_base_paise),
          };
        }
      }
      if (r.key === "platform_customizations" && val) {
        if (val.version) state.version = val.version;
        if (val.designTokens) {
          state.designTokens = {
            ...state.designTokens,
            ...val.designTokens,
            palette: {
              ...state.designTokens.palette,
              ...(val.designTokens.palette || {}),
            },
          };
        }
        if (val.textOverrides) state.textOverrides = { ...state.textOverrides, ...val.textOverrides };
        if (val.featureSwitches) state.featureSwitches = { ...state.featureSwitches, ...val.featureSwitches };
        if (val.operatingMode) state.operatingMode = val.operatingMode;
      }
    }
  } catch {
    // fallback gracefully
  }

  return {
    version: state.version || 1,
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
                },
              });
              if (res.ok) {
                const contentType = res.headers.get("Content-Type") || "application/json";
                if (contentType.includes("text/event-stream")) {
                  return new Response(res.body, {
                    status: 200,
                    headers: {
                      "Content-Type": "text/event-stream",
                      "Cache-Control": "no-cache",
                      Connection: "keep-alive",
                      "Access-Control-Allow-Origin": "*",
                    },
                  });
                }
                const data = await res.json();
                return new Response(JSON.stringify(data), {
                  status: 200,
                  headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "no-cache",
                    "Access-Control-Allow-Origin": "*",
                  },
                });
              }
            } catch {
              // fallback
            }
          }

          const payload = await buildLatestPayload();
          return new Response(JSON.stringify(payload), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=5, stale-while-revalidate=15",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message || "Failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
