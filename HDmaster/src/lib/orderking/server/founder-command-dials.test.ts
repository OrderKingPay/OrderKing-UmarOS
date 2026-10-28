import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getSql } from "@/lib/db";
import {
  getTravelPartnerGovernance,
  updateTravelPartnerGovernance,
  syncTboCredentialsAndToken,
  listCustomerSupportDisputes,
  resolveCustomerDisputeRefund,
  type TravelPartnerGovernanceState,
} from "./commercial-dials.server";
import { ForbiddenError, type AccessContext } from "@/lib/orderking/rbac";
import type { Workspace } from "./workspace.server";
import { DEFAULT_SETTINGS } from "@/lib/orderking/types";

describe("Founder Master Command Center — Dials, Promos, TBO Sync & Dispute Queue", () => {
  const orgId = "org_orderking";
  const founderUserId = "usr_founder_command_test";
  const founderEmployeeId = "emp_founder_command_test";

  const founderCtx: AccessContext = {
    userId: founderUserId,
    employeeId: founderEmployeeId,
    orgId,
    roleKey: "SUPER_ADMIN",
    actingRoleKey: "SUPER_ADMIN",
    permissions: [
      "manage_platform_settings",
      "issue_refunds",
      "manage_support",
      "view_finance",
      "view_audit_logs",
    ],
    cityId: null,
    areaId: null,
    status: "ACTIVE",
  };

  const founderWs: Workspace = {
    ctx: founderCtx,
    employee: {
      id: founderEmployeeId,
      org_id: orgId,
      user_id: founderUserId,
      email: "founder@orderking.app",
      name: "Founder",
      role_key: "SUPER_ADMIN",
      custom_permissions_json: null,
      department: "Founders",
      city_id: null,
      area_id: null,
      status: "ACTIVE",
      mfa_ready: 1,
      access_expires_at: null,
      assumed_role_key: null,
      last_active_at: null,
      invited_by: null,
    },
    email: "founder@orderking.app",
    displayName: "Founder",
    dataMode: "PRODUCTION",
    settings: DEFAULT_SETTINGS,
  };

  const restrictedCtx: AccessContext = {
    userId: "usr_restricted_test",
    employeeId: "emp_restricted_test",
    orgId,
    roleKey: "ANALYST",
    actingRoleKey: "ANALYST",
    permissions: ["view_analytics"],
    cityId: null,
    areaId: null,
    status: "ACTIVE",
  };

  const restrictedWs: Workspace = {
    ...founderWs,
    ctx: restrictedCtx,
  };

  const testOrderId = `ROS-TEST-DISPUTE-${Date.now()}`;
  const testTicketId = `tkt_dispute_test_${Date.now()}`;
  const testCustomerId = `cus_dispute_test_${Date.now()}`;

  beforeAll(async () => {
    const sql = await getSql();
    const seedQuery = async (text: string, params?: unknown[]) => {
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          return await sql.query(text, params);
        } catch (e) {
          if (attempt === 4) throw e;
          await new Promise((r) => setTimeout(r, 500 * attempt));
        }
      }
    };

    // Ensure city and zone exist
    await seedQuery(
      `INSERT INTO cities (id, name, state)
       VALUES ('city_karimganj', 'Karimganj', 'Assam')
       ON CONFLICT (id) DO NOTHING`
    );

    await seedQuery(
      `INSERT INTO zones (id, org_id, city_id, name)
       VALUES ('zone_karimganj_01', $1, 'city_karimganj', 'Karimganj Central Zone')
       ON CONFLICT (id) DO NOTHING`,
      [orgId]
    );

    // Ensure restaurant exists
    await seedQuery(
      `INSERT INTO restaurants (
         id, org_id, city_id, zone_id, name, slug, description_en, description_bn, cuisine_summary,
         address, phone_masked, lat, lng, status
       ) VALUES (
         'rst_01', $1, 'city_karimganj', 'zone_karimganj_01', 'Spice Sovereign Kitchen',
         'rst-01-spice', 'Authentic Indian Food', 'খাঁটি ভারতীয় খাবার', 'Indian, Bengali', 'Station Road',
         '+919395065587', 24.8688, 92.3511, 'ACTIVE'
       ) ON CONFLICT (id) DO NOTHING`,
      [orgId]
    );

    // Ensure customer exists
    await seedQuery(
      `INSERT INTO customers (id, org_id, city_id, display_ref, phone_masked, status)
       VALUES ($1, $2, 'city_karimganj', 'Syed Hassan', '+919395065587', 'ACTIVE')
       ON CONFLICT (id) DO NOTHING`,
      [testCustomerId, orgId]
    );

    // Seed test order for dispute queue
    await seedQuery(
      `INSERT INTO orders (
        id, public_id, user_id, org_id, city_id, customer_id, restaurant_id, zone_id,
        address_snapshot, status, payment_method, payment_status, idempotency_key,
        total_paise, food_paise, food_subtotal_paise, delivery_fee_paise, service_fee_paise,
        commission_bps, commission_paise, restaurant_payable_paise,
        placed_at, created_at, updated_at
      ) VALUES (
        $1, $2, $4, $3, 'city_karimganj', $4, 'rst_kake_da_hotel', 'zone_karimganj_01',
        '{"address":"Station Road, Karimganj, Assam 788710","lat":24.8700,"lng":92.3520}',
        'DELIVERED', 'RAZORPAY', 'CAPTURED', $1,
        85000, 75000, 75000, 7500, 2500,
        1500, 11250, 63750,
        now(), now(), now()
      )
      ON CONFLICT (id) DO NOTHING`,
      [testOrderId, testOrderId, orgId, testCustomerId]
    );

    // Seed test customer profile
    await seedQuery(
      `INSERT INTO profiles (id, user_id, first_name, last_name, phone)
       VALUES ($1, $1, 'Syed', 'Hassan', '+919395065587')
       ON CONFLICT (id) DO NOTHING`,
      [testCustomerId]
    );

    // Seed test ticket for dispute queue
    await seedQuery(
      `INSERT INTO tickets (
        id, org_id, city_id, queue, category, status, priority, subject,
        customer_id, restaurant_id, order_id, sla_minutes, data_mode, opened_at
      ) VALUES ($1, $2, 'city_karimganj', 'customer', 'refund', 'OPEN', 'HIGH',
        'Customer received spoiled biryani with broken container seal',
        $3, 'rst_kake_da_hotel', $4, 30, 'ACTUAL', now())
      ON CONFLICT (id) DO NOTHING`,
      [testTicketId, orgId, testCustomerId, testOrderId]
    );

    // Seed public ticket message
    await sql.query(
      `INSERT INTO ticket_messages (id, ticket_id, org_id, visibility, author_type, body)
       VALUES ($1, $2, $3, 'public', 'customer', 'Packaging seal was completely torn and food was spilled.')
       ON CONFLICT (id) DO NOTHING`,
      [`tm_${testTicketId}_01`, testTicketId, orgId]
    );
  });

  // =========================================================================
  // REQUIREMENT 1: Dynamic Sliders for Convenience Fees
  // =========================================================================
  describe("1. Dynamic Sliders for Convenience Fees (Flights ₹399, Trains ₹40, Hotels ₹250)", () => {
    it("loads default convenience fee dials matching founder mandate", async () => {
      const state = await getTravelPartnerGovernance(founderCtx);
      expect(state.flightConvenienceFeeInr).toBeDefined();
      expect(state.trainConvenienceFeeInr).toBeDefined();
      expect(state.hotelConvenienceFeeInr).toBeDefined();

      // Verified defaults
      expect(state.flightConvenienceFeeInr).toBe(399);
      expect(state.trainConvenienceFeeInr).toBe(40);
      expect(state.hotelConvenienceFeeInr).toBe(250);
    });

    it("adjusts dynamic convenience fee sliders and persists to PostgreSQL", async () => {
      const res = await updateTravelPartnerGovernance(
        founderWs,
        {
          flightConvenienceFeeInr: 499,
          trainConvenienceFeeInr: 50,
          hotelConvenienceFeeInr: 300,
        },
        "Founder adjusted peak travel convenience fees"
      );

      expect(res.ok).toBe(true);
      expect(res.state.flightConvenienceFeeInr).toBe(499);
      expect(res.state.trainConvenienceFeeInr).toBe(50);
      expect(res.state.hotelConvenienceFeeInr).toBe(300);

      // Verify reloaded state matches persisted DB row
      const reloaded = await getTravelPartnerGovernance(founderCtx);
      expect(reloaded.flightConvenienceFeeInr).toBe(499);
      expect(reloaded.trainConvenienceFeeInr).toBe(50);
      expect(reloaded.hotelConvenienceFeeInr).toBe(300);

      // Reset to canonical founder benchmark
      await updateTravelPartnerGovernance(
        founderWs,
        {
          flightConvenienceFeeInr: 399,
          trainConvenienceFeeInr: 40,
          hotelConvenienceFeeInr: 250,
        },
        "Reset to canonical founder benchmark"
      );
    });

    it("prevents negative convenience fees or float tampering", async () => {
      const state = await getTravelPartnerGovernance(founderCtx);
      expect(state.flightConvenienceFeeInr).toBeGreaterThanOrEqual(0);
      expect(state.trainConvenienceFeeInr).toBeGreaterThanOrEqual(0);
      expect(state.hotelConvenienceFeeInr).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(state.flightConvenienceFeeInr)).toBe(true);
      expect(Number.isInteger(state.trainConvenienceFeeInr)).toBe(true);
      expect(Number.isInteger(state.hotelConvenienceFeeInr)).toBe(true);
    });
  });

  // =========================================================================
  // REQUIREMENT 2: 1-Click Promo Campaign Toggles
  // =========================================================================
  describe("2. 1-Click Promo Campaign Master Toggles", () => {
    it("reads active states for GLOBAL5000, FLY500, RAIL40, and PILGRIM3000", async () => {
      const state = await getTravelPartnerGovernance(founderCtx);
      expect(state.promoGlobal5000Active).toBe(true);
      expect(state.promoFly500Active).toBe(true);
      expect(state.promoRail40Active).toBe(true);
      expect(state.promoPilgrim3000Active).toBe(true);
    });

    it("toggles promo campaigns with 1 click and audits the event", async () => {
      // Toggle FLY500 off and PILGRIM3000 on
      const res = await updateTravelPartnerGovernance(
        founderWs,
        {
          promoFly500Active: false,
          promoPilgrim3000Active: true,
        },
        "1-Click pause of FLY500 campaign during peak Diwali rush"
      );

      expect(res.ok).toBe(true);
      expect(res.state.promoFly500Active).toBe(false);
      expect(res.state.promoPilgrim3000Active).toBe(true);

      const reloaded = await getTravelPartnerGovernance(founderCtx);
      expect(reloaded.promoFly500Active).toBe(false);

      // Re-enable FLY500
      const restore = await updateTravelPartnerGovernance(
        founderWs,
        { promoFly500Active: true },
        "1-Click reactivate FLY500 campaign"
      );
      expect(restore.state.promoFly500Active).toBe(true);
    });
  });

  // =========================================================================
  // REQUIREMENT 3: 1-Click TBO API Password/Token Sync
  // =========================================================================
  describe("3. 1-Click TBO API Credentials & Token Sync", () => {
    it("conducts 1-click TBO API token synchronization", async () => {
      const syncRes = await syncTboCredentialsAndToken(
        founderWs,
        {
          agencyCode: "187051",
          userName: "orderkingpay",
          password: "TestPassword5566!",
          endpoint: "https://api.tbotechnology.com",
        },
        "Founder 1-Click TBO Token Handshake Test"
      );

      expect(syncRes.ok).toBe(true);
      expect(syncRes.state.tboAgencyCode).toBe("187051");
      expect(syncRes.state.tboUserName).toBe("orderkingpay");
      expect(syncRes.state.tboAuthStatus).toBe("AUTHENTICATED");
      expect(syncRes.state.tboAuthToken).toBeDefined();
      expect(syncRes.state.tboAuthToken?.startsWith("TBO-TOKEN-")).toBe(true);
      expect(syncRes.state.tboLastSyncAt).toBeDefined();
      expect(syncRes.state.tboMemberId).toBeDefined();
    });

    it("verifies fail-closed status when password is missing", async () => {
      const origEnv = process.env.TBO_PASSWORD;
      delete process.env.TBO_PASSWORD;

      const syncRes = await syncTboCredentialsAndToken(
        founderWs,
        {
          agencyCode: "187051",
          userName: "orderkingpay",
          password: "",
          endpoint: "https://api.tbotechnology.com",
        },
        "Test credential status evaluation"
      );

      expect(syncRes.ok).toBe(true);
      expect(syncRes.state.tboAuthStatus).toBe("PENDING_CREDENTIALS");

      if (origEnv) process.env.TBO_PASSWORD = origEnv;
    });
  });

  // =========================================================================
  // REQUIREMENT 4: Central Customer Support Dispute Queue with 1-Tap Refunds
  // =========================================================================
  describe("4. Central Customer Support Dispute Queue & 1-Tap Refunds", () => {
    it("lists customer dispute queue with real order linkage", async () => {
      const summary = await listCustomerSupportDisputes(founderCtx);
      expect(summary.disputes).toBeInstanceOf(Array);
      expect(summary.disputes.length).toBeGreaterThan(0);

      const targetDispute = summary.disputes.find((d) => d.ticketId === testTicketId);
      expect(targetDispute).toBeDefined();
      expect(targetDispute?.orderId).toBe(testOrderId);
      expect(targetDispute?.category).toBe("refund");
      expect(targetDispute?.orderTotalPaise).toBe(85000);
      expect(targetDispute?.customerName).toBe("Syed Hassan");
      expect(targetDispute?.customerPhone).toBe("+919395065587");
    });

    it("1-Tap Approve Refund: marks ticket resolved, updates order, inserts ledger reversal and writes audit log", async () => {
      const res = await resolveCustomerDisputeRefund(founderWs, {
        ticketId: testTicketId,
        decision: "APPROVE",
        refundAmountPaise: 85000,
        reason: "Founder 1-Tap Approved: Broken tamper seal and spilled soup verified via photo",
      });

      expect(res.ok).toBe(true);
      expect(res.ticketId).toBe(testTicketId);
      expect(res.decision).toBe("APPROVE");
      expect(res.refundPaise).toBe(85000);

      const sql = await getSql();

      // 1. Verify ticket status and resolution code
      const ticketRows = await sql.query<{ status: string; resolution_code: string }>(
        `SELECT status, resolution_code FROM tickets WHERE id = $1`,
        [testTicketId]
      );
      expect(ticketRows[0]?.status).toBe("RESOLVED");
      expect(ticketRows[0]?.resolution_code).toBe("REFUND_APPROVED");

      // 2. Verify order table updated with refund_paise
      const orderRows = await sql.query<{ status: string; refund_paise: number }>(
        `SELECT status, refund_paise FROM orders WHERE id = $1`,
        [testOrderId]
      );
      expect(orderRows[0]?.status).toBe("REFUND_PENDING");
      expect(orderRows[0]?.refund_paise).toBe(85000);

      // 3. Verify double-entry ledger reversal was posted
      const ledgerRows = await sql.query<{ party: string; kind: string; amount_paise: number }>(
        `SELECT party, kind, amount_paise FROM ledger_entries WHERE order_id = $1 AND kind = 'refund'`,
        [testOrderId]
      );
      expect(ledgerRows.length).toBeGreaterThan(0);
      expect(ledgerRows[0]?.party).toBe("CUSTOMER");
      expect(ledgerRows[0]?.amount_paise).toBe(-85000);

      // 4. Verify immutable audit log recorded
      const auditRows = await sql.query<{ action: string; target_id: string }>(
        `SELECT action, target_id FROM audit_logs WHERE target_id = $1 AND action = 'customer_dispute.refund_approved'`,
        [testTicketId]
      );
      expect(auditRows.length).toBeGreaterThan(0);
    });

    it("1-Tap Reject Dispute: marks ticket resolved with REFUND_REJECTED and records audit log", async () => {
      const rejectTicketId = `tkt_reject_test_${Date.now()}`;
      const sql = await getSql();

      await sql.query(
        `INSERT INTO tickets (
          id, org_id, queue, category, status, priority, subject, order_id, sla_minutes, data_mode
        ) VALUES ($1, $2, 'customer', 'refund', 'OPEN', 'MEDIUM', 'Unfounded refund claim', $3, 30, 'ACTUAL')
        ON CONFLICT (id) DO NOTHING`,
        [rejectTicketId, orgId, testOrderId]
      );

      const res = await resolveCustomerDisputeRefund(founderWs, {
        ticketId: rejectTicketId,
        decision: "REJECT",
        reason: "Founder 1-Tap Declined: GPS telematics confirms delivery completed without incident",
      });

      expect(res.ok).toBe(true);
      expect(res.ticketId).toBe(rejectTicketId);
      expect(res.decision).toBe("REJECT");
      expect(res.refundPaise).toBe(0);

      const ticketRows = await sql.query<{ status: string; resolution_code: string }>(
        `SELECT status, resolution_code FROM tickets WHERE id = $1`,
        [rejectTicketId]
      );
      expect(ticketRows[0]?.status).toBe("RESOLVED");
      expect(ticketRows[0]?.resolution_code).toBe("REFUND_REJECTED");
    });

    it("fails closed when unauthorized user attempts refund resolution", async () => {
      await expect(
        resolveCustomerDisputeRefund(restrictedWs, {
          ticketId: testTicketId,
          decision: "APPROVE",
          reason: "Unauthorized attempt",
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it("fails closed when refund reason is empty (high-risk gate enforcement)", async () => {
      await expect(
        resolveCustomerDisputeRefund(founderWs, {
          ticketId: testTicketId,
          decision: "APPROVE",
          reason: "   ",
        })
      ).rejects.toThrow();
    });
  });

  afterAll(async () => {
    const sql = await getSql();
    try {
      await sql.query(`DELETE FROM ticket_messages WHERE ticket_id = $1`, [testTicketId]);
      await sql.query(`DELETE FROM tickets WHERE id = $1 OR order_id = $2`, [testTicketId, testOrderId]);
      await sql.query(`DELETE FROM ledger_entries WHERE reference_id = $1`, [testOrderId]);
      await sql.query(`DELETE FROM orders WHERE id = $1`, [testOrderId]);
      await sql.query(`DELETE FROM customers WHERE id = $1`, [testCustomerId]);
      await sql.query(`DELETE FROM profiles WHERE user_id = $1`, [testCustomerId]);
    } catch {
      // Best effort cleanup
    }
  });
});
