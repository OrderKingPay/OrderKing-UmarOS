import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";

async function verifyFounderOrAdminAccess(request?: Request): Promise<boolean> {
  const auth = request?.headers?.get("Authorization");
  const configuredSecret = process.env.FOUNDER_SECRET?.trim();
  if (configuredSecret && configuredSecret.length >= 16 && auth === `Bearer ${configuredSecret}`) {
    return true;
  }
  const session = await getSessionUser();
  if (!session?.id) return false;
  const sql = await getSql();
  const rows = await sql`SELECT role FROM users WHERE id = ${session.id} LIMIT 1`;
  const role = rows.length > 0 ? String((rows[0] as any).role || "").toUpperCase() : "";
  return ["SUPER_ADMIN", "FOUNDER", "ADMIN"].includes(role);
}


export const ALL_23_INDIAN_LOCALES = [
  "en",
  "hi",
  "bn",
  "te",
  "mr",
  "ta",
  "ur",
  "gu",
  "kn",
  "ml",
  "or",
  "pa",
  "as",
  "mai",
  "sat",
  "ks",
  "ne",
  "sd",
  "kok",
  "doi",
  "mni",
  "brx",
  "sa",
] as const;

export const DEFAULT_BRAND_CONFIG = {
  primaryColor: "#0D3B2E",
  accentColor: "#D97706",
  surfaceColor: "#071712",
  fontFamily: "Inter / Plus Jakarta Sans",
  logoText: "OrderKing",
  tagline: "Order like a King.",
  compactMode: false,
  radiusPx: 16,
  themeMode: "light" as "light" | "dark",
};

export const DEFAULT_LOCALIZATION_CONFIG = {
  defaultLocale: "en",
  enabledLocales: [...ALL_23_INDIAN_LOCALES],
  autoDetectLocation: true,
};

export const DEFAULT_NOTIFICATION_RULES = {
  zeroHarassmentGuard: true,
  weatherGraceEnabled: true,
  trafficSpikeImmunity: true,
  gatewayOutageShield: true,
  tiers: {
    EMERGENCY: {
      tier: "EMERGENCY",
      label: "Tier 1 · Emergency SOS & Road Safety",
      slaMinutes: 2,
      channels: ["SOS Siren", "Direct Phone Call", "SMS", "Founder Command Deck"],
      autoRemediate: true,
      remediationAction: "Auto-pause active trip SLA, dispatch 112/108 link & reassign order with zero rider penalty",
    },
    DANGER: {
      tier: "DANGER",
      label: "Tier 2 · Food Safety / FSSAI / Tamper Breach",
      slaMinutes: 5,
      channels: ["Push Alert", "WhatsApp", "Compliance Desk"],
      autoRemediate: true,
      remediationAction: "Auto-hold SKU, trigger instant customer refund & request kitchen hygiene photo audit",
    },
    CRITICAL: {
      tier: "CRITICAL",
      label: "Tier 3 · Payment Escrow / Gateway Outage",
      slaMinutes: 10,
      channels: ["Push Alert", "Fintech Webhook", "Founder Deck"],
      autoRemediate: true,
      remediationAction: "Auto-failover to secondary UPI/NPCI rail & shield partners from order drop penalties",
    },
    HIGH: {
      tier: "HIGH",
      label: "Tier 4 · Severe Kitchen Delay (>20m) / Unreachable Drop",
      slaMinutes: 15,
      channels: ["In-App Co-Pilot", "Push Notification"],
      autoRemediate: true,
      remediationAction: "Auto-credit ₹1/min rider wait bonus (>10m) & adjust customer live ETA transparently",
    },
    MEDIUM: {
      tier: "MEDIUM",
      label: "Tier 5 · COD Float Threshold / Menu Stock Sync",
      slaMinutes: 30,
      channels: ["In-App Banner", "Silent Digest"],
      autoRemediate: true,
      remediationAction: "Send polite UPI reconciliation prompt before ₹2,500 limit without harsh account lockouts",
    },
    LOW: {
      tier: "LOW",
      label: "Tier 6 · Routine Telemetry & Daily Digest",
      slaMinutes: 120,
      channels: ["Daily Summary Ledger"],
      autoRemediate: true,
      remediationAction: "Batch into non-intrusive end-of-shift summary report",
    },
  },
};

export const DEFAULT_MARKETPLACE_ECON = {
  defaultCommissionBps: 1800, // 18%
  serviceFeePaise: 400, // ₹4
  deliveryBasePaise: 3500, // ₹35
  deliveryPerKmPaise: 800, // ₹8/km
  freeDeliveryThresholdInr: 199,
  smallOrderFeeInr: 15,
};

