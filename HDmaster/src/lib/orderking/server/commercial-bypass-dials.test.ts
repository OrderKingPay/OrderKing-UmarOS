import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getSql } from "@/lib/db";
import {
  getCommercialBypassDials,
  updateCommercialBypassDials,
  triggerSoundboxTestAlert,
  type CommercialBypassDialsState,
} from "./commercial-dials.server";
import { ForbiddenError, type AccessContext } from "@/lib/orderking/rbac";
import type { Workspace } from "./workspace.server";
import { DEFAULT_SETTINGS } from "@/lib/orderking/types";

describe("👑 SILENT BYPASS 10 — CONSOLIDATED 9 COMMERCIAL BYPASS MASTER DIALS", () => {
  const orgId = "org_orderking";
  const founderUserId = "usr_founder_bypass_test";
  const founderEmployeeId = "emp_founder_bypass_test";

  const founderCtx: AccessContext = {
    userId: founderUserId,
    employeeId: founderEmployeeId,
    orgId,
    roleKey: "SUPER_ADMIN",
    actingRoleKey: "SUPER_ADMIN",
    permissions: [
      "manage_platform_settings",
      "issue_refunds",
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

  beforeAll(async () => {
    const sql = await getSql();
    // Ensure app_configurations table exists
    await sql.query(
      `CREATE TABLE IF NOT EXISTS app_configurations (
        key text PRIMARY KEY,
        value_json jsonb NOT NULL,
        updated_at timestamptz DEFAULT now(),
        updated_by text
      )`
    );
  });

  // =========================================================================
  // DIAL 1: Direct UPI VPA Switcher & Soundbox Audio Alerts
  // =========================================================================
  describe("Dial 1: Direct UPI VPA Switcher & Soundbox Audio Triggers", () => {
    it("loads default UPI VPA and soundbox language", async () => {
      const dials = await getCommercialBypassDials(founderCtx);
      expect(["orderking@ybl", "9395065587@ybl", "custom"]).toContain(dials.primaryVpa);
      expect(dials.merchantDirectSettlement).toBe(true);
      expect(dials.soundboxAlertsActive).toBe(true);
      expect(["BENGALI_SYLHETI", "HINDI", "ENGLISH"]).toContain(dials.soundboxLanguage);
      expect(dials.soundboxVolume).toBeGreaterThanOrEqual(1);
      expect(dials.soundboxVolume).toBeLessThanOrEqual(10);
    });

    it("switches primary VPA to 9395065587@ybl and persists volume adjustment", async () => {
      const updateRes = await updateCommercialBypassDials(
        founderWs,
        {
          primaryVpa: "9395065587@ybl",
          soundboxVolume: 10,
          soundboxLanguage: "BENGALI_SYLHETI",
        },
        "Founder NPCI UPI VPA Switcher & Audio Calibration",
      );

      expect(updateRes.ok).toBe(true);
      expect(updateRes.state.primaryVpa).toBe("9395065587@ybl");
      expect(updateRes.state.soundboxVolume).toBe(10);

      const refreshed = await getCommercialBypassDials(founderCtx);
      expect(refreshed.primaryVpa).toBe("9395065587@ybl");
      expect(refreshed.soundboxVolume).toBe(10);
    });

    it("triggers live soundbox audio test for ₹500 in Sylheti/Bengali dialect", async () => {
      const audioRes = await triggerSoundboxTestAlert(
        founderWs,
        { amountInr: 500, language: "BENGALI_SYLHETI" },
        "Founder Sylheti Soundbox Audio Diagnostic",
      );

      expect(audioRes.ok).toBe(true);
      expect(audioRes.message).toBe("OrderKing Pay-t ₹500 paowa gese. Shukriya!");
      expect(audioRes.audioUrl).toContain("amount=500");
      expect(audioRes.audioUrl).toContain("lang=BENGALI_SYLHETI");

      // Verify audit log has the event
      const sql = await getSql();
      const auditRows = await sql.query<{ action: string }>(
        `SELECT action FROM audit_logs WHERE action = 'soundbox.test_alert_triggered' ORDER BY created_at DESC LIMIT 1`
      );
      expect(auditRows.length).toBeGreaterThanOrEqual(1);
      expect(auditRows[0]?.action).toBe("soundbox.test_alert_triggered");
    });
  });

  // =========================================================================
  // DIAL 2: Section 9(5) CGST Statutory Tax Engine
  // =========================================================================
  describe("Dial 2: Section 9(5) CGST Statutory Tax Engine", () => {
    it("enforces Section 9(5) CGST 5% no-ITC liability and verified GSTIN 18AFXPH9838M1Z9", async () => {
      const dials = await getCommercialBypassDials(founderCtx);
      expect(dials.cgstSection9Enforced).toBe(true);
      expect(dials.interstateSupplyIgstMode).toBe(true);
      expect(dials.section52TcsWithholdingActive).toBe(true);
      expect(dials.section194OTdsWithholdingActive).toBe(true);
      expect(dials.platformGstin).toBe("18AFXPH9838M1Z9");
    });

    it("persists tax dialect adjustments with immutable audit trail", async () => {
      const res = await updateCommercialBypassDials(
        founderWs,
        {
          statutoryInvoiceDialect: "B2C_ECOM_CANONICAL",
          interstateSupplyIgstMode: true,
        },
        "Founder Statutory Section 9(5) Tax Dialect Calibration",
      );

      expect(res.ok).toBe(true);
      expect(res.state.statutoryInvoiceDialect).toBe("B2C_ECOM_CANONICAL");
    });
  });

  // =========================================================================
  // DIAL 3: Multi-Brand Virtual Kitchen Engine
  // =========================================================================
  describe("Dial 3: Multi-Brand Virtual Kitchen Controls", () => {
    it("adjusts virtual brand clustering capacity and kitchen delay multipliers", async () => {
      const res = await updateCommercialBypassDials(
        founderWs,
        {
          virtualBrandClusteringEnabled: true,
          maxVirtualBrandsPerKitchen: 6,
          kitchenPrepDelayMultiplier: 1.2,
          sharedInventorySync: true,
        },
        "Founder Cloud Kitchen Clustering Optimization",
      );

      expect(res.ok).toBe(true);
      expect(res.state.maxVirtualBrandsPerKitchen).toBe(6);
      expect(res.state.kitchenPrepDelayMultiplier).toBe(1.2);
      expect(res.state.sharedInventorySync).toBe(true);
    });

    it("clamps virtual brands per kitchen between 1 and 10", async () => {
      const resMax = await updateCommercialBypassDials(
        founderWs,
        { maxVirtualBrandsPerKitchen: 99 },
        "Boundary Clamp Test High",
      );
      expect(resMax.state.maxVirtualBrandsPerKitchen).toBe(10);

      const resMin = await updateCommercialBypassDials(
        founderWs,
        { maxVirtualBrandsPerKitchen: 0 },
        "Boundary Clamp Test Low",
      );
      expect(resMin.state.maxVirtualBrandsPerKitchen).toBe(1);
    });
  });

  // =========================================================================
  // DIAL 4: Flight Convenience Fee Sliders (₹499 Domestic / ₹1,299 International)
  // =========================================================================
  describe("Dial 4: Flight Convenience Fee Sliders (₹499 / ₹1,299)", () => {
    it("calibrates domestic fee to ₹499 and international fee to ₹1,299 matching founder directive", async () => {
      const res = await updateCommercialBypassDials(
        founderWs,
        {
          flightConvenienceFeeDomesticInr: 499,
          flightConvenienceFeeInternationalInr: 1299,
          kingpayZeroFeeCheckoutActive: true,
        },
        "Founder Flight Convenience Fee Alignment (₹499/₹1,299)",
      );

      expect(res.ok).toBe(true);
      expect(res.state.flightConvenienceFeeDomesticInr).toBe(499);
      expect(res.state.flightConvenienceFeeInternationalInr).toBe(1299);
      expect(res.state.kingpayZeroFeeCheckoutActive).toBe(true);
    });

    it("strictly clamps domestic flight fee (0 to 1500) and international fee (0 to 3500)", async () => {
      const res = await updateCommercialBypassDials(
        founderWs,
        {
          flightConvenienceFeeDomesticInr: 9999,
          flightConvenienceFeeInternationalInr: -50,
        },
        "Boundary Clamp Test",
      );

      expect(res.state.flightConvenienceFeeDomesticInr).toBe(1500);
      expect(res.state.flightConvenienceFeeInternationalInr).toBe(0);
    });
  });

  // =========================================================================
  // DIAL 5: Rail Quota & Tatkal Arbitrage Thresholds
  // =========================================================================
  describe("Dial 5: Rail Quota Arbitrage Thresholds", () => {
    it("manages Tatkal service fee (₹40) and confirmation cut-off probability (85%)", async () => {
      const res = await updateCommercialBypassDials(
        founderWs,
        {
          tatkalServiceFeeInr: 40,
          confirmationProbabilityThresholdPct: 85,
          splitTicketingArbitrageEnabled: true,
        },
        "Founder IRCTC Tatkal Arbitrage Calibration",
      );

      expect(res.ok).toBe(true);
      expect(res.state.tatkalServiceFeeInr).toBe(40);
      expect(res.state.confirmationProbabilityThresholdPct).toBe(85);
      expect(res.state.splitTicketingArbitrageEnabled).toBe(true);
    });
  });

  // =========================================================================
  // DIAL 6: Telecom Fallback Priority Switches
  // =========================================================================
  describe("Dial 6: Telecom Fallback Priority Switches", () => {
    it("manages Fast2SMS vs WhatsApp priority and failover latency threshold", async () => {
      const res = await updateCommercialBypassDials(
        founderWs,
        {
          primaryTelecomProvider: "FAST2SMS",
          backupTelecomProvider: "WHATSAPP",
          autoFailoverLatencyThresholdMs: 15000,
          whatsappOtpFallbackActive: true,
          regionalTelecomDialect: "ASSAM_NORTHEAST_CIRCLE",
        },
        "Founder Telecom Carrier Priority Configuration",
      );

      expect(res.ok).toBe(true);
      expect(res.state.primaryTelecomProvider).toBe("FAST2SMS");
      expect(res.state.backupTelecomProvider).toBe("WHATSAPP");
      expect(res.state.autoFailoverLatencyThresholdMs).toBe(15000);
      expect(res.state.regionalTelecomDialect).toBe("ASSAM_NORTHEAST_CIRCLE");
    });
  });

  // =========================================================================
  // DIAL 7: Proximity Dispatch Shift Radius Controls
  // =========================================================================
  describe("Dial 7: Proximity Dispatch Radius Controls", () => {
    it("manages Day (12km), Evening (7.5km), and Late-Night (3.5km) dispatch perimeters", async () => {
      const res = await updateCommercialBypassDials(
        founderWs,
        {
          dayShiftRadiusKm: 12.0,
          eveningShiftRadiusKm: 7.5,
          lateNightShiftRadiusKm: 3.5,
          maxBatchCapacityPerRider: 2,
          weatherSurgeDampenerMultiplier: 0.8,
        },
        "Founder Haversine Dispatch Radius Calibration",
      );

      expect(res.ok).toBe(true);
      expect(res.state.dayShiftRadiusKm).toBe(12.0);
      expect(res.state.eveningShiftRadiusKm).toBe(7.5);
      expect(res.state.lateNightShiftRadiusKm).toBe(3.5);
      expect(res.state.maxBatchCapacityPerRider).toBe(2);
      expect(res.state.weatherSurgeDampenerMultiplier).toBe(0.8);
    });
  });

  // =========================================================================
  // DIAL 8: Garage Fleet Insurance Affiliate Markers
  // =========================================================================
  describe("Dial 8: Garage Insurance Affiliate Markers", () => {
    it("configures RSA partner and statutory gig worker insurance compliance", async () => {
      const res = await updateCommercialBypassDials(
        founderWs,
        {
          rsaPartnerId: "ACKO_FLEET_DIRECT",
          insuranceAffiliateCommissionBps: 1500, // 15%
          mandatoryGigInsuranceCompliance: true,
          garageRoadsideAssistanceActive: true,
        },
        "Founder Fleet Insurance & Code on Social Security Alignment",
      );

      expect(res.ok).toBe(true);
      expect(res.state.rsaPartnerId).toBe("ACKO_FLEET_DIRECT");
      expect(res.state.insuranceAffiliateCommissionBps).toBe(1500);
      expect(res.state.mandatoryGigInsuranceCompliance).toBe(true);
    });
  });

  // =========================================================================
  // DIAL 9: WhatsApp Viral Bounty Referral Credit Dials
  // =========================================================================
  describe("Dial 9: WhatsApp Viral Bounty Referral Credit Dials", () => {
    it("calibrates referrer bounty (₹50), referee discount (₹100), and group milestone (₹500)", async () => {
      const res = await updateCommercialBypassDials(
        founderWs,
        {
          customerReferralBountyInr: 50,
          refereeFirstOrderDiscountInr: 100,
          milestoneFiveFriendsBonusInr: 500,
          viralOneTapShareCampaignActive: true,
        },
        "Founder Viral Bounty Incentive Calibration",
      );

      expect(res.ok).toBe(true);
      expect(res.state.customerReferralBountyInr).toBe(50);
      expect(res.state.refereeFirstOrderDiscountInr).toBe(100);
      expect(res.state.milestoneFiveFriendsBonusInr).toBe(500);
      expect(res.state.viralOneTapShareCampaignActive).toBe(true);
    });
  });

  // =========================================================================
  // FAIL-CLOSED GATES & AUDIT IMMUTABILITY
  // =========================================================================
  describe("Fail-Closed Security Gates & Immutable Audit Trail", () => {
    it("fails closed when unauthorized user attempts to update commercial bypass dials", async () => {
      await expect(
        updateCommercialBypassDials(
          restrictedWs,
          { primaryVpa: "orderking@ybl" },
          "Unauthorized bypass attempt",
        ),
      ).rejects.toThrow(ForbiddenError);
    });

    it("fails closed when high-risk audit reason is empty or whitespace", async () => {
      await expect(
        updateCommercialBypassDials(
          founderWs,
          { primaryVpa: "orderking@ybl" },
          "   ",
        ),
      ).rejects.toThrow();
    });

    it("writes append-only immutable audit log for every bypass dial adjustment", async () => {
      const sql = await getSql();
      const logs = await sql.query<{ action: string; target_id: string }>(
        `SELECT action, target_id FROM audit_logs
         WHERE action = 'commercial_bypass_dials.update'
         ORDER BY created_at DESC LIMIT 5`
      );

      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0]?.action).toBe("commercial_bypass_dials.update");
      expect(logs[0]?.target_id).toBe("commercial_bypass_dials");
    });
  });
});
