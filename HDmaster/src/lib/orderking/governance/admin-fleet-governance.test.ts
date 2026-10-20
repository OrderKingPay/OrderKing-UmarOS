import { test, expect } from 'vitest';
import path from 'path';
import dotenv from 'dotenv';

// Load .env before initializing pool
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { Pool } from 'pg';
import { ensureWorkspace } from '@/lib/orderking/server/workspace.server';
import * as q from '@/lib/orderking/server/queries.server';
import { handleAdminHttp } from '@/lib/orderking/server/admin-http.server';

test('UmarOS Admin & Fleet Governance - Real DB Schema & Live Endpoints', async () => {
  const dbUrl = process.env.DATABASE_URL;
  expect(dbUrl).toBeDefined();

  // 1. Direct Postgres Verification
  const pool = new Pool({ connectionString: dbUrl, connectionTimeoutMillis: 10000 });
  try {
    const check = await pool.query('SELECT current_database(), current_user');
    expect(check.rows.length).toBeGreaterThan(0);
    console.log(`[GOVERNANCE TEST] Connected to Postgres database: ${check.rows[0].current_database}`);

    // 2. Workspace Access
    const serviceUserId = process.env.ORDERKING_SERVICE_USER_ID || 'usr_root_admin';
    const serviceToken = process.env.ORDERKING_SERVICE_TOKEN || 'test-service-token';
    process.env.ORDERKING_SERVICE_USER_ID = serviceUserId;
    process.env.ORDERKING_SERVICE_TOKEN = serviceToken;

    const ws = await ensureWorkspace(serviceUserId);
    expect(ws.ctx.orgId).toBeDefined();

    // 3. Verify Restaurants & Compliance Submissions
    const restaurants = await q.listRestaurants(ws.ctx);
    expect(Array.isArray(restaurants)).toBe(true);
    expect(restaurants.length).toBeGreaterThan(0);

    const sample = restaurants[0];
    console.log(`[GOVERNANCE TEST] Sample outlet: ${sample.name} (${sample.id})`);
    expect(sample.id).toBeDefined();
    expect(sample.verificationStatus).toBeDefined();

    // 4. Test listOnboardingSubmissions
    const submissions = await q.listOnboardingSubmissions(ws.ctx);
    expect(Array.isArray(submissions)).toBe(true);
    console.log(`[GOVERNANCE TEST] Total onboarding submissions in DB: ${submissions.length}`);

    // 5. Test Restaurant Approval (Zero SMS / Zero Deadlock)
    const targetId = sample.id;
    const approveResult = await q.setRestaurantStatus(
      ws,
      targetId,
      'ACTIVE',
      'UmarOS Verification - Automated Governance Audit'
    );
    expect(approveResult.ok).toBe(true);
    expect(approveResult.status).toBe('ACTIVE');
    expect(approveResult.verificationStatus).toBe('VERIFIED');
    console.log(`[GOVERNANCE TEST] Restaurant approval committed to live DB.`);

    // Verify directly in Postgres table
    const dbRest = await pool.query(`SELECT status, verification_status, active FROM restaurants WHERE id = $1`, [targetId]);
    expect(dbRest.rows[0].status).toBe('ACTIVE');
    expect(dbRest.rows[0].verification_status).toBe('VERIFIED');
    expect(dbRest.rows[0].active).toBe(true);

    // 6. Test handleAdminHttp HTTP router against real schemas
    // 6a. GET /v1/admin/restaurants
    const reqRestaurants = new Request('http://localhost:8081/v1/admin/restaurants', {
      method: 'GET',
      headers: { authorization: `Bearer ${serviceToken}` }
    });
    const resRestaurants = await handleAdminHttp(reqRestaurants, { _splat: 'restaurants' });
    expect(resRestaurants.status).toBe(200);
    const dataRestaurants = await resRestaurants.json();
    expect(Array.isArray(dataRestaurants.data)).toBe(true);
    console.log(`[GOVERNANCE TEST] GET /v1/admin/restaurants -> OK (${dataRestaurants.data.length} outlets)`);

    // 6b. GET /v1/admin/restaurants/:id
    const reqRestDetail = new Request(`http://localhost:8081/v1/admin/restaurants/${targetId}`, {
      method: 'GET',
      headers: { authorization: `Bearer ${serviceToken}` }
    });
    const resRestDetail = await handleAdminHttp(reqRestDetail, { _splat: `restaurants/${targetId}` });
    expect(resRestDetail.status).toBe(200);
    const dataRestDetail = await resRestDetail.json();
    expect(dataRestDetail.data.id).toBe(targetId);
    expect(dataRestDetail.data.verificationStatus).toBe('VERIFIED');
    console.log(`[GOVERNANCE TEST] GET /v1/admin/restaurants/:id -> OK`);

    // 6c. GET /v1/admin/onboarding/submissions
    const reqSubmissions = new Request('http://localhost:8081/v1/admin/onboarding/submissions', {
      method: 'GET',
      headers: { authorization: `Bearer ${serviceToken}` }
    });
    const resSubmissions = await handleAdminHttp(reqSubmissions, { _splat: 'onboarding/submissions' });
    expect(resSubmissions.status).toBe(200);
    const dataSubmissions = await resSubmissions.json();
    expect(Array.isArray(dataSubmissions.data)).toBe(true);
    console.log(`[GOVERNANCE TEST] GET /v1/admin/onboarding/submissions -> OK (${dataSubmissions.data.length} submissions)`);

    // 6d. GET /v1/admin/commercial-dials
    const reqDials = new Request('http://localhost:8081/v1/admin/commercial-dials', {
      method: 'GET',
      headers: { authorization: `Bearer ${serviceToken}` }
    });
    const resDials = await handleAdminHttp(reqDials, { _splat: 'commercial-dials' });
    expect(resDials.status).toBe(200);
    const dataDials = await resDials.json();
    expect(dataDials.data.platformFeeInr).toBeDefined();
    console.log(`[GOVERNANCE TEST] GET /v1/admin/commercial-dials -> OK (Platform Fee: ₹${dataDials.data.platformFeeInr})`);

    // 6e. POST /v1/admin/commercial-dials/outlet-commission (0% commission sovereign policy)
    const reqComm = new Request('http://localhost:8081/v1/admin/commercial-dials/outlet-commission', {
      method: 'POST',
      headers: { authorization: `Bearer ${serviceToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ restaurantId: targetId, commissionBps: 0, reason: '0% Restaurant Food Markup Sovereign Policy' })
    });
    const resComm = await handleAdminHttp(reqComm, { _splat: 'commercial-dials/outlet-commission' });
    expect(resComm.status).toBe(200);
    const dataComm = await resComm.json();
    expect(dataComm.data.commissionBps).toBe(0);
    console.log(`[GOVERNANCE TEST] POST /v1/admin/commercial-dials/outlet-commission -> OK (0% commission)`);

    // Direct DB check for 0% commission
    const checkComm = await pool.query(`SELECT commission_bps FROM restaurants WHERE id = $1`, [targetId]);
    expect(checkComm.rows[0].commission_bps).toBe(0);

    // 6f. GET /v1/admin/orders
    const reqOrders = new Request('http://localhost:8081/v1/admin/orders', {
      method: 'GET',
      headers: { authorization: `Bearer ${serviceToken}` }
    });
    const resOrders = await handleAdminHttp(reqOrders, { _splat: 'orders' });
    expect(resOrders.status).toBe(200);
    console.log(`[GOVERNANCE TEST] GET /v1/admin/orders -> OK`);

    console.log('[GOVERNANCE TEST] ALL UMAROS ADMIN & FLEET GOVERNANCE ASSERTIONS PASSED WITH ZERO MOCKS.');
  } finally {
    await pool.end();
  }
}, 60000);
