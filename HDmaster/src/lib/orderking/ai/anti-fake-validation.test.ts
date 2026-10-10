import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  militaryAntiFraudShield,
  type CryptographicOrderPayload,
  type RefundClaimPayload,
  type RiderGpsTelemetry
} from "../security/military-anti-fraud-shield.ts";
import {
  fetchUmarOsTelemetry,
  runFounderConsoleCommandCore,
  executeAutonomousRefundCore
} from "./umaros-supreme.server.ts";

test("Military Anti-Fraud Shield - Order Cryptographic Signature & Tamper Detection", () => {
  const customerId = `cust_${Date.now()}`;
  const orderPayload: CryptographicOrderPayload = {
    orderId: "ord_1001",
    customerId,
    restaurantId: "rst_01",
    totalPaise: 45000,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
    clientFingerprint: "fp_chrome_win11_ind"
  };

  const validSignature = militaryAntiFraudShield.createOrderSignature(orderPayload);
  assert.ok(validSignature.length === 64, "HMAC-SHA256 signature must be 64-char hex string");

  // 1. Valid signature passes
  const validRes = militaryAntiFraudShield.validateOrderIntegrity(orderPayload, validSignature, "103.21.244.1");
  assert.equal(validRes.valid, true, "Authentic order must pass cryptographic verification");
  assert.equal(validRes.code, "OK");

  // 2. Tampered payload is immediately intercepted
  const tamperedPayload: CryptographicOrderPayload = {
    ...orderPayload,
    totalPaise: 1000, // Attacker lowered price from ₹450 to ₹10
    nonce: crypto.randomBytes(16).toString("hex")
  };
  const tamperedRes = militaryAntiFraudShield.validateOrderIntegrity(tamperedPayload, validSignature, "103.21.244.2");
  assert.equal(tamperedRes.valid, false, "Tampered order must be rejected");
  assert.equal(tamperedRes.code, "SIGNATURE_VERIFICATION_FAILED");

  // 3. Forger entity is quarantined
  assert.equal(militaryAntiFraudShield.isQuarantined(tamperedPayload.customerId), true, "Tampering customer must be quarantined");
  assert.equal(militaryAntiFraudShield.isQuarantined("103.21.244.2"), true, "Tampering IP must be quarantined");

  // 4. Quarantined entity cannot place orders
  const blockedRes = militaryAntiFraudShield.validateOrderIntegrity(orderPayload, validSignature, "103.21.244.2");
  assert.equal(blockedRes.valid, false);
  assert.equal(blockedRes.code, "QUARANTINED");
});

test("Military Anti-Fraud Shield - Anti-Replay Nonce & Timestamp Skew", () => {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload: CryptographicOrderPayload = {
    orderId: "ord_replay_1",
    customerId: `cust_${Date.now()}`,
    restaurantId: "rst_01",
    totalPaise: 25000,
    timestamp: Date.now(),
    nonce
  };
  const sig = militaryAntiFraudShield.createOrderSignature(payload);

  // First consumption: success
  const first = militaryAntiFraudShield.validateOrderIntegrity(payload, sig);
  assert.equal(first.valid, true);

  // Second consumption with same nonce: REPLAY ATTACK BLOCKED
  const replay = militaryAntiFraudShield.validateOrderIntegrity(payload, sig);
  assert.equal(replay.valid, false);
  assert.equal(replay.code, "REPLAY_ATTACK_DETECTED");

  // Timestamp drift check (> 5 minutes in past)
  const expiredPayload: CryptographicOrderPayload = {
    ...payload,
    orderId: "ord_expired_1",
    timestamp: Date.now() - (10 * 60 * 1000), // 10 minutes ago
    nonce: crypto.randomBytes(16).toString("hex")
  };
  const expiredSig = militaryAntiFraudShield.createOrderSignature(expiredPayload);
  const expiredRes = militaryAntiFraudShield.validateOrderIntegrity(expiredPayload, expiredSig);
  assert.equal(expiredRes.valid, false);
  assert.equal(expiredRes.code, "TIMESTAMP_DRIFT_EXCEEDED");
});

