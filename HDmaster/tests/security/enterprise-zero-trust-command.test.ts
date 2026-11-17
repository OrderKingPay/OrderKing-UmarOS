import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  generateTotpSecret,
  generateTotpCode,
  verifyTotpCode,
  generateRecoveryCodes,
  verifyRecoveryCode,
} from "../../src/lib/auth/two-factor.server";

import { AuthRateLimitSentinel } from "../../src/lib/auth/sentinel.server";

import {
  hasPermission,
  requirePermission,
  assertRefundApprovalAuthority,
  ForbiddenError,
  type AccessContext,
} from "../../src/lib/orderking/rbac";

import {
  computeAuditChecksum,
  verifyAuditChainIntegrity,
} from "../../src/lib/orderking/security/system-audit-ledger";

import {
  militaryAntiFraudShield,
} from "../../src/lib/orderking/security/military-anti-fraud-shield";

import {
  freezeAllPayouts,
  unfreezeAllPayouts,
  freezeOrderIntake,
  unfreezeOrderIntake,
  triggerSurgeMonsoonOverride,
  dispatchEmergencySosBridge,
  getMasterLockdownState,
  type ActorSecurityContext,
} from "../../src/lib/orderking/security/emergency-command.server";

import {
  reconcileDailyPlatformSettlement,
  type SettlementLedgerSummary,
} from "../../src/lib/orderking/finance/daily-settlement-reconciliation.server";

