import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";
import { DEFAULT_RIDER_DISCIPLINE_SETTINGS } from "@/lib/orderking/types";

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


export const ALL_10_BENCHMARK_LOCALES = [
  "en",
  "hi",
  "bn",
  "gu",
  "kn",
  "ml",
  "mr",
  "pa",
  "ta",
  "te",
] as const;

export const ALL_23_INDIAN_LOCALES = ALL_10_BENCHMARK_LOCALES;

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
            postgres_pool: {
              verified: true,
              status: "HEALTHY",
              timestamp: new Date().toISOString(),
            },
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

            rider_base_pay_inr:
              bag.algorithm?.riderBasePayoutInr ??
              (bag.marketplace?.deliveryBasePaise
                ? bag.marketplace.deliveryBasePaise / 100
                : DEFAULT_ALGORITHM_SETTINGS.riderBasePayoutInr ?? 35.0),
            rider_pickup_fee_inr:
              bag.algorithm?.riderPickupFeeInr ?? DEFAULT_ALGORITHM_SETTINGS.riderPickupFeeInr ?? 20.0,
            rider_drop_fee_inr:
              bag.algorithm?.riderDropFeeInr ?? DEFAULT_ALGORITHM_SETTINGS.riderDropFeeInr ?? 15.0,
            rider_wait_pay_per_min_inr:
              bag.algorithm?.riderWaitPayPerMinInr ?? DEFAULT_ALGORITHM_SETTINGS.riderWaitPayPerMinInr ?? 1.0,
            rider_wait_grace_mins:
              bag.algorithm?.riderWaitGraceMinutes ?? DEFAULT_ALGORITHM_SETTINGS.riderWaitGraceMinutes ?? 6,
            rider_rain_surge_bonus_inr:
              bag.algorithm?.riderRainSurgeBonusInr ?? DEFAULT_ALGORITHM_SETTINGS.riderRainSurgeBonusInr ?? 25.0,
            active_city_tier:
              bag.algorithm?.activeCityTier ?? DEFAULT_ALGORITHM_SETTINGS.activeCityTier ?? "TIER_1",
            city_tier_rates: {
              TIER_1: { name: "Tier 1 Metros", basePayInr: 35, pickupFeeInr: 20, dropFeeInr: 15, perKmInr: 12, floorInr: 35 },
              TIER_2: { name: "Tier 2 Growth Cities", basePayInr: 30, pickupFeeInr: 18, dropFeeInr: 12, perKmInr: 11, floorInr: 30 },
              TIER_3: { name: "Tier 3 Emerging Towns", basePayInr: 25, pickupFeeInr: 15, dropFeeInr: 10, perKmInr: 10, floorInr: 25 },
            },

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
              riderBasePayoutInr:
                bag.algorithm?.riderBasePayoutInr ??
                (bag.marketplace?.deliveryBasePaise
                  ? bag.marketplace.deliveryBasePaise / 100
                  : DEFAULT_ALGORITHM_SETTINGS.riderBasePayoutInr ?? 35.0),
              riderPickupFeeInr:
                bag.algorithm?.riderPickupFeeInr ?? DEFAULT_ALGORITHM_SETTINGS.riderPickupFeeInr ?? 20.0,
              riderDropFeeInr:
                bag.algorithm?.riderDropFeeInr ?? DEFAULT_ALGORITHM_SETTINGS.riderDropFeeInr ?? 15.0,
              riderPerKmRateInr:
                bag.algorithm?.riderPerKmRateInr ??
                (bag.marketplace?.deliveryPerKmPaise
                  ? bag.marketplace.deliveryPerKmPaise / 100
                  : DEFAULT_ALGORITHM_SETTINGS.riderPerKmRateInr ?? 12.0),
              riderWaitPayPerMinInr:
                bag.algorithm?.riderWaitPayPerMinInr ?? DEFAULT_ALGORITHM_SETTINGS.riderWaitPayPerMinInr ?? 1.0,
              riderWaitGraceMinutes:
                bag.algorithm?.riderWaitGraceMinutes ?? DEFAULT_ALGORITHM_SETTINGS.riderWaitGraceMinutes ?? 6,
              riderRainSurgeBonusInr:
                bag.algorithm?.riderRainSurgeBonusInr ?? DEFAULT_ALGORITHM_SETTINGS.riderRainSurgeBonusInr ?? 25.0,
              activeCityTier:
                bag.algorithm?.activeCityTier ?? DEFAULT_ALGORITHM_SETTINGS.activeCityTier ?? "TIER_1",
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
            rider_discipline: {
              ...DEFAULT_RIDER_DISCIPLINE_SETTINGS,
              ...(bag.rider_discipline || bag.riderDiscipline || {}),
            },
            central_pricing: {
              pricingState: bag.central_pricing?.pricingState ?? {
                orderKing: "standard",
                kingPay: "standard",
                aiTutor: "standard",
              },
              customRates: {
                commissionPct:
                  bag.central_pricing?.customRates?.commissionPct ??
                  (bag.marketplace?.defaultCommissionBps ? bag.marketplace.defaultCommissionBps / 100 : 18),
                minOrderInr: bag.central_pricing?.customRates?.minOrderInr ?? 149,
                deliveryFeeInr: bag.central_pricing?.customRates?.deliveryFeeInr ?? 40,
                rainFeeInr: bag.central_pricing?.customRates?.rainFeeInr ?? 20,
                riderBasePayInr: bag.central_pricing?.customRates?.riderBasePayInr ?? bag.algorithm?.riderBasePayoutInr ?? 35,
                riderPickupFeeInr: bag.central_pricing?.customRates?.riderPickupFeeInr ?? bag.algorithm?.riderPickupFeeInr ?? 20,
                riderDropFeeInr: bag.central_pricing?.customRates?.riderDropFeeInr ?? bag.algorithm?.riderDropFeeInr ?? 15,
                riderPerKmRateInr: bag.central_pricing?.customRates?.riderPerKmRateInr ?? bag.algorithm?.riderPerKmRateInr ?? 12,
                riderWaitPayPerMinInr: bag.central_pricing?.customRates?.riderWaitPayPerMinInr ?? bag.algorithm?.riderWaitPayPerMinInr ?? 1,
                riderWaitGraceMins: bag.central_pricing?.customRates?.riderWaitGraceMins ?? bag.algorithm?.riderWaitGraceMinutes ?? 6,
                riderWaitCapInr: bag.central_pricing?.customRates?.riderWaitCapInr ?? bag.algorithm?.riderWaitCapInr ?? 30,
                riderRainSurgeBonusInr: bag.central_pricing?.customRates?.riderRainSurgeBonusInr ?? bag.algorithm?.riderRainSurgeBonusInr ?? 25,
                cityTier: bag.central_pricing?.customRates?.cityTier ?? bag.algorithm?.activeCityTier ?? "TIER_1",
                gstPct: bag.central_pricing?.customRates?.gstPct ?? 5,
                payoutDay: bag.central_pricing?.customRates?.payoutDay ?? "Wednesday (Weekly)",
                walletCashbackPct: bag.central_pricing?.customRates?.walletCashbackPct ?? 2,
                tier1FloorInr: bag.central_pricing?.customRates?.tier1FloorInr ?? bag.algorithm?.tier1BaseFloorInr ?? 35,
                tier2FloorInr: bag.central_pricing?.customRates?.tier2FloorInr ?? bag.algorithm?.tier2BaseFloorInr ?? 30,
                tier3FloorInr: bag.central_pricing?.customRates?.tier3FloorInr ?? bag.algorithm?.tier3BaseFloorInr ?? 25,
                slab1RateInr: bag.central_pricing?.customRates?.slab1RateInr ?? bag.algorithm?.slab1RateInr ?? 12,
                slab2RateInr: bag.central_pricing?.customRates?.slab2RateInr ?? bag.algorithm?.slab2RateInr ?? 14,
                slab3RateInr: bag.central_pricing?.customRates?.slab3RateInr ?? bag.algorithm?.slab3RateInr ?? 16,
                ldoBonusInr: bag.central_pricing?.customRates?.ldoBonusInr ?? bag.algorithm?.ldoBonusInr ?? 20,
                floatingCashLimitInr:
                  bag.central_pricing?.customRates?.floatingCashLimitInr ??
                  bag.rider_discipline?.floating_cash_limit_inr ??
                  2000,
                coolingOffDurationMinutes:
                  bag.central_pricing?.customRates?.coolingOffDurationMinutes ??
                  bag.rider_discipline?.cooling_off_duration_minutes ??
                  15,
                payoutCycleDay: bag.central_pricing?.customRates?.payoutCycleDay ?? "Wednesday",
                kingAiAutonomousResolution:
                  bag.central_pricing?.customRates?.kingAiAutonomousResolution ??
                  bag.algorithm?.kingAiAutonomousResolution ??
                  true,
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
            | "discipline"
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
            if (resetTarget === "discipline" || resetTarget === "all") {
              nextBag.rider_discipline = { ...DEFAULT_RIDER_DISCIPLINE_SETTINGS };
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
              riderBasePayoutInr:
                body.rider_base_pay_inr !== undefined
                  ? Number(body.rider_base_pay_inr)
                  : body.central_pricing?.customRates?.riderBasePayInr !== undefined
                    ? Number(body.central_pricing.customRates.riderBasePayInr)
                    : body.algorithm?.riderBasePayoutInr !== undefined
                      ? Number(body.algorithm.riderBasePayoutInr)
                      : existing.algorithm?.riderBasePayoutInr ?? 35.0,
              riderPickupFeeInr:
                body.rider_pickup_fee_inr !== undefined
                  ? Number(body.rider_pickup_fee_inr)
                  : body.central_pricing?.customRates?.riderPickupFeeInr !== undefined
                    ? Number(body.central_pricing.customRates.riderPickupFeeInr)
                    : body.algorithm?.riderPickupFeeInr !== undefined
                      ? Number(body.algorithm.riderPickupFeeInr)
                      : existing.algorithm?.riderPickupFeeInr ?? 20.0,
              riderDropFeeInr:
                body.rider_drop_fee_inr !== undefined
                  ? Number(body.rider_drop_fee_inr)
                  : body.central_pricing?.customRates?.riderDropFeeInr !== undefined
                    ? Number(body.central_pricing.customRates.riderDropFeeInr)
                    : body.algorithm?.riderDropFeeInr !== undefined
                      ? Number(body.algorithm.riderDropFeeInr)
                      : existing.algorithm?.riderDropFeeInr ?? 15.0,
              riderPerKmRateInr:
                body.rider_payout_per_km_inr !== undefined
                  ? Number(body.rider_payout_per_km_inr)
                  : body.central_pricing?.customRates?.slab1RateInr !== undefined
                    ? Number(body.central_pricing.customRates.slab1RateInr)
                    : body.central_pricing?.customRates?.riderPerKmRateInr !== undefined
                      ? Number(body.central_pricing.customRates.riderPerKmRateInr)
                      : body.algorithm?.riderPerKmRateInr !== undefined
                        ? Number(body.algorithm.riderPerKmRateInr)
                        : existing.algorithm?.riderPerKmRateInr ?? 12.0,
              riderWaitPayPerMinInr:
                body.rider_wait_pay_per_min_inr !== undefined
                  ? Number(body.rider_wait_pay_per_min_inr)
                  : body.central_pricing?.customRates?.riderWaitPayPerMinInr !== undefined
                    ? Number(body.central_pricing.customRates.riderWaitPayPerMinInr)
                    : body.algorithm?.riderWaitPayPerMinInr !== undefined
                      ? Number(body.algorithm.riderWaitPayPerMinInr)
                      : existing.algorithm?.riderWaitPayPerMinInr ?? 1.0,
              riderWaitGraceMinutes:
                body.rider_wait_grace_mins !== undefined
                  ? Number(body.rider_wait_grace_mins)
                  : body.central_pricing?.customRates?.riderWaitGraceMins !== undefined
                    ? Number(body.central_pricing.customRates.riderWaitGraceMins)
                    : body.algorithm?.riderWaitGraceMinutes !== undefined
                      ? Number(body.algorithm.riderWaitGraceMinutes)
                      : existing.algorithm?.riderWaitGraceMinutes ?? 6,
              riderRainSurgeBonusInr:
                body.rider_rain_surge_bonus_inr !== undefined
                  ? Number(body.rider_rain_surge_bonus_inr)
                  : body.central_pricing?.customRates?.riderRainSurgeBonusInr !== undefined
                    ? Number(body.central_pricing.customRates.riderRainSurgeBonusInr)
                    : body.algorithm?.riderRainSurgeBonusInr !== undefined
                      ? Number(body.algorithm.riderRainSurgeBonusInr)
                      : existing.algorithm?.riderRainSurgeBonusInr ?? 25.0,
              activeCityTier:
                body.active_city_tier ?? body.algorithm?.activeCityTier ?? body.central_pricing?.customRates?.cityTier ?? existing.algorithm?.activeCityTier ?? "TIER_1",
              tier1BaseFloorInr:
                body.central_pricing?.customRates?.tier1FloorInr !== undefined
                  ? Number(body.central_pricing.customRates.tier1FloorInr)
                  : body.algorithm?.tier1BaseFloorInr !== undefined
                    ? Number(body.algorithm.tier1BaseFloorInr)
                    : existing.algorithm?.tier1BaseFloorInr ?? 35,
              tier2BaseFloorInr:
                body.central_pricing?.customRates?.tier2FloorInr !== undefined
                  ? Number(body.central_pricing.customRates.tier2FloorInr)
                  : body.algorithm?.tier2BaseFloorInr !== undefined
                    ? Number(body.algorithm.tier2BaseFloorInr)
                    : existing.algorithm?.tier2BaseFloorInr ?? 30,
              tier3BaseFloorInr:
                body.central_pricing?.customRates?.tier3FloorInr !== undefined
                  ? Number(body.central_pricing.customRates.tier3FloorInr)
                  : body.algorithm?.tier3BaseFloorInr !== undefined
                    ? Number(body.algorithm.tier3BaseFloorInr)
                    : existing.algorithm?.tier3BaseFloorInr ?? 25,
              slab1RateInr:
                body.central_pricing?.customRates?.slab1RateInr !== undefined
                  ? Number(body.central_pricing.customRates.slab1RateInr)
                  : body.algorithm?.slab1RateInr !== undefined
                    ? Number(body.algorithm.slab1RateInr)
                    : existing.algorithm?.slab1RateInr ?? 12,
              slab2RateInr:
                body.central_pricing?.customRates?.slab2RateInr !== undefined
                  ? Number(body.central_pricing.customRates.slab2RateInr)
                  : body.algorithm?.slab2RateInr !== undefined
                    ? Number(body.algorithm.slab2RateInr)
                    : existing.algorithm?.slab2RateInr ?? 14,
              slab3RateInr:
                body.central_pricing?.customRates?.slab3RateInr !== undefined
                  ? Number(body.central_pricing.customRates.slab3RateInr)
                  : body.algorithm?.slab3RateInr !== undefined
                    ? Number(body.algorithm.slab3RateInr)
                    : existing.algorithm?.slab3RateInr ?? 16,
              ldoBonusInr:
                body.central_pricing?.customRates?.ldoBonusInr !== undefined
                  ? Number(body.central_pricing.customRates.ldoBonusInr)
                  : body.algorithm?.ldoBonusInr !== undefined
                    ? Number(body.algorithm.ldoBonusInr)
                    : existing.algorithm?.ldoBonusInr ?? 20,
              riderWaitCapInr:
                body.central_pricing?.customRates?.riderWaitCapInr !== undefined
                  ? Number(body.central_pricing.customRates.riderWaitCapInr)
                  : body.algorithm?.riderWaitCapInr !== undefined
                    ? Number(body.algorithm.riderWaitCapInr)
                    : existing.algorithm?.riderWaitCapInr ?? 30,
              kingAiAutonomousResolution:
                body.central_pricing?.customRates?.kingAiAutonomousResolution !== undefined
                  ? Boolean(body.central_pricing.customRates.kingAiAutonomousResolution)
                  : body.algorithm?.kingAiAutonomousResolution !== undefined
                    ? Boolean(body.algorithm.kingAiAutonomousResolution)
                    : existing.algorithm?.kingAiAutonomousResolution ?? true,
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
            rider_discipline: {
              ...DEFAULT_RIDER_DISCIPLINE_SETTINGS,
              ...(existing.rider_discipline || existing.riderDiscipline || {}),
              ...(body.rider_discipline || body.riderDiscipline || {}),
              floating_cash_limit_inr:
                body.central_pricing?.customRates?.floatingCashLimitInr !== undefined
                  ? Number(body.central_pricing.customRates.floatingCashLimitInr)
                  : body.rider_discipline?.floating_cash_limit_inr !== undefined
                    ? Number(body.rider_discipline.floating_cash_limit_inr)
                    : existing.rider_discipline?.floating_cash_limit_inr ?? 2000,
              cooling_off_duration_minutes:
                body.central_pricing?.customRates?.coolingOffDurationMinutes !== undefined
                  ? Number(body.central_pricing.customRates.coolingOffDurationMinutes)
                  : body.rider_discipline?.cooling_off_duration_minutes !== undefined
                    ? Number(body.rider_discipline.cooling_off_duration_minutes)
                    : existing.rider_discipline?.cooling_off_duration_minutes ?? 15,
            },
            central_pricing: body.central_pricing
              ? {
                  ...(existing.central_pricing || {}),
                  ...body.central_pricing,
                  pricingState:
                    body.central_pricing.pricingState ??
                    existing.central_pricing?.pricingState ?? {
                      orderKing: "standard",
                      kingPay: "standard",
                      aiTutor: "standard",
                    },
                  customRates: {
                    ...(existing.central_pricing?.customRates || {}),
                    ...(body.central_pricing.customRates || {}),
                  },
                  lastUpdated: body.central_pricing.lastUpdated ?? new Date().toISOString(),
                }
              : existing.central_pricing
                ? {
                    ...existing.central_pricing,
                    customRates: {
                      ...(existing.central_pricing.customRates || {}),
                      ...(body.restaurant_commission_pct !== undefined
                        ? { commissionPct: Number(body.restaurant_commission_pct) }
                        : {}),
                      ...(body.base_delivery_fee_inr !== undefined
                        ? { deliveryFeeInr: Number(body.base_delivery_fee_inr) }
                        : {}),
                      ...(body.rider_payout_per_km_inr !== undefined
                        ? {
                            riderPerKmRateInr: Number(body.rider_payout_per_km_inr),
                            slab1RateInr: Number(body.rider_payout_per_km_inr),
                          }
                        : {}),
                      ...(body.rider_base_pay_inr !== undefined
                        ? { riderBasePayInr: Number(body.rider_base_pay_inr) }
                        : {}),
                      ...(body.rider_discipline?.floating_cash_limit_inr !== undefined
                        ? { floatingCashLimitInr: Number(body.rider_discipline.floating_cash_limit_inr) }
                        : {}),
                      ...(body.rider_discipline?.cooling_off_duration_minutes !== undefined
                        ? { coolingOffDurationMinutes: Number(body.rider_discipline.cooling_off_duration_minutes) }
                        : {}),
                    },
                  }
                : null,
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