test("Military Anti-Fraud Shield - Autonomous Refund Claim Validation & Sybil Photo Defense", () => {
  const customerId = `cust_refund_${Date.now()}`;
  const photoHash = crypto.createHash("sha256").update("sample_rotten_food_image_bytes_1").digest("hex");

  const claimPayload: RefundClaimPayload = {
    claimId: "clm_001",
    orderId: "ord_delivered_1",
    customerId,
    claimedAmountPaise: 35000,
    reason: "SPOILED_FOOD",
    proofPhotoHash: photoHash,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex")
  };

  const validSig = militaryAntiFraudShield.createRefundClaimSignature(claimPayload);

  // 1. Valid refund claim passes
  const validRes = militaryAntiFraudShield.validateRefundClaim(claimPayload, validSig, {
    orderTotalPaise: 35000,
    orderStatus: "DELIVERED",
    customerTrustScore: 92,
    existingRefundCount: 0,
    clientIp: "49.36.12.1",
    merchantIp: "103.50.11.2"
  });
  assert.equal(validRes.valid, true);
  assert.equal(validRes.code, "OK");

  // 2. Optical Proof Sybil / Recycled Photo Farming Attack
  // Attacker submits the exact same photo hash on a different order/claim
  const sybilClaim: RefundClaimPayload = {
    claimId: "clm_002",
    orderId: "ord_delivered_2",
    customerId: `cust_farmer_${Date.now()}`,
    claimedAmountPaise: 20000,
    reason: "SPOILED_FOOD",
    proofPhotoHash: photoHash, // Reused photo!
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex")
  };
  const sybilSig = militaryAntiFraudShield.createRefundClaimSignature(sybilClaim);
  const sybilRes = militaryAntiFraudShield.validateRefundClaim(sybilClaim, sybilSig, {
    orderTotalPaise: 20000,
    orderStatus: "DELIVERED",
    customerTrustScore: 88,
    existingRefundCount: 0
  });
  assert.equal(sybilRes.valid, false);
  assert.equal(sybilRes.code, "DUPLICATE_PROOF_FARMING_ATTEMPT");

  // 3. Double-Refund Protection
  const doubleClaim: RefundClaimPayload = {
    ...claimPayload,
    claimId: "clm_003",
    proofPhotoHash: crypto.randomBytes(32).toString("hex"),
    nonce: crypto.randomBytes(16).toString("hex")
  };
  const doubleSig = militaryAntiFraudShield.createRefundClaimSignature(doubleClaim);
  const doubleRes = militaryAntiFraudShield.validateRefundClaim(doubleClaim, doubleSig, {
    orderTotalPaise: 35000,
    orderStatus: "DELIVERED",
    customerTrustScore: 92,
    existingRefundCount: 1 // Already refunded!
  });
  assert.equal(doubleRes.valid, false);
  assert.equal(doubleRes.code, "DOUBLE_REFUND_BLOCKED");

  // 4. Merchant-Customer Collusion Detection
  const collusionClaim: RefundClaimPayload = {
    ...claimPayload,
    claimId: "clm_004",
    customerId: `cust_collusion_${Date.now()}`,
    proofPhotoHash: crypto.randomBytes(32).toString("hex"),
    nonce: crypto.randomBytes(16).toString("hex")
  };
  const collusionSig = militaryAntiFraudShield.createRefundClaimSignature(collusionClaim);
  const collusionRes = militaryAntiFraudShield.validateRefundClaim(collusionClaim, collusionSig, {
    orderTotalPaise: 35000,
    orderStatus: "DELIVERED",
    customerTrustScore: 95,
    existingRefundCount: 0,
    clientIp: "103.50.11.2",
    merchantIp: "103.50.11.2" // Same IP!
  });
  assert.equal(collusionRes.valid, false);
  assert.equal(collusionRes.code, "COLLUSION_DETECTED");

  // 5. Low Trust Score Gate (< 80)
  const untrustedClaim: RefundClaimPayload = {
    ...claimPayload,
    claimId: "clm_005",
    customerId: `cust_untrusted_${Date.now()}`,
    proofPhotoHash: crypto.randomBytes(32).toString("hex"),
    nonce: crypto.randomBytes(16).toString("hex")
  };
  const untrustedSig = militaryAntiFraudShield.createRefundClaimSignature(untrustedClaim);
  const untrustedRes = militaryAntiFraudShield.validateRefundClaim(untrustedClaim, untrustedSig, {
    orderTotalPaise: 35000,
    orderStatus: "DELIVERED",
    customerTrustScore: 65, // Below 80 cutoff
    existingRefundCount: 0
  });
  assert.equal(untrustedRes.valid, false);
  assert.equal(untrustedRes.code, "TRUST_SCORE_INSUFFICIENT");
});

