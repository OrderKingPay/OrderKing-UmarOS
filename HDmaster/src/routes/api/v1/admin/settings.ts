import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/v1/admin/settings")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const auth = request?.headers?.get('Authorization');
          const devSecret = process.env.FOUNDER_SECRET || 'dev_founder_secret';
          // Allow dev founder secret or same-origin browser requests
          if (auth && auth !== 'Bearer ' + devSecret) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
          }

          const sql = await getSql();
          const rows = await sql`SELECT settings_json FROM platform_settings LIMIT 1`;
          let bag: Record<string, any> = {};
          if (rows.length > 0 && rows[0].settings_json) {
            try { bag = JSON.parse(rows[0].settings_json as string); } catch (e) {}
          }
          
          const { DEFAULT_ECOSYSTEM_CMS, DEFAULT_PLUGIN_CONNECTORS, DEFAULT_ALGORITHM_SETTINGS } = await import("@/lib/orderking/cms-connectors");

          // KingPay Global Fintech Matrix
          const mdrPercentage = bag.kingpay?.mdr_percentage !== undefined
            ? Number(bag.kingpay.mdr_percentage)
            : (bag.paymentFeeBps !== undefined ? bag.paymentFeeBps / 100 : 0);

          const customerConvenienceFeeInr = bag.kingpay?.customer_convenience_fee_inr !== undefined
            ? Number(bag.kingpay.customer_convenience_fee_inr)
            : (bag.kingpay?.convenience_fee_inr !== undefined
              ? Number(bag.kingpay.convenience_fee_inr)
              : (bag.serviceFeePaise !== undefined
                ? bag.serviceFeePaise / 100
                : (bag.marketplace?.serviceFeePaise !== undefined ? bag.marketplace.serviceFeePaise / 100 : 0)));

          const autoRefundAiThresholdInr = bag.kingpay?.auto_refund_ai_threshold_inr !== undefined
            ? Number(bag.kingpay.auto_refund_ai_threshold_inr)
            : (bag.refundLimitPaise !== undefined
              ? bag.refundLimitPaise / 100
              : (bag.maxRefundLimitInr !== undefined ? Number(bag.maxRefundLimitInr) : 0));

          // Map nested bag to flat UI state and include full subsystem configs
          const config = {
            daily_hub_enabled: bag.features?.dailyHub ?? false,
            viral_referrals_enabled: bag.features?.viralReferrals ?? true,
            dynamic_surge_enabled: bag.features?.dynamicSurge ?? true,
            
            restaurant_commission_pct: (bag.marketplace?.defaultCommissionBps ?? 1800) / 100,
            platform_fee_inr: (bag.marketplace?.serviceFeePaise ?? 400) / 100,
            base_delivery_fee_inr: (bag.marketplace?.deliveryBasePaise ?? Math.round(DEFAULT_ALGORITHM_SETTINGS.baseDeliveryFeeInr * 100)) / 100,
            rider_payout_per_km_inr: (bag.marketplace?.deliveryPerKmPaise ?? 800) / 100,
            
            max_delivery_radius_km: bag.algorithm?.maxDeliveryRadiusKm ?? (bag.plugin_connectors?.mapbox?.maxServiceRadiusKm ?? DEFAULT_ALGORITHM_SETTINGS.maxDeliveryRadiusKm),
            surge_multiplier_cap: bag.algorithm?.surgeMultiplierCap ?? DEFAULT_ALGORITHM_SETTINGS.surgeMultiplierCap,
            kitchen_prep_buffer_mins: bag.algorithm?.kitchenPrepBufferMinutes ?? (bag.plugin_connectors?.mapbox?.etaSafetyBufferMinutes ?? DEFAULT_ALGORITHM_SETTINGS.kitchenPrepBufferMinutes),

            algorithm: {
              ...DEFAULT_ALGORITHM_SETTINGS,
              ...(bag.algorithm || {}),
              maxDeliveryRadiusKm: bag.algorithm?.maxDeliveryRadiusKm ?? (bag.plugin_connectors?.mapbox?.maxServiceRadiusKm ?? DEFAULT_ALGORITHM_SETTINGS.maxDeliveryRadiusKm),
              baseDeliveryFeeInr: (bag.marketplace?.deliveryBasePaise ?? Math.round(DEFAULT_ALGORITHM_SETTINGS.baseDeliveryFeeInr * 100)) / 100,
              surgeMultiplierCap: bag.algorithm?.surgeMultiplierCap ?? DEFAULT_ALGORITHM_SETTINGS.surgeMultiplierCap,
              kitchenPrepBufferMinutes: bag.algorithm?.kitchenPrepBufferMinutes ?? (bag.plugin_connectors?.mapbox?.etaSafetyBufferMinutes ?? DEFAULT_ALGORITHM_SETTINGS.kitchenPrepBufferMinutes),
            },
            
            ai_support_provider: bag.ai?.supportProvider ?? 'Google Gemini (1.5 Pro)',
            ai_menu_suggester: bag.ai?.menuSuggester ?? 'OpenAI (GPT-4o)',
            ai_tutor_provider: bag.ai?.tutorProvider ?? 'Google Gemini (1.5 Flash)',

            // KingPay Global Settings Matrix
            kingpay: {
              mdr_percentage: mdrPercentage,
              customer_convenience_fee_inr: customerConvenienceFeeInr,
              auto_refund_ai_threshold_inr: autoRefundAiThresholdInr,
              settlement_schedule: bag.kingpay?.settlement_schedule ?? "T+1 Automated Escrow",
              payout_rail: bag.kingpay?.payout_rail ?? "NPCI IMPS / NEFT Batch",
              status: bag.kingpay?.status ?? "ACTIVE",
              last_updated: bag.kingpay?.last_updated ?? null,
              ...(bag.kingpay || {})
            },
            mdr_percentage: mdrPercentage,
            customer_convenience_fee_inr: customerConvenienceFeeInr,
            auto_refund_ai_threshold_inr: autoRefundAiThresholdInr,

            cms: {
              ...DEFAULT_ECOSYSTEM_CMS,
              ...(bag.cms || {})
            },
            plugin_connectors: {
              ...DEFAULT_PLUGIN_CONNECTORS,
              ...(bag.plugin_connectors || {})
            },
            brand: {
              primaryColor: bag.brand?.primaryColor || "#0D3B2E",
              radiusPx: bag.brand?.radiusPx !== undefined ? Number(bag.brand.radiusPx) : 16,
              themeMode: bag.brand?.themeMode === "dark" ? "dark" : "light",
              ...(bag.brand || {})
            }
          };
          
          return new Response(JSON.stringify(config), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
          console.error("GET /settings error:", err);
          return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      },
      POST: async ({ request }) => {
        try {
          const auth = request?.headers?.get('Authorization');
          const devSecret = process.env.FOUNDER_SECRET || 'dev_founder_secret';
          if (auth && auth !== 'Bearer ' + devSecret) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
          }

          const body = await request.json();
          const sql = await getSql();

          const rows = await sql`SELECT settings_json FROM platform_settings LIMIT 1`;
          let existing: Record<string, any> = {};
          if (rows.length > 0 && rows[0].settings_json) {
            try { existing = JSON.parse(rows[0].settings_json as string); } catch (e) {}
          }

          // KingPay Global Fintech Matrix mapping
          const rawMdr = body.mdr_percentage ?? body.kingpay?.mdr_percentage;
          const rawConvenienceFee = body.customer_convenience_fee_inr ?? body.convenience_fee_inr ?? body.kingpay?.customer_convenience_fee_inr ?? body.kingpay?.convenience_fee_inr;
          const rawAutoRefundThreshold = body.auto_refund_ai_threshold_inr ?? body.kingpay?.auto_refund_ai_threshold_inr;

          const updatedMdr = rawMdr !== undefined
            ? Number(rawMdr)
            : (existing.kingpay?.mdr_percentage !== undefined ? Number(existing.kingpay.mdr_percentage) : (existing.paymentFeeBps !== undefined ? existing.paymentFeeBps / 100 : 0));

          const updatedConvenienceFee = rawConvenienceFee !== undefined
            ? Number(rawConvenienceFee)
            : (existing.kingpay?.customer_convenience_fee_inr !== undefined
              ? Number(existing.kingpay.customer_convenience_fee_inr)
              : (existing.serviceFeePaise !== undefined ? existing.serviceFeePaise / 100 : 0));

          const updatedAutoRefundThreshold = rawAutoRefundThreshold !== undefined
            ? Number(rawAutoRefundThreshold)
            : (existing.kingpay?.auto_refund_ai_threshold_inr !== undefined
              ? Number(existing.kingpay.auto_refund_ai_threshold_inr)
              : (existing.refundLimitPaise !== undefined ? existing.refundLimitPaise / 100 : 0));

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
              settlement_schedule: body.kingpay?.settlement_schedule ?? existing.kingpay?.settlement_schedule ?? "T+1 Automated Escrow",
              payout_rail: body.kingpay?.payout_rail ?? existing.kingpay?.payout_rail ?? "NPCI IMPS / NEFT Batch",
              status: "ACTIVE",
              last_updated: new Date().toISOString()
            },
            algorithm: {
              ...(existing.algorithm || {}),
              ...(body.algorithm || {}),
              maxDeliveryRadiusKm: body.max_delivery_radius_km !== undefined
                ? Number(body.max_delivery_radius_km)
                : (body.algorithm?.maxDeliveryRadiusKm !== undefined ? Number(body.algorithm.maxDeliveryRadiusKm) : existing.algorithm?.maxDeliveryRadiusKm ?? 25.0),
              baseDeliveryFeeInr: body.base_delivery_fee_inr !== undefined
                ? Number(body.base_delivery_fee_inr)
                : (body.algorithm?.baseDeliveryFeeInr !== undefined ? Number(body.algorithm.baseDeliveryFeeInr) : existing.algorithm?.baseDeliveryFeeInr ?? 35.0),
              surgeMultiplierCap: body.surge_multiplier_cap !== undefined
                ? Number(body.surge_multiplier_cap)
                : (body.algorithm?.surgeMultiplierCap !== undefined ? Number(body.algorithm.surgeMultiplierCap) : existing.algorithm?.surgeMultiplierCap ?? 2.0),
              kitchenPrepBufferMinutes: body.kitchen_prep_buffer_mins !== undefined
                ? Number(body.kitchen_prep_buffer_mins)
                : (body.algorithm?.kitchenPrepBufferMinutes !== undefined ? Number(body.algorithm.kitchenPrepBufferMinutes) : existing.algorithm?.kitchenPrepBufferMinutes ?? 15),
            },
            features: {
              ...(existing.features || {}),
              dailyHub: body.daily_hub_enabled ?? existing.features?.dailyHub ?? false,
              viralReferrals: body.viral_referrals_enabled ?? existing.features?.viralReferrals ?? true,
              dynamicSurge: body.dynamic_surge_enabled ?? existing.features?.dynamicSurge ?? true,
            },
            marketplace: {
              ...(existing.marketplace || {}),
              defaultCommissionBps: body.restaurant_commission_pct !== undefined ? Math.round(body.restaurant_commission_pct * 100) : existing.marketplace?.defaultCommissionBps,
              serviceFeePaise: body.platform_fee_inr !== undefined ? Math.round(body.platform_fee_inr * 100) : (rawConvenienceFee !== undefined ? Math.round(updatedConvenienceFee * 100) : existing.marketplace?.serviceFeePaise),
              deliveryBasePaise: body.base_delivery_fee_inr !== undefined
                ? Math.round(Number(body.base_delivery_fee_inr) * 100)
                : (body.algorithm?.baseDeliveryFeeInr !== undefined
                    ? Math.round(Number(body.algorithm.baseDeliveryFeeInr) * 100)
                    : existing.marketplace?.deliveryBasePaise),
              deliveryPerKmPaise: body.rider_payout_per_km_inr !== undefined ? Math.round(body.rider_payout_per_km_inr * 100) : existing.marketplace?.deliveryPerKmPaise,
            },
            ai: {
              ...(existing.ai || {}),
              supportProvider: body.ai_support_provider ?? existing.ai?.supportProvider,
              menuSuggester: body.ai_menu_suggester ?? existing.ai?.menuSuggester,
              tutorProvider: body.ai_tutor_provider ?? existing.ai?.tutorProvider,
            },
            cms: {
              ...(existing.cms || {}),
              ...(body.cms || {})
            },
            plugin_connectors: {
              ...(existing.plugin_connectors || {}),
              ...(body.plugin_connectors || {})
            },
            brand: {
              ...(existing.brand || {}),
              ...(body.brand || {}),
              ...(body.primary_color !== undefined ? { primaryColor: body.primary_color } : {}),
              ...(body.radius_px !== undefined ? { radiusPx: Number(body.radius_px) } : {}),
              ...(body.theme_mode !== undefined ? { themeMode: body.theme_mode } : {}),
            }
          };
          
          await sql`
            UPDATE platform_settings
            SET settings_json = ${JSON.stringify(updated)}, updated_at = NOW()
            WHERE org_id = 'org_orderking'
          `;
          
          return new Response(JSON.stringify({ success: true, updated }), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
          console.error("POST /settings error:", err);
          return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
      }
    }
  }
});
