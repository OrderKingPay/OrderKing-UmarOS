import { createFileRoute } from "@tanstack/react-router";
import { DEFAULT_RIDER_CUSTOMIZATION_STATE } from "@orderking/ui";
import { DEFAULT_BRANDING } from "@/lib/rider/config";

export const Route = createFileRoute("/api/sync/customizations/latest")({
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        // If HDmaster proxy is available
        const hdmasterUrl = process.env.HDMASTER_URL?.replace(/\/$/, "");
        if (hdmasterUrl) {
          try {
            const res = await fetch(`${hdmasterUrl}/api/sync/customizations/latest?platform=rider_app`, {
              headers: {
                Accept: request.headers.get("Accept") || "application/json",
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
            // Fall through to default rider snapshot
          }
        }

        const payload = {
          version: 1,
          timestamp: new Date().toISOString(),
          actionType: "HYDRATE_LATEST",
          platform: "rider_app",
          state: {
            ...DEFAULT_RIDER_CUSTOMIZATION_STATE,
            designTokens: {
              ...DEFAULT_RIDER_CUSTOMIZATION_STATE.designTokens,
              palette: {
                ...DEFAULT_RIDER_CUSTOMIZATION_STATE.designTokens.palette,
                primary: DEFAULT_BRANDING.colors.primary,
                accent: DEFAULT_BRANDING.colors.accent,
              },
            },
          },
          config: {
            version: 1,
            updatedAt: new Date().toISOString(),
            brand: {
              appName: DEFAULT_BRANDING.appName,
              primaryColor: DEFAULT_BRANDING.colors.primary,
              accentColor: DEFAULT_BRANDING.colors.accent,
              logoUrl: "/logo.jpg",
              supportPhone: "+918000000000",
              supportWhatsApp: "+918000000000",
            },
            economics: {
              platformFeePaise: 600,
              smallCartThresholdPaise: 14900,
              smallCartFeePaise: 3000,
              packagingFeeCapPaise: 3500,
              packagingFeeMaxPercent: 10,
              cgstSection9_5Percent: 5,
              platformGstPercent: 18,
              tcsPercent: 1,
              tdsPercent: 0.1,
              defaultCommissionPercent: 22,
              surgeMultiplier: 1.0,
              monsoonAlertActive: false,
              monsoonBannerText: "",
            },
            features: {
              vipGoldPassEnabled: true,
              diningOutEnabled: true,
              groupOrderingEnabled: true,
              codEnabled: true,
              kingPayOneClickEnabled: true,
            },
          },
          success: true,
        };

        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=5, stale-while-revalidate=15",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        });
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
