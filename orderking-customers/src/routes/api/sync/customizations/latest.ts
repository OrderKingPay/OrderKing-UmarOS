import { createFileRoute } from "@tanstack/react-router";
import { DEFAULT_CUSTOMIZATION_STATE } from "@orderking/ui";
import { loadConfig } from "@/lib/server/load-config";

export const Route = createFileRoute("/api/sync/customizations/latest")({
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        let cfg: any = null;
        try {
          cfg = await loadConfig();
        } catch {}

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

        const payload = {
          version: 1,
          timestamp: new Date().toISOString(),
          actionType: "HYDRATE_LATEST",
          state,
          success: true,
        };

        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=5, stale-while-revalidate=15",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