export const Route = createFileRoute("/api/v1/admin/settings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const allowed = await verifyFounderOrAdminAccess(request);
          if (!allowed) {
            return new Response(JSON.stringify({ error: "Forbidden: Verified Founder or Admin session required" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const sql = await getSql();
          const rows = await sql`SELECT settings_json FROM platform_settings LIMIT 1`;
          let bag: Record<string, any> = {};
          if (rows.length > 0 && rows[0].settings_json) {
            try {
              bag = JSON.parse(rows[0].settings_json as string);
            } catch {
              bag = {};
            }
          }

          const {
            DEFAULT_ECOSYSTEM_CMS,
            DEFAULT_PLUGIN_CONNECTORS,
            DEFAULT_ALGORITHM_SETTINGS,
          } = await import("@/lib/orderking/cms-connectors");

          // KingPay Global Fintech Matrix
          const mdrPercentage =
            bag.kingpay?.mdr_percentage !== undefined
              ? Number(bag.kingpay.mdr_percentage)
              : bag.paymentFeeBps !== undefined
                ? bag.paymentFeeBps / 100
                : 1.8;

          const customerConvenienceFeeInr =
            bag.kingpay?.customer_convenience_fee_inr !== undefined
              ? Number(bag.kingpay.customer_convenience_fee_inr)
              : bag.kingpay?.convenience_fee_inr !== undefined
                ? Number(bag.kingpay.convenience_fee_inr)
                : bag.serviceFeePaise !== undefined
                  ? bag.serviceFeePaise / 100
                  : bag.marketplace?.serviceFeePaise !== undefined
                    ? bag.marketplace.serviceFeePaise / 100
                    : 4;

          const autoRefundAiThresholdInr =
            bag.kingpay?.auto_refund_ai_threshold_inr !== undefined
              ? Number(bag.kingpay.auto_refund_ai_threshold_inr)
              : bag.refundLimitPaise !== undefined
                ? bag.refundLimitPaise / 100
                : bag.maxRefundLimitInr !== undefined
                  ? Number(bag.maxRefundLimitInr)
                  : 250;

          const enabledLocales = Array.isArray(bag.localization?.enabledLocales)
            ? bag.localization.enabledLocales
            : [...ALL_23_INDIAN_LOCALES];

          const defaultLocale =
            bag.localization?.defaultLocale ?? bag.default_language ?? "en";

          const config = {
            daily_hub_enabled: bag.features?.dailyHub ?? false,
            viral_referrals_enabled: bag.features?.viralReferrals ?? true,
            dynamic_surge_enabled: bag.features?.dynamicSurge ?? true,

            restaurant_commission_pct:
              (bag.marketplace?.defaultCommissionBps ?? DEFAULT_MARKETPLACE_ECON.defaultCommissionBps) / 100,
            platform_fee_inr:
              (bag.marketplace?.serviceFeePaise ?? DEFAULT_MARKETPLACE_ECON.serviceFeePaise) / 100,
            base_delivery_fee_inr:
              (bag.marketplace?.deliveryBasePaise ??
                Math.round(DEFAULT_ALGORITHM_SETTINGS.baseDeliveryFeeInr * 100)) / 100,
            rider_payout_per_km_inr:
              (bag.marketplace?.deliveryPerKmPaise ?? DEFAULT_MARKETPLACE_ECON.deliveryPerKmPaise) / 100,
            free_delivery_threshold_inr:
              bag.marketplace?.freeDeliveryThresholdInr ?? DEFAULT_MARKETPLACE_ECON.freeDeliveryThresholdInr,
            small_order_fee_inr:
              bag.marketplace?.smallOrderFeeInr ?? DEFAULT_MARKETPLACE_ECON.smallOrderFeeInr,

            max_delivery_radius_km:
              bag.algorithm?.maxDeliveryRadiusKm ??
              bag.plugin_connectors?.mapbox?.maxServiceRadiusKm ??
              DEFAULT_ALGORITHM_SETTINGS.maxDeliveryRadiusKm,
            surge_multiplier_cap:
              bag.algorithm?.surgeMultiplierCap ?? DEFAULT_ALGORITHM_SETTINGS.surgeMultiplierCap,
            kitchen_prep_buffer_mins:
              bag.algorithm?.kitchenPrepBufferMinutes ??
              bag.plugin_connectors?.mapbox?.etaSafetyBufferMinutes ??
              DEFAULT_ALGORITHM_SETTINGS.kitchenPrepBufferMinutes,

            algorithm: {
              ...DEFAULT_ALGORITHM_SETTINGS,
              ...(bag.algorithm || {}),
              maxDeliveryRadiusKm:
                bag.algorithm?.maxDeliveryRadiusKm ??
                bag.plugin_connectors?.mapbox?.maxServiceRadiusKm ??
                DEFAULT_ALGORITHM_SETTINGS.maxDeliveryRadiusKm,
              baseDeliveryFeeInr:
                (bag.marketplace?.deliveryBasePaise ??
                  Math.round(DEFAULT_ALGORITHM_SETTINGS.baseDeliveryFeeInr * 100)) / 100,
              surgeMultiplierCap:
                bag.algorithm?.surgeMultiplierCap ?? DEFAULT_ALGORITHM_SETTINGS.surgeMultiplierCap,
              kitchenPrepBufferMinutes:
                bag.algorithm?.kitchenPrepBufferMinutes ??
                bag.plugin_connectors?.mapbox?.etaSafetyBufferMinutes ??
                DEFAULT_ALGORITHM_SETTINGS.kitchenPrepBufferMinutes,
            },

            ai_support_provider: bag.ai?.supportProvider ?? "Google Gemini (1.5 Pro)",
            ai_menu_suggester: bag.ai?.menuSuggester ?? "OpenAI (GPT-4o)",
            ai_tutor_provider: bag.ai?.tutorProvider ?? "Google Gemini (1.5 Flash)",

            // KingPay Global Settings Matrix
            kingpay: {
              mdr_percentage: mdrPercentage,
              customer_convenience_fee_inr: customerConvenienceFeeInr,
              auto_refund_ai_threshold_inr: autoRefundAiThresholdInr,
              settlement_schedule: bag.kingpay?.settlement_schedule ?? "T+1 Automated Escrow",
              payout_rail: bag.kingpay?.payout_rail ?? "NPCI IMPS / NEFT Batch",
              status: bag.kingpay?.status ?? "ACTIVE",
              last_updated: bag.kingpay?.last_updated ?? null,
              ...(bag.kingpay || {}),
            },
            mdr_percentage: mdrPercentage,
            customer_convenience_fee_inr: customerConvenienceFeeInr,
            auto_refund_ai_threshold_inr: autoRefundAiThresholdInr,

            cms: {
              ...DEFAULT_ECOSYSTEM_CMS,
              ...(bag.cms || {}),
            },
            plugin_connectors: {
              ...DEFAULT_PLUGIN_CONNECTORS,
              ...(bag.plugin_connectors || {}),
            },
            brand: {
              ...DEFAULT_BRAND_CONFIG,
              ...(bag.brand || {}),
              primaryColor: bag.brand?.primaryColor || DEFAULT_BRAND_CONFIG.primaryColor,
              accentColor: bag.brand?.accentColor || DEFAULT_BRAND_CONFIG.accentColor,
              surfaceColor: bag.brand?.surfaceColor || DEFAULT_BRAND_CONFIG.surfaceColor,
              fontFamily: bag.brand?.fontFamily || DEFAULT_BRAND_CONFIG.fontFamily,
              logoText: bag.brand?.logoText || DEFAULT_BRAND_CONFIG.logoText,
              tagline: bag.brand?.tagline || DEFAULT_BRAND_CONFIG.tagline,
              compactMode: Boolean(bag.brand?.compactMode ?? DEFAULT_BRAND_CONFIG.compactMode),
              radiusPx:
                bag.brand?.radiusPx !== undefined
                  ? Number(bag.brand.radiusPx)
                  : DEFAULT_BRAND_CONFIG.radiusPx,
              themeMode: bag.brand?.themeMode === "dark" ? "dark" : "light",
            },
            localization: {
              defaultLocale,
              enabledLocales,
              autoDetectLocation:
                bag.localization?.autoDetectLocation ?? DEFAULT_LOCALIZATION_CONFIG.autoDetectLocation,
            },
            default_language: defaultLocale,
            supported_locales: enabledLocales.join(","),
            notification_rules: {
              ...DEFAULT_NOTIFICATION_RULES,
              ...(bag.notification_rules || {}),
              zeroHarassmentGuard:
                bag.notification_rules?.zeroHarassmentGuard ??
                DEFAULT_NOTIFICATION_RULES.zeroHarassmentGuard,
              weatherGraceEnabled:
                bag.notification_rules?.weatherGraceEnabled ??
                DEFAULT_NOTIFICATION_RULES.weatherGraceEnabled,
              trafficSpikeImmunity:
                bag.notification_rules?.trafficSpikeImmunity ??
                DEFAULT_NOTIFICATION_RULES.trafficSpikeImmunity,
              gatewayOutageShield:
                bag.notification_rules?.gatewayOutageShield ??
                DEFAULT_NOTIFICATION_RULES.gatewayOutageShield,
              tiers: {
                ...DEFAULT_NOTIFICATION_RULES.tiers,
                ...(bag.notification_rules?.tiers || {}),
              },
            },
          };

          return new Response(JSON.stringify(config), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("GET /settings error:", err);
          return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
      POST: async ({ request }) => {
        try {
          const allowed = await verifyFounderOrAdminAccess(request);
          if (!allowed) {
            return new Response(JSON.stringify({ error: "Forbidden: Verified Founder or Admin session required" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = await request.json();
          const sql = await getSql();

          const rows = await sql`SELECT settings_json FROM platform_settings LIMIT 1`;
          let existing: Record<string, any> = {};
          if (rows.length > 0 && rows[0].settings_json) {
            try {
              existing = JSON.parse(rows[0].settings_json as string);
            } catch {
              existing = {};
            }
          }

          const { DEFAULT_ALGORITHM_SETTINGS } = await import("@/lib/orderking/cms-connectors");

          // Handle section-by-section or full factory reset if `reset_target` is passed
          const resetTarget = body.reset_target as
            | "brand"
            | "marketplace"
            | "algorithm"
            | "notifications"
            | "localization"
            | "all"
            | undefined;

          if (resetTarget) {
            const nextBag = { ...existing };
            if (resetTarget === "brand" || resetTarget === "all") {
              nextBag.brand = { ...DEFAULT_BRAND_CONFIG };
            }
            if (resetTarget === "marketplace" || resetTarget === "all") {
              nextBag.marketplace = { ...DEFAULT_MARKETPLACE_ECON };
              nextBag.paymentFeeBps = 180;
              nextBag.serviceFeePaise = 400;
              nextBag.refundLimitPaise = 25000;
              nextBag.maxRefundLimitInr = 250;
              nextBag.kingpay = {
                mdr_percentage: 1.8,
                customer_convenience_fee_inr: 4,
                auto_refund_ai_threshold_inr: 250,
                settlement_schedule: "T+1 Automated Escrow",
                payout_rail: "NPCI IMPS / NEFT Batch",
                status: "ACTIVE",
                last_updated: new Date().toISOString(),
              };
            }
            if (resetTarget === "algorithm" || resetTarget === "all") {
              nextBag.algorithm = { ...DEFAULT_ALGORITHM_SETTINGS };
              nextBag.features = {
                ...(nextBag.features || {}),
                dynamicSurge: true,
              };
            }
            if (resetTarget === "notifications" || resetTarget === "all") {
              nextBag.notification_rules = { ...DEFAULT_NOTIFICATION_RULES };
            }
            if (resetTarget === "localization" || resetTarget === "all") {
              nextBag.localization = { ...DEFAULT_LOCALIZATION_CONFIG };
            }

            await sql`
              UPDATE platform_settings
              SET settings_json = ${JSON.stringify(nextBag)}, updated_at = NOW()
              WHERE org_id = 'org_orderking'
            `;

            return new Response(
              JSON.stringify({
                success: true,
                reset_target: resetTarget,
                updated: nextBag,
              }),
              { headers: { "Content-Type": "application/json" } },
            );
          }

          // KingPay Global Fintech Matrix mapping
          const rawMdr = body.mdr_percentage ?? body.kingpay?.mdr_percentage;
          const rawConvenienceFee =
            body.customer_convenience_fee_inr ??
            body.convenience_fee_inr ??
            body.kingpay?.customer_convenience_fee_inr ??
            body.kingpay?.convenience_fee_inr;
          const rawAutoRefundThreshold =
            body.auto_refund_ai_threshold_inr ?? body.kingpay?.auto_refund_ai_threshold_inr;

          const updatedMdr =
            rawMdr !== undefined
              ? Number(rawMdr)
              : existing.kingpay?.mdr_percentage !== undefined
                ? Number(existing.kingpay.mdr_percentage)
                : existing.paymentFeeBps !== undefined
                  ? existing.paymentFeeBps / 100
                  : 1.8;

          const updatedConvenienceFee =
            rawConvenienceFee !== undefined
              ? Number(rawConvenienceFee)
              : existing.kingpay?.customer_convenience_fee_inr !== undefined
                ? Number(existing.kingpay.customer_convenience_fee_inr)
                : existing.serviceFeePaise !== undefined
                  ? existing.serviceFeePaise / 100
                  : 4;

          const updatedAutoRefundThreshold =
            rawAutoRefundThreshold !== undefined
              ? Number(rawAutoRefundThreshold)
              : existing.kingpay?.auto_refund_ai_threshold_inr !== undefined
                ? Number(existing.kingpay.auto_refund_ai_threshold_inr)
                : existing.refundLimitPaise !== undefined
                  ? existing.refundLimitPaise / 100
                  : 250;

          // Merge brand properties
          const mergedBrand = {
            ...DEFAULT_BRAND_CONFIG,
            ...(existing.brand || {}),
            ...(body.brand || {}),
            ...(body.primary_color !== undefined ? { primaryColor: body.primary_color } : {}),
            ...(body.accent_color !== undefined ? { accentColor: body.accent_color } : {}),
            ...(body.surface_color !== undefined ? { surfaceColor: body.surface_color } : {}),
            ...(body.font_family !== undefined ? { fontFamily: body.font_family } : {}),
            ...(body.logo_text !== undefined ? { logoText: body.logo_text } : {}),
            ...(body.tagline !== undefined ? { tagline: body.tagline } : {}),
            ...(body.compact_mode !== undefined ? { compactMode: Boolean(body.compact_mode) } : {}),
            ...(body.radius_px !== undefined ? { radiusPx: Number(body.radius_px) } : {}),
            ...(body.theme_mode !== undefined ? { themeMode: body.theme_mode } : {}),
          };

          // Merge localization
          const mergedLocalization = {
            ...DEFAULT_LOCALIZATION_CONFIG,
            ...(existing.localization || {}),
            ...(body.localization || {}),
            ...(body.default_language !== undefined
              ? { defaultLocale: body.default_language }
              : {}),
            ...(typeof body.supported_locales === "string"
              ? {
                  enabledLocales: body.supported_locales
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                }
              : {}),
          };

          // Merge notification rules
          const mergedNotificationRules = {
            ...DEFAULT_NOTIFICATION_RULES,
            ...(existing.notification_rules || {}),
            ...(body.notification_rules || {}),
            zeroHarassmentGuard:
              body.notification_rules?.zeroHarassmentGuard ??
              existing.notification_rules?.zeroHarassmentGuard ??
              true,
            tiers: {
              ...DEFAULT_NOTIFICATION_RULES.tiers,
              ...(existing.notification_rules?.tiers || {}),
              ...(body.notification_rules?.tiers || {}),
            },
          };

          // Map flat UI state to nested bag
          const updated = {
            ...existing,
            paymentFeeBps: Math.round(updatedMdr * 100),
            serviceFeePaise: Math.round(updatedConvenienceFee * 100),
            refundLimitPaise: Math.round(updatedAutoRefundThreshold * 100),
            maxRefundLimitInr: updatedAutoRefundThreshold,
            kingpay: {
              ...(existing.kingpay || {}),
              ...(body.kingpay || {}),
              mdr_percentage: updatedMdr,
              customer_convenience_fee_inr: updatedConvenienceFee,
              auto_refund_ai_threshold_inr: updatedAutoRefundThreshold,
              settlement_schedule:
                body.kingpay?.settlement_schedule ??
                existing.kingpay?.settlement_schedule ??
                "T+1 Automated Escrow",
              payout_rail:
                body.kingpay?.payout_rail ??
                existing.kingpay?.payout_rail ??
                "NPCI IMPS / NEFT Batch",
              status: "ACTIVE",
              last_updated: new Date().toISOString(),
            },
            algorithm: {
              ...(existing.algorithm || {}),
              ...(body.algorithm || {}),
              maxDeliveryRadiusKm:
                body.max_delivery_radius_km !== undefined
                  ? Number(body.max_delivery_radius_km)
                  : body.algorithm?.maxDeliveryRadiusKm !== undefined
                    ? Number(body.algorithm.maxDeliveryRadiusKm)
                    : existing.algorithm?.maxDeliveryRadiusKm ?? 25.0,
              baseDeliveryFeeInr:
                body.base_delivery_fee_inr !== undefined
                  ? Number(body.base_delivery_fee_inr)
                  : body.algorithm?.baseDeliveryFeeInr !== undefined
                    ? Number(body.algorithm.baseDeliveryFeeInr)
                    : existing.algorithm?.baseDeliveryFeeInr ?? 35.0,
              surgeMultiplierCap:
                body.surge_multiplier_cap !== undefined
                  ? Number(body.surge_multiplier_cap)
                  : body.algorithm?.surgeMultiplierCap !== undefined
                    ? Number(body.algorithm.surgeMultiplierCap)
                    : existing.algorithm?.surgeMultiplierCap ?? 2.0,
              kitchenPrepBufferMinutes:
                body.kitchen_prep_buffer_mins !== undefined
                  ? Number(body.kitchen_prep_buffer_mins)
                  : body.algorithm?.kitchenPrepBufferMinutes !== undefined
                    ? Number(body.algorithm.kitchenPrepBufferMinutes)
                    : existing.algorithm?.kitchenPrepBufferMinutes ?? 15,
            },
            features: {
              ...(existing.features || {}),
              dailyHub: body.daily_hub_enabled ?? existing.features?.dailyHub ?? false,
              viralReferrals:
                body.viral_referrals_enabled ?? existing.features?.viralReferrals ?? true,
              dynamicSurge: body.dynamic_surge_enabled ?? existing.features?.dynamicSurge ?? true,
            },
            marketplace: {
              ...DEFAULT_MARKETPLACE_ECON,
              ...(existing.marketplace || {}),
              defaultCommissionBps:
                body.restaurant_commission_pct !== undefined
                  ? Math.round(Number(body.restaurant_commission_pct) * 100)
                  : existing.marketplace?.defaultCommissionBps ??
                    DEFAULT_MARKETPLACE_ECON.defaultCommissionBps,
              serviceFeePaise:
                body.platform_fee_inr !== undefined
                  ? Math.round(Number(body.platform_fee_inr) * 100)
                  : rawConvenienceFee !== undefined
                    ? Math.round(updatedConvenienceFee * 100)
                    : existing.marketplace?.serviceFeePaise ??
                      DEFAULT_MARKETPLACE_ECON.serviceFeePaise,
              deliveryBasePaise:
                body.base_delivery_fee_inr !== undefined
                  ? Math.round(Number(body.base_delivery_fee_inr) * 100)
                  : body.algorithm?.baseDeliveryFeeInr !== undefined
                    ? Math.round(Number(body.algorithm.baseDeliveryFeeInr) * 100)
                    : existing.marketplace?.deliveryBasePaise ??
                      DEFAULT_MARKETPLACE_ECON.deliveryBasePaise,
              deliveryPerKmPaise:
                body.rider_payout_per_km_inr !== undefined
                  ? Math.round(Number(body.rider_payout_per_km_inr) * 100)
                  : existing.marketplace?.deliveryPerKmPaise ??
                    DEFAULT_MARKETPLACE_ECON.deliveryPerKmPaise,
              freeDeliveryThresholdInr:
                body.free_delivery_threshold_inr !== undefined
                  ? Number(body.free_delivery_threshold_inr)
                  : existing.marketplace?.freeDeliveryThresholdInr ??
                    DEFAULT_MARKETPLACE_ECON.freeDeliveryThresholdInr,
              smallOrderFeeInr:
                body.small_order_fee_inr !== undefined
                  ? Number(body.small_order_fee_inr)
                  : existing.marketplace?.smallOrderFeeInr ??
                    DEFAULT_MARKETPLACE_ECON.smallOrderFeeInr,
            },
            ai: {
              ...(existing.ai || {}),
              supportProvider: body.ai_support_provider ?? existing.ai?.supportProvider,
              menuSuggester: body.ai_menu_suggester ?? existing.ai?.menuSuggester,
              tutorProvider: body.ai_tutor_provider ?? existing.ai?.tutorProvider,
            },
            cms: {
              ...(existing.cms || {}),
              ...(body.cms || {}),
            },
            plugin_connectors: {
              ...(existing.plugin_connectors || {}),
              ...(body.plugin_connectors || {}),
            },
            brand: mergedBrand,
            localization: mergedLocalization,
            notification_rules: mergedNotificationRules,
          };

          await sql`
            UPDATE platform_settings
            SET settings_json = ${JSON.stringify(updated)}, updated_at = NOW()
            WHERE org_id = 'org_orderking'
          `;

          return new Response(JSON.stringify({ success: true, updated }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("POST /settings error:", err);
          return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});

