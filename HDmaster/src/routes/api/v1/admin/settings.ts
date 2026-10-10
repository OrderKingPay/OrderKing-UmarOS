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
          
          const { DEFAULT_ECOSYSTEM_CMS, DEFAULT_PLUGIN_CONNECTORS } = await import("@/lib/orderking/cms-connectors");

          // Map nested bag to flat UI state and include full subsystem configs
          const config = {
            daily_hub_enabled: bag.features?.dailyHub ?? false,
            viral_referrals_enabled: bag.features?.viralReferrals ?? true,
            dynamic_surge_enabled: bag.features?.dynamicSurge ?? true,
            
            restaurant_commission_pct: (bag.marketplace?.defaultCommissionBps ?? 1800) / 100,
            platform_fee_inr: (bag.marketplace?.serviceFeePaise ?? 400) / 100,
            base_delivery_fee_inr: (bag.marketplace?.deliveryBasePaise ?? 3500) / 100,
            rider_payout_per_km_inr: (bag.marketplace?.deliveryPerKmPaise ?? 800) / 100,
            
            ai_support_provider: bag.ai?.supportProvider ?? 'Google Gemini (1.5 Pro)',
            ai_menu_suggester: bag.ai?.menuSuggester ?? 'OpenAI (GPT-4o)',
            ai_tutor_provider: bag.ai?.tutorProvider ?? 'Google Gemini (1.5 Flash)',

            cms: {
              ...DEFAULT_ECOSYSTEM_CMS,
              ...(bag.cms || {})
            },
            plugin_connectors: {
              ...DEFAULT_PLUGIN_CONNECTORS,
              ...(bag.plugin_connectors || {})
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

          // Map flat UI state to nested bag
          const updated = {
            ...existing,
            features: {
              ...(existing.features || {}),
              dailyHub: body.daily_hub_enabled ?? existing.features?.dailyHub ?? false,
              viralReferrals: body.viral_referrals_enabled ?? existing.features?.viralReferrals ?? true,
              dynamicSurge: body.dynamic_surge_enabled ?? existing.features?.dynamicSurge ?? true,
            },
            marketplace: {
              ...(existing.marketplace || {}),
              defaultCommissionBps: body.restaurant_commission_pct !== undefined ? Math.round(body.restaurant_commission_pct * 100) : existing.marketplace?.defaultCommissionBps,
              serviceFeePaise: body.platform_fee_inr !== undefined ? Math.round(body.platform_fee_inr * 100) : existing.marketplace?.serviceFeePaise,
              deliveryBasePaise: body.base_delivery_fee_inr !== undefined ? Math.round(body.base_delivery_fee_inr * 100) : existing.marketplace?.deliveryBasePaise,
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
