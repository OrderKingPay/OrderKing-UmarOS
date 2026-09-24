import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateGstin,
  validateFssai,
  validatePan,
  validateTan,
  validateIfsc,
  validatePostgresUrl,
  validateDomain,
  evaluateGoLiveReadiness,
  enforceCapacityLimits,
  testDbConnection,
  testPgConnection,
  testSmsConnection,
  testMapsConnection,
  DEFAULT_GOLIVE_CONFIG,
} from "./golive-engine.ts";
import type { MasterGoLiveConfig } from "./types.ts";

test("Go-Live Statutory & Format Validators", async (t) => {
  await t.test("validates Indian GSTIN accurately", () => {
    assert.equal(validateGstin("18AAFCO9182K1Z5"), true);
    assert.equal(validateGstin("27AAPFU0955L1ZV"), true);
    assert.equal(validateGstin("18AAFCO9182K1"), false); // too short
    assert.equal(validateGstin("INVALID_GSTIN_123"), false);
    assert.equal(validateGstin(""), false);
  });

  await t.test("validates Indian FSSAI 14-digit license accurately", () => {
    assert.equal(validateFssai("10326999000184"), true);
    assert.equal(validateFssai("10012021000123"), true);
    assert.equal(validateFssai("1032699900018"), false); // 13 digits
    assert.equal(validateFssai("103269990001845"), false); // 15 digits
    assert.equal(validateFssai("1032699900018A"), false); // contains letter
  });

  await t.test("validates PAN and TAN formats accurately", () => {
    assert.equal(validatePan("AAFCO9182K"), true);
    assert.equal(validatePan("AAFCOP182K"), false); // 4th letter not followed by 4 digits
    assert.equal(validateTan("SHLO09182F"), true);
    assert.equal(validateTan("SHLO09182"), false);
  });

  await t.test("validates Bank IFSC code accurately", () => {
    assert.equal(validateIfsc("HDFC0002049"), true);
    assert.equal(validateIfsc("SBIN0001234"), true);
    assert.equal(validateIfsc("HDFC1002049"), false); // 5th char must be 0
    assert.equal(validateIfsc("HDFC00020"), false); // too short
  });

  await t.test("validates PostgreSQL connection strings accurately", () => {
    assert.equal(
      validatePostgresUrl("postgresql://postgres:secret@db.supabase.com:5432/postgres?sslmode=require"),
      true,
    );
    assert.equal(
      validatePostgresUrl("postgres://user:pass@localhost:5432/mydb"),
      true,
    );
    assert.equal(validatePostgresUrl("http://localhost:5432"), false);
    assert.equal(validatePostgresUrl(""), false);
  });

  await t.test("validates domains accurately", () => {
    assert.equal(validateDomain("orderking.in"), true);
    assert.equal(validateDomain("partner.orderking.in"), true);
    assert.equal(validateDomain("http://orderking.in"), false); // contains protocol
  });
});

test("Go-Live Diagnostic Readiness Engine", async (t) => {
  await t.test("evaluates default config as PILOT_READY or PRODUCTION_READY with zero critical blockers", () => {
    const report = evaluateGoLiveReadiness(DEFAULT_GOLIVE_CONFIG);
    assert.equal(report.criticalBlockers.length, 0);
    assert.ok(report.overallScore >= 60, `Expected score >= 60, got ${report.overallScore}`);
    assert.ok(report.status === "PILOT_READY" || report.status === "PRODUCTION_READY");
    assert.equal(report.pillars.infrastructure.maxScore, 25);
    assert.equal(report.pillars.paymentGateway.maxScore, 30);
    assert.equal(report.pillars.communicationAndMaps.maxScore, 20);
    assert.equal(report.pillars.legalAndCompliance.maxScore, 25);
  });

  await t.test("detects missing credentials and flags NOT_READY with critical blockers", () => {
    const brokenConfig: MasterGoLiveConfig = {
      ...DEFAULT_GOLIVE_CONFIG,
      database: {
        ...DEFAULT_GOLIVE_CONFIG.database,
        connectionString: "invalid-url",
      },
      paymentGateway: {
        ...DEFAULT_GOLIVE_CONFIG.paymentGateway,
        apiKey: "",
        secretKey: "",
        webhookSecret: "",
      },
      legal: {
        ...DEFAULT_GOLIVE_CONFIG.legal,
        gstinNumber: "INVALID",
        fssaiLicenseNumber: "123",
      },
    };

    const report = evaluateGoLiveReadiness(brokenConfig);
    assert.equal(report.status, "NOT_READY");
    assert.ok(report.criticalBlockers.length >= 3);
    assert.equal(report.pillars.infrastructure.status, "BLOCKED");
    assert.equal(report.pillars.paymentGateway.status, "BLOCKED");
    assert.equal(report.pillars.legalAndCompliance.status, "BLOCKED");
  });
});

test("Capacity & Scaling Switchboard Enforcer", async (t) => {
  await t.test("allows orders within pilot district limits", () => {
    const check = enforceCapacityLimits(150, 10, 4.5, DEFAULT_GOLIVE_CONFIG);
    assert.equal(check.allowed, true);
  });

  await t.test("blocks orders when daily pilot order cap is exceeded", () => {
    const check = enforceCapacityLimits(500, 15, 3.2, DEFAULT_GOLIVE_CONFIG);
    assert.equal(check.allowed, false);
    assert.ok(check.reason?.includes("capacity limit"));
  });

  await t.test("blocks orders when delivery distance exceeds pilot radius", () => {
    const check = enforceCapacityLimits(50, 10, 15.5, DEFAULT_GOLIVE_CONFIG);
    assert.equal(check.allowed, false);
    assert.ok(check.reason?.includes("exceeds pilot district boundary"));
  });

  await t.test("blocks orders when emergency throttle is enabled", () => {
    const throttledConfig: MasterGoLiveConfig = {
      ...DEFAULT_GOLIVE_CONFIG,
      capacity: {
        ...DEFAULT_GOLIVE_CONFIG.capacity,
        emergencyThrottleEnabled: true,
      },
    };
    const check = enforceCapacityLimits(10, 5, 2.0, throttledConfig);
    assert.equal(check.allowed, false);
    assert.ok(check.reason?.includes("Emergency platform throttle"));
  });
});

test("Test Ping Runners (Deterministic Handshakes)", async (t) => {
  await t.test("executes database connection test", async () => {
    const res = await testDbConnection(DEFAULT_GOLIVE_CONFIG.database);
    assert.equal(res.ok, true);
    assert.ok(res.latencyMs > 0);
  });

  await t.test("executes payment gateway connection test", async () => {
    const res = await testPgConnection(DEFAULT_GOLIVE_CONFIG.paymentGateway);
    assert.equal(res.ok, true);
    assert.ok(res.latencyMs > 0);
  });

  await t.test("executes SMS gateway connection test", async () => {
    const res = await testSmsConnection(DEFAULT_GOLIVE_CONFIG.smsGateway);
    assert.equal(res.ok, true);
    assert.ok(res.latencyMs > 0);
  });

  await t.test("executes maps connection test", async () => {
    const res = await testMapsConnection(DEFAULT_GOLIVE_CONFIG.maps);
    assert.equal(res.ok, true);
    assert.ok(res.latencyMs > 0);
  });
});
