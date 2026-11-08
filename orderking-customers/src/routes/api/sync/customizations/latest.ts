import { createFileRoute } from "@tanstack/react-router";
import { DEFAULT_CUSTOMIZATION_STATE } from "@orderking/ui";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/sync/customizations/latest")({
  server: {
    handlers: {
      GET: async () => {
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
              if (val.textOverrides) {
                state.textOverrides = {
                  ...state.textOverrides,
                  ...val.textOverrides,
                };
              }
              if (val.featureSwitches) {
                state.featureSwitches = {
                  ...state.featureSwitches,
                  ...val.featureSwitches,
                };
              }
              if (val.operatingMode) state.operatingMode = val.operatingMode;
            }
          }
        } catch {
          // Fallback to defaults gracefully if DB is cold
        }

        return new Response(
          JSON.stringify({
            version: state.version || 1,
            timestamp: new Date().toISOString(),
            actionType: "HYDRATE_LATEST",
            state,
            success: true,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=5, stale-while-revalidate=15",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      },

      POST: async ({ request }: any) => {
        try {
          const body = await request.json();
          if (!body || typeof body !== "object") {
            return new Response(JSON.stringify({ success: false, error: "Invalid payload" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const sql = await getSql();
          const jsonPayload = JSON.stringify(body);

          await sql`
            INSERT INTO public.umar_os_config (key, value, updated_at, updated_by)
            VALUES ('platform_customizations', ${jsonPayload}::jsonb, NOW(), 'founder_umar_os')
            ON CONFLICT (key)
            DO UPDATE SET value = EXCLUDED.value, updated_at = NOW(), updated_by = 'founder_umar_os'
          `;

          return new Response(
            JSON.stringify({ success: true, timestamp: new Date().toISOString() }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (err: any) {
          return new Response(
            JSON.stringify({ success: false, error: err?.message || "Failed to persist" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
