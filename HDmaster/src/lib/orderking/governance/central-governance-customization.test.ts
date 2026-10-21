import { test, expect } from 'vitest';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { Pool } from 'pg';
import { ensureWorkspace } from '@/lib/orderking/server/workspace.server';
import * as q from '@/lib/orderking/server/queries.server';
import { handleAdminHttp } from '@/lib/orderking/server/admin-http.server';

test('UmarOS Central Governance & Platform Customization Engine - Real DB Persistence', async () => {
  const dbUrl = process.env.DATABASE_URL;
  expect(dbUrl).toBeDefined();

  const pool = new Pool({ connectionString: dbUrl, connectionTimeoutMillis: 10000 });

  try {
    const serviceUserId = process.env.ORDERKING_SERVICE_USER_ID || 'usr_root_admin';
    const serviceToken = process.env.ORDERKING_SERVICE_TOKEN || 'test-service-token';
    process.env.ORDERKING_SERVICE_USER_ID = serviceUserId;
    process.env.ORDERKING_SERVICE_TOKEN = serviceToken;

    const ws = await ensureWorkspace(serviceUserId);
    expect(ws.ctx.orgId).toBeDefined();

    // 1. Verify app_configurations & platform_settings tables exist in Postgres
    const tableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('platform_settings', 'app_configurations')
    `);
    const tables = tableCheck.rows.map((r) => r.table_name);
    console.log('[GOVERNANCE TEST] Found database tables:', tables);

    // 2. Test GET /v1/admin/settings via handleAdminHttp
    const reqGetSettings = new Request('http://localhost:8081/v1/admin/settings', {
      method: 'GET',
      headers: { authorization: `Bearer ${serviceToken}` },
    });
    const resGetSettings = await handleAdminHttp(reqGetSettings, { _splat: 'settings' });
    expect(resGetSettings.status).toBe(200);
    const settingsData = await resGetSettings.json();
    expect(settingsData.data).toBeDefined();
    expect(settingsData.data.modules).toBeDefined();
    expect(settingsData.data.modules.foodDelivery).toBe(true);
    expect(settingsData.data.modules.travel).toBe(true);
    expect(settingsData.data.modules.utilities).toBe(true);
    expect(settingsData.data.modules.aiTutor).toBe(true);
    expect(settingsData.data.modules.jobs).toBe(true);
    expect(settingsData.data.modules.courier).toBe(true);

    expect(settingsData.data.pricingDeliveryRules).toBeDefined();
    expect(settingsData.data.pricingDeliveryRules.courierBaseFareInr).toBe(30);
    expect(settingsData.data.pricingDeliveryRules.courierPerKmRateInr).toBe(10);

    expect(settingsData.data.dynamicBranding).toBeDefined();
    expect(settingsData.data.dynamicBranding.customAccentColor).toBeDefined();
    expect(settingsData.data.dynamicBranding.announcementBanner).toBeDefined();
    expect(Array.isArray(settingsData.data.dynamicBranding.featuredCityHubs)).toBe(true);
    console.log('[GOVERNANCE TEST] GET /v1/admin/settings -> OK with comprehensive governance schema');

    // 3. Test POST /v1/admin/settings with Dynamic Customization:
    //    - Module Toggles
    //    - Pricing & Delivery Rules (courier base ₹30, per-km ₹10, night fee ₹15, commissions)
    //    - Dynamic Branding (custom accents, announcement banner, featured city hubs)
    const updatePayload = {
      settings: {
        ...settingsData.data,
        modules: {
          travel: true,
          utilities: true,
          aiTutor: true,
          jobs: true,
          courier: true,
          foodDelivery: true,
        },
        pricingDeliveryRules: {
          courierBaseFareInr: 30,
          courierPerKmRateInr: 10,
          courierBasePaise: 3000,
          courierPerKmPaise: 1000,
          nightFeeInr: 15,
          nightFeePaise: 1500,
          nightFeeActive: true,
          platformCommissionBps: 1800,
          townCommissionBps: 2200,
          longDistanceCommissionBps: 2800,
        },
        dynamicBranding: {
          customAccentColor: '#D97706',
          announcementBanner: {
            enabled: true,
            text: '⚡ FOUNDER SPECIAL: Flat 20% OFF on all gourmet orders above ₹299!',
            linkUrl: '/offers',
            bgGradient: 'from-amber-600 via-orange-600 to-amber-700',
            badgeText: 'FOUNDER PROMO',
          },
          featuredCityHubs: [
            { id: 'city_cp', name: 'Connaught Place, New Delhi', state: 'Delhi', active: true, tier: 'TIER_1' },
            { id: 'city_karimganj', name: 'Karimganj Core Hub', state: 'Assam', active: true, tier: 'TIER_3' },
            { id: 'city_silchar', name: 'Silchar Valley Hub', state: 'Assam', active: true, tier: 'TIER_2' },
          ],
        },
      },
      reason: 'UmarOS Master Governance & Customization Verification Test',
    };

    const reqPostSettings = new Request('http://localhost:8081/v1/admin/settings', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${serviceToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });
    const resPostSettings = await handleAdminHttp(reqPostSettings, { _splat: 'settings' });
    expect(resPostSettings.status).toBe(200);
    const postSettingsResult = await resPostSettings.json();
    expect(postSettingsResult.ok).toBe(true);
    console.log('[GOVERNANCE TEST] POST /v1/admin/settings -> OK');

    // 4. Verify PostgreSQL persistence directly in platform_settings table
    const dbPlatformSettings = await pool.query<{ settings_json: string }>(
      `SELECT settings_json FROM platform_settings WHERE org_id = $1 LIMIT 1`,
      [ws.ctx.orgId]
    );
    expect(dbPlatformSettings.rows.length).toBe(1);
    const persistedSettings = JSON.parse(dbPlatformSettings.rows[0].settings_json);
    expect(persistedSettings.modules.travel).toBe(true);
    expect(persistedSettings.modules.courier).toBe(true);
    expect(persistedSettings.pricingDeliveryRules.courierBaseFareInr).toBe(30);
    expect(persistedSettings.pricingDeliveryRules.courierPerKmRateInr).toBe(10);
    expect(persistedSettings.pricingDeliveryRules.nightFeeInr).toBe(15);
    expect(persistedSettings.pricingDeliveryRules.nightFeeActive).toBe(true);
    expect(persistedSettings.dynamicBranding.customAccentColor).toBe('#D97706');
    expect(persistedSettings.dynamicBranding.announcementBanner.badgeText).toBe('FOUNDER PROMO');
    console.log('[GOVERNANCE TEST] Direct PostgreSQL platform_settings verification passed.');

    // 5. Verify PostgreSQL persistence directly in app_configurations table
    const dbAppConfigs = await pool.query<{ key: string; value_json: any }>(
      `SELECT key, value_json FROM app_configurations WHERE key IN ('platform_modules', 'pricing_delivery_rules', 'dynamic_branding', 'global_governance')`
    );
    expect(dbAppConfigs.rows.length).toBeGreaterThanOrEqual(3);
    const moduleRow = dbAppConfigs.rows.find((r) => r.key === 'platform_modules');
    expect(moduleRow).toBeDefined();
    expect(moduleRow?.value_json.travel).toBe(true);
    expect(moduleRow?.value_json.courier).toBe(true);

    const pricingRow = dbAppConfigs.rows.find((r) => r.key === 'pricing_delivery_rules');
    expect(pricingRow).toBeDefined();
    expect(pricingRow?.value_json.courierBaseFareInr).toBe(30);
    expect(pricingRow?.value_json.courierPerKmRateInr).toBe(10);

    const brandingRow = dbAppConfigs.rows.find((r) => r.key === 'dynamic_branding');
    expect(brandingRow).toBeDefined();
    expect(brandingRow?.value_json.customAccentColor).toBe('#D97706');
    console.log('[GOVERNANCE TEST] Direct PostgreSQL app_configurations verification passed.');

    // 6. Test GET /v1/admin/governance and POST /v1/admin/governance
    const reqGetGov = new Request('http://localhost:8081/v1/admin/governance', {
      method: 'GET',
      headers: { authorization: `Bearer ${serviceToken}` },
    });
    const resGetGov = await handleAdminHttp(reqGetGov, { _splat: 'governance' });
    expect(resGetGov.status).toBe(200);
    const govData = await resGetGov.json();
    expect(govData.data.modules).toBeDefined();
    expect(govData.data.pricingDeliveryRules.courierBaseFareInr).toBe(30);

    // 7. Test app_configurations endpoints
    const reqGetConfigs = new Request('http://localhost:8081/v1/admin/configurations', {
      method: 'GET',
      headers: { authorization: `Bearer ${serviceToken}` },
    });
    const resGetConfigs = await handleAdminHttp(reqGetConfigs, { _splat: 'configurations' });
    expect(resGetConfigs.status).toBe(200);
    const configsData = await resGetConfigs.json();
    expect(Array.isArray(configsData.data)).toBe(true);
    console.log(`[GOVERNANCE TEST] GET /v1/admin/configurations -> OK (${configsData.data.length} keys)`);

    console.log('[GOVERNANCE TEST] ALL CENTRAL GOVERNANCE & PLATFORM CUSTOMIZATION ENGINE ASSERTIONS PASSED WITH ZERO MOCKS.');
  } finally {
    await pool.end();
  }
}, 35000);