test("Military Anti-Fraud Shield - Rider GPS Teleportation & Mock Spoofing", () => {
  const riderId = "rdr_silchar_01";

  // 1. Valid coordinates in Silchar, Assam (Lat ~24.8, Lng ~92.8)
  const validTelemetry: RiderGpsTelemetry = {
    riderId,
    lat: 24.8333,
    lng: 92.7789,
    timestamp: Date.now()
  };
  const validRes = militaryAntiFraudShield.validateRiderTelemetry(validTelemetry);
  assert.equal(validRes.valid, true);

  // 2. Mock GPS / Emulator flag
  const mockTelemetry: RiderGpsTelemetry = {
    riderId: "rdr_emulator_02",
    lat: 24.8333,
    lng: 92.7789,
    timestamp: Date.now(),
    isMockGps: true
  };
  const mockRes = militaryAntiFraudShield.validateRiderTelemetry(mockTelemetry);
  assert.equal(mockRes.valid, false);
  assert.equal(mockRes.code, "MOCK_GPS_DETECTED");

  // 3. Geofence Out-of-Bounds (e.g. 0.0, 0.0 or outside country)
  const oobTelemetry: RiderGpsTelemetry = {
    riderId: "rdr_nullisland_03",
    lat: 0.0,
    lng: 0.0,
    timestamp: Date.now()
  };
  const oobRes = militaryAntiFraudShield.validateRiderTelemetry(oobTelemetry);
  assert.equal(oobRes.valid, false);
  assert.equal(oobRes.code, "GEOFENCE_BREACH");

  // 4. GPS Teleportation (Impossible Speed: Silchar to Guwahati in 1 minute = > 1000 km/h)
  const teleportTelemetry: RiderGpsTelemetry = {
    riderId: "rdr_teleport_04",
    lastLat: 24.8333,
    lastLng: 92.7789,
    lastTimestamp: Date.now() - 60000, // 1 min ago
    lat: 26.1445, // Guwahati (~300 km away!)
    lng: 91.7362,
    timestamp: Date.now()
  };
  const teleportRes = militaryAntiFraudShield.validateRiderTelemetry(teleportTelemetry);
  assert.equal(teleportRes.valid, false);
  assert.equal(teleportRes.code, "GPS_TELEPORTATION_DETECTED");
});

test("Military Anti-Fraud Shield - Financial Circuit Breaker", () => {
  // Set low daily ceiling for testing
  militaryAntiFraudShield.setDailyLossCeilingInr(100); // ₹100 limit = 10,000 paise

  const claim: RefundClaimPayload = {
    claimId: `clm_circuit_${Date.now()}`,
    orderId: "ord_circuit_1",
    customerId: `cust_circuit_${Date.now()}`,
    claimedAmountPaise: 15000, // ₹150 > ₹100 limit
    reason: "DAMAGED_ITEMS",
    proofPhotoHash: crypto.randomBytes(32).toString("hex"),
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex")
  };
  const sig = militaryAntiFraudShield.createRefundClaimSignature(claim);

  const res = militaryAntiFraudShield.validateRefundClaim(claim, sig, {
    orderTotalPaise: 20000,
    orderStatus: "DELIVERED",
    customerTrustScore: 90,
    existingRefundCount: 0
  });

  assert.equal(res.valid, false);
  assert.equal(res.code, "CIRCUIT_BREAKER_TRIPPED");

  // Reset back to normal ₹5000 ceiling
  militaryAntiFraudShield.setDailyLossCeilingInr(5000);
});

test("UmarOS Supreme - Founder Console Security Commands & Telemetry Integration", async () => {
  // 1. /shield command
  const shieldCmdRes = await runFounderConsoleCommandCore({ command: "/shield" });
  assert.equal(shieldCmdRes.status, "SUCCESS");
  assert.equal(shieldCmdRes.toolExecuted, "audit_military_anti_fraud_shield");
  assert.ok(shieldCmdRes.data.totalExploitsBlocked >= 0);
  assert.ok(shieldCmdRes.response.includes("Military Shield Status:"));

  // 2. /refunds command with anti-fraud shield metrics
  const refundsCmdRes = await runFounderConsoleCommandCore({ command: "/refunds" });
  assert.equal(refundsCmdRes.status, "SUCCESS");
  assert.equal(refundsCmdRes.toolExecuted, "get_refunds_telemetry");
  assert.ok(refundsCmdRes.response.includes("Shield Defenses:"));
  assert.ok(refundsCmdRes.data.shield);

  // 3. fetchUmarOsTelemetry includes security shield audit
  const telemetry = await fetchUmarOsTelemetry();
  assert.ok(telemetry.securityShield);
  assert.equal(typeof telemetry.securityShield.totalExploitsBlocked, "number");
  assert.ok(telemetry.securityShield.status === "ARMED_AND_ACTIVE" || telemetry.securityShield.status === "LOCKDOWN");

  // 4. executeAutonomousRefundCore blocks forged claims
  const fakeClaim: RefundClaimPayload = {
    claimId: "clm_fake_001",
    orderId: "ord_fake_1",
    customerId: "cust_attacker",
    claimedAmountPaise: 50000,
    reason: "FRAUD",
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex")
  };
  const fakeExecution = await executeAutonomousRefundCore({
    claim: fakeClaim,
    signature: "invalid_forged_signature_00000000000000000000000000000000000000000000"
  });
  assert.equal(fakeExecution.ok, false);
  assert.equal(fakeExecution.status, "REJECTED");
  assert.equal(fakeExecution.code, "SIGNATURE_VERIFICATION_FAILED");
});