describe("UMAR OS ZERO-TRUST ENTERPRISE COMMAND & SECURITY SUITE", () => {
  // =========================================================================
  // 1. ENTERPRISE AUTHENTICATION & TWO-FACTOR (TOTP / RECOVERY CODES)
  // =========================================================================
  describe("1. Two-Factor Authentication (RFC 6238 TOTP & Recovery Codes)", () => {
    it("generates valid high-entropy base32 secret and 6-digit TOTP code", () => {
      const secret = generateTotpSecret(20);
      assert.ok(secret.length >= 32, "Secret must be at least 32 base32 chars");
      assert.match(secret, /^[A-Z2-7]+$/, "Secret must strictly contain base32 chars");

      const code = generateTotpCode(secret);
      assert.match(code, /^\d{6}$/, "TOTP code must be 6 digits");

      const isValid = verifyTotpCode(secret, code, 1);
      assert.equal(isValid, true, "Generated TOTP code must verify within window drift");
    });

    it("rejects invalid or forged TOTP tokens", () => {
      const secret = generateTotpSecret(20);
      assert.equal(verifyTotpCode(secret, "000000"), false);
      assert.equal(verifyTotpCode(secret, "999999"), false);
      assert.equal(verifyTotpCode(secret, "abc123"), false);
    });

    it("generates single-use recovery codes and securely consumes them (burning)", () => {
      const { plainCodes, hashedCodes } = generateRecoveryCodes(5);
      assert.equal(plainCodes.length, 5);
      assert.equal(hashedCodes.length, 5);

      const codeToTest = plainCodes[0]!;
      // First verification succeeds and consumes code
      const firstCheck = verifyRecoveryCode(codeToTest, hashedCodes);
      assert.equal(firstCheck.valid, true);
      assert.equal(firstCheck.remainingHashedCodes.length, 4);

      // Re-using the same code must fail (single-use burned)
      const secondCheck = verifyRecoveryCode(codeToTest, firstCheck.remainingHashedCodes);
      assert.equal(secondCheck.valid, false);
      assert.equal(secondCheck.remainingHashedCodes.length, 4);
    });
  });

  // =========================================================================
  // 2. BRUTE-FORCE SENTINEL & RATE-LIMITING
  // =========================================================================
  describe("2. Auth Leaky-Bucket Rate-Limiting Sentinel", () => {
    it("locks out IP after 5 consecutive failed attempts", async () => {
      const sentinel = AuthRateLimitSentinel.getInstance();
      const testIp = `192.168.100.${Math.floor(Math.random() * 200 + 10)}`;

      // Initial check allows
      const initial = sentinel.checkRateLimit(testIp);
      assert.equal(initial.allowed, true);
      assert.equal(initial.remainingAttempts, 5);

      // 4 failed attempts
      for (let i = 1; i <= 4; i++) {
        await sentinel.recordFailedAttempt({ ip: testIp, endpoint: "/api/auth/sign-in" });
        const check = sentinel.checkRateLimit(testIp);
        assert.equal(check.allowed, true);
        assert.equal(check.remainingAttempts, 5 - i);
      }

      // 5th failed attempt -> hard lockout
      await sentinel.recordFailedAttempt({ ip: testIp, endpoint: "/api/auth/sign-in" });
      const lockedCheck = sentinel.checkRateLimit(testIp);
      assert.equal(lockedCheck.allowed, false);
      assert.equal(lockedCheck.remainingAttempts, 0);
      assert.ok((lockedCheck.lockoutExpiresInSec ?? 0) > 0);
    });
  });

  // =========================================================================
  // 3. ROLE-BASED ACCESS CONTROL (RBAC) & LEAST PRIVILEGE
  // =========================================================================
  describe("3. Hierarchical RBAC & Principle of Least Privilege", () => {
    it("enforces unrestricted permissions for FOUNDER / SUPER_ADMIN", () => {
      const founderCtx: AccessContext = {
        userId: "founder_1",
        roleKey: "FOUNDER",
        permissions: [],
        orgId: "org_1",
      };
      assert.equal(hasPermission(founderCtx, "manage_platform_settings"), true);
      assert.equal(hasPermission(founderCtx, "approve_settlements"), true);
      assert.equal(hasPermission(founderCtx, "issue_refunds"), true);
      assert.equal(hasPermission(founderCtx, "manage_roles"), true);
    });

    it("restricts FINANCE_CONTROLLER from employee roles and system secrets", () => {
      const financeCtx: AccessContext = {
        userId: "fin_1",
        roleKey: "FINANCE_CONTROLLER",
        permissions: [],
        orgId: "org_1",
      };
      assert.equal(hasPermission(financeCtx, "approve_settlements"), true);
      assert.equal(hasPermission(financeCtx, "modify_financial_settings"), true);
      assert.equal(hasPermission(financeCtx, "view_finance"), true);

      // Strictly denied
      assert.equal(hasPermission(financeCtx, "manage_roles"), false);
      assert.equal(hasPermission(financeCtx, "manage_platform_settings"), false);
      assert.throws(() => requirePermission(financeCtx, "manage_roles"), ForbiddenError);
    });

    it("restricts DISPATCH_CHIEF from finance and banking balances", () => {
      const dispatchCtx: AccessContext = {
        userId: "disp_1",
        roleKey: "DISPATCH_CHIEF",
        permissions: [],
        orgId: "org_1",
      };
      assert.equal(hasPermission(dispatchCtx, "modify_orders"), true);
      assert.equal(hasPermission(dispatchCtx, "manage_delivery_zones"), true);

      // Strictly denied
      assert.equal(hasPermission(dispatchCtx, "view_finance"), false);
      assert.equal(hasPermission(dispatchCtx, "approve_settlements"), false);
      assert.throws(() => requirePermission(dispatchCtx, "view_finance"), ForbiddenError);
    });

    it("enforces Support Specialist refund ceiling strictly at ₹100 (10000 paise)", () => {
      const supportCtx: AccessContext = {
        userId: "supp_1",
        roleKey: "SUPPORT_SPECIALIST",
        permissions: [],
        orgId: "org_1",
      };

      // ₹100 or less allowed
      assert.doesNotThrow(() => assertRefundApprovalAuthority(supportCtx, 10000));
      assert.doesNotThrow(() => assertRefundApprovalAuthority(supportCtx, 5000));

      // ₹100.01 (10001 paise) strictly forbidden for Support Specialist
      assert.throws(
        () => assertRefundApprovalAuthority(supportCtx, 10001),
        /Support Specialist goodwill refund ceiling is ₹100.00/
      );
    });

    it("enforces ₹500.00+ refund authority requiring Finance Controller or Founder", () => {
      const supportCtx: AccessContext = {
        userId: "supp_1",
        roleKey: "SUPPORT_SPECIALIST",
        permissions: [],
        orgId: "org_1",
      };
      const financeCtx: AccessContext = {
        userId: "fin_1",
        roleKey: "FINANCE_CONTROLLER",
        permissions: [],
        orgId: "org_1",
      };
      const founderCtx: AccessContext = {
        userId: "root_1",
        roleKey: "FOUNDER",
        permissions: [],
        orgId: "org_1",
      };

      // 60,000 paise (₹600.00)
      assert.throws(
        () => assertRefundApprovalAuthority(supportCtx, 60000),
        ForbiddenError
      );
      assert.doesNotThrow(() => assertRefundApprovalAuthority(financeCtx, 60000));
      assert.doesNotThrow(() => assertRefundApprovalAuthority(founderCtx, 60000));
    });
  });

  // =========================================================================
  // 4. IMMUTABLE FORENSIC AUDIT TRAIL & SHA-256 INTEGRITY
  // =========================================================================
  describe("4. Immutable Forensic Audit Trail & Hash Integrity", () => {
    it("computes deterministic SHA-256 chain checksum linking records", () => {
      const hash1 = computeAuditChecksum(
        "rec_1",
        "actor_1",
        "PAYOUT_BATCH_APPROVED",
        "BATCH",
        "b_100",
        JSON.stringify({ amount: 1000 }),
        JSON.stringify({ amount: 1000, status: "APPROVED" }),
        "0000000000000000000000000000000000000000000000000000000000000000",
        "2026-11-17T12:00:00.000Z"
      );
      assert.match(hash1, /^[a-f0-9]{64}$/, "Checksum must be 64-char hex SHA-256");

      const hash2 = computeAuditChecksum(
        "rec_2",
        "actor_1",
        "ROLE_ELEVATED",
        "EMPLOYEE",
        "emp_5",
        "{}",
        "{}",
        hash1,
        "2026-11-17T12:05:00.000Z"
      );
      assert.notEqual(hash1, hash2, "Successive hashes in chain must differ");
    });
  });

  // =========================================================================
  // 5. REAL-TIME FRAUD SENTINEL & ANTI-ABUSE ENGINE
  // =========================================================================
  describe("5. Military Anti-Fraud Shield & Anti-Abuse Sentinel", () => {
    it("flags rider teleportation when geodesic speed > 120 km/h or mock provider", async () => {
      // Coordinate shift > 120 km/h
      // Guwahati (26.1445, 91.7362) to Karimganj (24.8690, 92.3586) in 60 seconds
      const result = await militaryAntiFraudShield.evaluateRiderTelemetryRisk({
        riderId: "rider_teleport",
        latitude: 26.1445,
        longitude: 91.7362,
        timestamp: Date.now(),
        previousTelemetry: {
          latitude: 24.8690,
          longitude: 92.3586,
          timestamp: Date.now() - 60000, // 1 minute ago (~180 km distance)
        },
      });

      assert.equal(result.isFlagged, true);
      assert.ok(result.speedKmh > 120, "Speed must exceed 120 km/h");
      assert.ok(result.riskFlags.some((f) => f.includes("EXCESSIVE_SPEED")));
    });

    it("flags telemetry if isFromMockProvider returns true", async () => {
      const mockResult = await militaryAntiFraudShield.evaluateRiderTelemetryRisk({
        riderId: "rider_mock",
        latitude: 24.8690,
        longitude: 92.3586,
        isFromMockProvider: true,
        timestamp: Date.now(),
      });

      assert.equal(mockResult.isFlagged, true);
      assert.ok(mockResult.riskFlags.some((f) => f.includes("MOCK_PROVIDER")));
    });

    it("validates that geofence arrival is within 100m threshold", () => {
      // Identical coordinates -> distance 0m (< 100m)
      const valid = militaryAntiFraudShield.validateGeofenceArrival(
        24.8690,
        92.3586,
        24.8690,
        92.3586
      );
      assert.equal(valid.valid, true);
      assert.ok(valid.distanceMeters < 100);

      // Coordinates ~1.5km away -> rejected
      const invalid = militaryAntiFraudShield.validateGeofenceArrival(
        24.8690,
        92.3586,
        24.8800,
        92.3586
      );
      assert.equal(invalid.valid, false);
      assert.ok(invalid.distanceMeters > 100);
    });

    it("detects phantom order collusion between matching IPs, devices, or accounts", () => {
      const collusion = militaryAntiFraudShield.detectPhantomOrderCollusion({
        customerIp: "103.20.15.5",
        merchantIp: "103.20.15.5",
        customerDeviceId: "dev_xyz",
        merchantDeviceId: "dev_xyz",
        orderValuePaise: 45000,
      });

      assert.equal(collusion.isCollusion, true);
      assert.ok(collusion.reasons.length >= 2);
    });

    it("enforces COD cash hoarding limit (forces offline if > ₹1,500 for > 4h)", () => {
      // ₹1,600 held for 5 hours -> must force offline
      const hoarding = militaryAntiFraudShield.validateRiderCodHoarding(
        160000, // 1600 INR in paise
        5 * 3600 * 1000 // 5 hours in ms
      );
      assert.equal(hoarding.isViolation, true);
      assert.equal(hoarding.forceOffline, true);

      // ₹1,200 held for 2 hours -> allowed
      const allowed = militaryAntiFraudShield.validateRiderCodHoarding(
        120000,
        2 * 3600 * 1000
      );
      assert.equal(allowed.isViolation, false);
      assert.equal(allowed.forceOffline, false);
    });
  });

  // =========================================================================
  // 6. EMERGENCY GLOBAL KILL-SWITCHES & CRISIS MANAGEMENT
  // =========================================================================
  describe("6. Master Emergency Kill-Switches & SOS Crisis Desk", () => {
    it("strictly forbids non-FOUNDER or non-2FA from triggering payout freeze", async () => {
      const nonFounder: ActorSecurityContext = {
        actorId: "actor_hacker",
        role: "FINANCE_CONTROLLER",
        twoFactorVerified: true,
      };

      await assert.rejects(
        () => freezeAllPayouts(nonFounder, "Rogue freeze test"),
        /strictly requires FOUNDER role privileges/
      );

      const unverifiedFounder: ActorSecurityContext = {
        actorId: "founder_lazy",
        role: "FOUNDER",
        twoFactorVerified: false,
      };

      await assert.rejects(
        () => freezeAllPayouts(unverifiedFounder, "No 2FA test"),
        /strictly requires active 2FA re-verification/
      );
    });

    it("permits authenticated FOUNDER with 2FA to freeze and unfreeze payouts & intake", async () => {
      const founder: ActorSecurityContext = {
        actorId: "founder_umar",
        role: "FOUNDER",
        twoFactorVerified: true,
      };

      // Freeze payouts
      const state1 = await freezeAllPayouts(founder, "Emergency Banking Lockdown");
      assert.equal(state1.payoutsFrozen, true);

      // Unfreeze payouts
      const state2 = await unfreezeAllPayouts(founder, "Resolved");
      assert.equal(state2.payoutsFrozen, false);

      // Freeze order intake
      const state3 = await freezeOrderIntake(founder, "Monsoon Cyclone Warning");
      assert.equal(state3.orderIntakeFrozen, true);

      // Unfreeze order intake
      const state4 = await unfreezeOrderIntake(founder, "Weather Cleared");
      assert.equal(state4.orderIntakeFrozen, false);
    });

    it("allows DISPATCH_CHIEF or FOUNDER to activate monsoon/surge overrides", async () => {
      const dispatchChief: ActorSecurityContext = {
        actorId: "chief_1",
        role: "DISPATCH_CHIEF",
        twoFactorVerified: true,
      };

      const res = await triggerSurgeMonsoonOverride(
        dispatchChief,
        "hub_hailakandi",
        1500, // ₹15.00 surge
        "Heavy Monsoon Downpour"
      );
      assert.ok(res.activeSurgeOverrides["hub_hailakandi"]);
      assert.equal(res.activeSurgeOverrides["hub_hailakandi"]!.surgePaise, 1500);
    });

    it("dispatches live rider emergency SOS with 112/108 telephony bridges", async () => {
      const sos = await dispatchEmergencySosBridge({
        riderId: "rider_umar_01",
        orderId: "ord_emergency_999",
        latitude: 24.8695,
        longitude: 92.3590,
        accuracyMeters: 5,
        audioBroadcastActive: true,
      });

      assert.ok(sos.incidentId.startsWith("sos_"));
      assert.equal(sos.emergencyBridges.police, "tel:112");
      assert.equal(sos.emergencyBridges.ambulance, "tel:108");
      assert.equal(sos.audioBroadcastActive, true);
    });
  });

  // =========================================================================
  // 7. PAISE-PERFECT DAILY SETTLEMENT RECONCILIATION
  // =========================================================================
  describe("7. Daily Automated Settlement Reconciliation Engine", () => {
    it("approves settlement when debits identically match credits (discrepancy === 0)", async () => {
      // Customer Payments (₹1,000.00 = 100,000 paise)
      // Allocated:
      // Commission + Fee: ₹150.00 (15,000 paise)
      // Merchant Payable: ₹700.00 (70,000 paise)
      // Rider Payout: ₹120.00 (12,000 paise)
      // Statutory Tax: ₹30.00 (3,000 paise)
      // Total: 15,000 + 70,000 + 12,000 + 3,000 = 100,000 paise
      const summary: SettlementLedgerSummary = {
        batchDate: "2026-11-17",
        customerPaymentsCollectedPaise: 100000,
        platformCommissionsAndFeesPaise: 15000,
        merchantPayablePaise: 70000,
        riderPayoutPaise: 12000,
        statutoryTaxReservePaise: 3000,
      };

      const result = await reconcileDailyPlatformSettlement(summary);
      assert.equal(result.isBalanced, true);
      assert.equal(result.discrepancyPaise, 0);
      assert.equal(result.payoutBatchStatus, "CLEARED_FOR_RELEASE");
    });

    it("freezes payout release and emits alert if any discrepancy > 0 paise exists", async () => {
      // Discrepancy: Customer paid 100,000 paise, but allocations sum to 99,500 paise (500 paise gap)
      const leakedSummary: SettlementLedgerSummary = {
        batchDate: "2026-11-17",
        customerPaymentsCollectedPaise: 100000,
        platformCommissionsAndFeesPaise: 15000,
        merchantPayablePaise: 70000,
        riderPayoutPaise: 12000,
        statutoryTaxReservePaise: 2500, // 500 paise deficit
      };

      const result = await reconcileDailyPlatformSettlement(leakedSummary);
      assert.equal(result.isBalanced, false);
      assert.equal(result.discrepancyPaise, 500);
      assert.equal(result.payoutBatchStatus, "FROZEN_DUE_TO_DISCREPANCY");
      assert.equal(result.alertLogged, true);

      // Verify that payouts are now in frozen state
      const lockdown = getMasterLockdownState();
      assert.equal(lockdown.payoutsFrozen, true);
    });
  });
});
