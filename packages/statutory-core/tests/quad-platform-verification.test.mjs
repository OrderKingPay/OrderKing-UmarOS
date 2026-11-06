/**
 * Phase 4: Rigorous Quad-Platform Verification Suite (quad-platform-verification.test.mjs)
 * Entity: Orderkingpay | GSTIN: 18AFXPH9838M1Z9 (Assam - 788710)
 * Executes 100% deterministic assertions with Node.js built-in test runner (0 skipped tests).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  normalizeIndianPhone,
  MultiCarrierSmsDispatcher,
} from '../src/sms-gateway.ts';

import {
  validateAndComputeLineItemSnapshot,
  getShiftGeofenceRadiusKm,
  computeHaversineDistanceKm,
  QuadPartyOrderSyncEngine,
} from '../src/quad-party-order-sync.ts';

import {
  MANDATORY_OUT_OF_COVERAGE_NOTICE,
  TOP_CACHED_FLIGHT_CORRIDORS,
  PLACEMENT_EDTECH_OFFERS,
} from '../src/out-of-coverage-kingpay-constants.ts';

import {
  multiplyBasisPointsPaise,
  verifyMerchantFssaiCompliance,
  computeStatutoryOrderSettlement,
  encryptSensitivePiiAes256Gcm,
  decryptSensitivePiiAes256Gcm,
  enforceDataRetentionPolicies,
} from '../src/statutory-tax-settlement-engine.ts';

const sha256 = (plain) => crypto.createHash('sha256').update(plain).digest('hex');

test('1. Full Quad-Party Order Lifecycle State Machine & Illegal Transition Guard', () => {
  const engine = new QuadPartyOrderSyncEngine(sha256);

  const lineItem = validateAndComputeLineItemSnapshot(
    'ITEM-PIZZA-01',
    'Assam Bhut Jolokia Smoked Chicken Pizza',
    2,
    34900, // ₹349.00 in paise
    [
      {
        groupId: 'GRP-SIZE',
        groupName: 'Size',
        required: true,
        minSelect: 1,
        maxSelect: 1,
        selectedOptions: [{ optionId: 'OPT-MED', label: 'Medium (10 inch)', priceDeltaPaise: 10000 }],
      },
      {
        groupId: 'GRP-CRUST',
        groupName: 'Crust',
        required: true,
        minSelect: 1,
        maxSelect: 1,
        selectedOptions: [{ optionId: 'OPT-CHEESE', label: 'Cheese Burst', priceDeltaPaise: 7500 }],
      },
    ]
  );

  // (34900 + 10000 + 7500) * 2 = 52400 * 2 = 104800 paise (₹1,048.00)
  assert.equal(lineItem.lineTotalPaise, 104800);

  const otpPlain = '4829';
  engine.registerOrder({
    orderId: 'ORD-2026-9001',
    orderNumber: 'OK-9001',
    customerId: 'CUST-101',
    merchantId: 'MERCH-ASSAM-01',
    merchantFssaiNumber: '10324001000492',
    riderId: null,
    status: 'PLACED',
    prepTimeMinutes: null,
    rejectionReason: null,
    deliveryOtpHash: sha256(otpPlain),
    deliveryOtpVerified: false,
    itemsSnapshot: [lineItem],
    foodSubtotalPaise: 104800,
    packagingFeePaise: 3000,
    deliveryFeePaise: 4500,
    surgeFeePaise: 1500,
    riderBasePayoutPaise: 3800,
    riderSurgeIncentivePaise: 1200,
    customerTotalPaidPaise: 119190,
    deliveredLat: null,
    deliveredLng: null,
    updatedAtIso: new Date().toISOString(),
  });

  // Illegal jump from PLACED directly to DELIVERED must throw
  assert.throws(
    () => engine.markOrderOutForDelivery('ORD-2026-9001'),
    /RIDER_NOT_ASSIGNED/
  );

  // Step 1: KDS 1-tap accept with 25m timer
  const accepted = engine.kitchenAcceptOrder('ORD-2026-9001', 25);
  assert.equal(accepted.status, 'ACCEPTED');
  assert.equal(accepted.prepTimeMinutes, 25);

  // Step 2: Kitchen marks READY_FOR_PICKUP
  const ready = engine.markFoodReadyForPickup('ORD-2026-9001');
  assert.equal(ready.status, 'READY_FOR_PICKUP');

  // Step 3: Rider assignment within Day Shift (12.0 km radius)
  // 10:30 IST = 05:00 UTC
  const dayShiftUtc = new Date('2026-11-06T05:00:00.000Z');
  const match = engine.matchAndAssignNearestRider(
    'ORD-2026-9001',
    24.8672,
    92.3558, // Karimganj restaurant
    [
      {
        riderId: 'RIDER-FAR-99',
        name: 'Bikram Das',
        lat: 24.9950,
        lng: 92.5000,
        isOnline: true,
        activeOrderCount: 0,
        walletBalancePaise: 0,
      },
      {
        riderId: 'RIDER-NEAR-07',
        name: 'Rafiqul Islam',
        lat: 24.8725,
        lng: 92.3612,
        isOnline: true,
        activeOrderCount: 0,
        walletBalancePaise: 0,
      },
    ],
    dayShiftUtc
  );

  assert.equal(match.order.status, 'RIDER_ASSIGNED');
  assert.equal(match.assignedRider.riderId, 'RIDER-NEAR-07');
  assert.equal(match.shiftPolicy.shiftName, 'DAY_SHIFT');
  assert.equal(match.shiftPolicy.maxRadiusKm, 12.0);
  assert.equal(match.countdownWindowSeconds, 30);

  // Step 4: Rider picks up order -> OUT_FOR_DELIVERY
  const outForDelivery = engine.markOrderOutForDelivery('ORD-2026-9001');
  assert.equal(outForDelivery.status, 'OUT_FOR_DELIVERY');
});

test('2. Doorstep 4-Digit OTP Lock Verification & Rider Wallet Credit', () => {
  const engine = new QuadPartyOrderSyncEngine(sha256);
  const correctOtp = '7391';

  engine.registerOrder({
    orderId: 'ORD-2026-9002',
    orderNumber: 'OK-9002',
    customerId: 'CUST-102',
    merchantId: 'MERCH-ASSAM-01',
    merchantFssaiNumber: '10324001000492',
    riderId: 'RIDER-NEAR-07',
    status: 'OUT_FOR_DELIVERY',
    prepTimeMinutes: 15,
    rejectionReason: null,
    deliveryOtpHash: sha256(correctOtp),
    deliveryOtpVerified: false,
    itemsSnapshot: [],
    foodSubtotalPaise: 50000,
    packagingFeePaise: 2000,
    deliveryFeePaise: 4000,
    surgeFeePaise: 1000,
    riderBasePayoutPaise: 3500,
    riderSurgeIncentivePaise: 1000,
    customerTotalPaidPaise: 59600,
    deliveredLat: null,
    deliveredLng: null,
    updatedAtIso: new Date().toISOString(),
  });

  // Attempt with WRONG 4-digit OTP -> Must throw and keep order locked in OUT_FOR_DELIVERY
  assert.throws(
    () => engine.verifyDoorstepOtpAndCompleteDelivery('ORD-2026-9002', '0000', 24.8751, 92.3640),
    /DOORSTEP_OTP_MISMATCH/
  );

  const lockedOrder = engine.getOrder('ORD-2026-9002');
  assert.equal(lockedOrder.status, 'OUT_FOR_DELIVERY');
  assert.equal(lockedOrder.deliveryOtpVerified, false);
  assert.equal(engine.getRiderWalletBalancePaise('RIDER-NEAR-07'), 0);

  // Attempt with VALID 4-digit OTP -> Transitions to DELIVERED & credits rider wallet (3500 + 1000 = 4500 paise)
  const completed = engine.verifyDoorstepOtpAndCompleteDelivery('ORD-2026-9002', '7391', 24.8751, 92.3640);
  assert.equal(completed.order.status, 'DELIVERED');
  assert.equal(completed.order.deliveryOtpVerified, true);
  assert.equal(completed.order.deliveredLat, 24.8751);
  assert.equal(completed.order.deliveredLng, 92.3640);
  assert.equal(completed.riderPayoutCreditedPaise, 4500);
  assert.equal(completed.newRiderWalletBalancePaise, 4500);
});

test('3. Integer-Paise Statutory Tax & Merchant T+1 Settlement Conservation Law (0 Paise Variance)', () => {
  const now = new Date('2026-11-06T12:00:00.000Z');
  const settlement = computeStatutoryOrderSettlement(
    {
      orderId: 'ORD-2026-9003',
      merchantId: 'MERCH-ASSAM-01',
      merchantFssaiNumber: '10324001000492',
      merchantFssaiValidUntilIso: '2028-12-31T23:59:59.000Z',
      foodSubtotalPaise: 100000, // ₹1,000.00
      packagingFeePaise: 5000,   // ₹50.00 -> Gross Merchant Supply = 105000 paise (₹1,050.00)
      deliveryFeePaise: 4000,    // ₹40.00
      surgeFeePaise: 1000,       // ₹10.00
      platformCommissionBps: 1800, // 18.00%
      paymentGatewayFeeBps: 200,   // 2.00%
      riderBasePayoutPaise: 3500,
      riderSurgeIncentivePaise: 1000,
    },
    now
  );

  // Verify exact integer paise calculations:
  // Gross Merchant Supply = 105000 paise
  assert.equal(settlement.grossMerchantSupplyPaise, 105000);

  // Sec 9(5) CGST @ 2.5% = 2625 paise; SGST @ 2.5% = 2625 paise; Total = 5250 paise
  assert.equal(settlement.sec95CgstPaise, 2625);
  assert.equal(settlement.sec95SgstPaise, 2625);
  assert.equal(settlement.sec95TotalGstPaise, 5250);

  // Customer Total Collected = 105000 + 5250 + 4000 + 1000 = 115250 paise (₹1,152.50)
  assert.equal(settlement.customerTotalCollectedPaise, 115250);

  // Platform Commission @ 18% of 105000 = 18900 paise
  assert.equal(settlement.platformCommissionPaise, 18900);

  // 18% GST on Platform Commission (18% of 18900) = 3402 paise
  assert.equal(settlement.gstOnCommissionPaise, 3402);

  // Sec 194-O TDS @ 0.1% of 105000 = 105 paise
  assert.equal(settlement.tdsSec194OPaise, 105);

  // Sec 52 GST TCS @ 1.0% of 105000 = 1050 paise
  assert.equal(settlement.tcsSec52Paise, 1050);

  // Payment Gateway Fee @ 2.0% of 115250 = 2305 paise
  assert.equal(settlement.paymentGatewayFeePaise, 2305);

  // Merchant Net Payable = 105000 - (18900 + 3402 + 105 + 1050 + 2305) = 79238 paise
  assert.equal(settlement.merchantNetPayablePaise, 79238);
  assert.equal(settlement.doubleEntryBalanced, true);
  assert.equal(settlement.tPlusOneSettlementDate, '2026-11-07');

  // Conservation Check: Customer Total Paid == Net Restaurant Payout + Platform Commission + 18% GST on Commission + 5% Food GST + TDS + TCS + PG Fee + Rider Payout + Delivery Margin Contribution
  const deliveryMarginContributionPaise = (4000 + 1000) - settlement.riderTotalPayoutPaise;
  const reconstructedTotalPaise =
    settlement.merchantNetPayablePaise +
    settlement.platformCommissionPaise +
    settlement.gstOnCommissionPaise +
    settlement.sec95TotalGstPaise +
    settlement.tdsSec194OPaise +
    settlement.tcsSec52Paise +
    settlement.paymentGatewayFeePaise +
    settlement.riderTotalPayoutPaise +
    deliveryMarginContributionPaise;

  assert.equal(reconstructedTotalPaise, settlement.customerTotalCollectedPaise);

  // Floating-point input must be strictly rejected
  assert.throws(
    () =>
      computeStatutoryOrderSettlement({
        orderId: 'ORD-FLOAT-ERR',
        merchantId: 'MERCH-ASSAM-01',
        merchantFssaiNumber: '10324001000492',
        merchantFssaiValidUntilIso: '2028-12-31T23:59:59.000Z',
        foodSubtotalPaise: 199.99,
        packagingFeePaise: 1000,
        deliveryFeePaise: 2000,
        surgeFeePaise: 0,
        platformCommissionBps: 1800,
        riderBasePayoutPaise: 2000,
        riderSurgeIncentivePaise: 0,
      }),
    /NON_INTEGER_PAISE_REJECTED/
  );
});

test('4. 14-Digit FSSAI Format Validation & Expired License Storefront Blocking', () => {
  const refDate = new Date('2026-11-06T00:00:00.000Z');

  // Valid 14-digit license starting with 1
  const valid = verifyMerchantFssaiCompliance('10324001000492', '2027-05-01T00:00:00.000Z', refDate);
  assert.equal(valid.isValidFormat, true);
  assert.equal(valid.isExpired, false);
  assert.equal(valid.canAcceptOrders, true);

  // Invalid format (12 digits or starting with 9)
  const invalidFmt = verifyMerchantFssaiCompliance('99912345678901', '2027-05-01T00:00:00.000Z', refDate);
  assert.equal(invalidFmt.isValidFormat, false);
  assert.equal(invalidFmt.canAcceptOrders, false);

  // Expired 14-digit FSSAI license -> Must block order settlement/acceptance
  const expired = verifyMerchantFssaiCompliance('20324001000492', '2025-12-31T23:59:59.000Z', refDate);
  assert.equal(expired.isValidFormat, true);
  assert.equal(expired.isExpired, true);
  assert.equal(expired.canAcceptOrders, false);

  assert.throws(
    () =>
      computeStatutoryOrderSettlement(
        {
          orderId: 'ORD-EXP-FSSAI',
          merchantId: 'MERCH-EXPIRED',
          merchantFssaiNumber: '20324001000492',
          merchantFssaiValidUntilIso: '2025-12-31T23:59:59.000Z',
          foodSubtotalPaise: 50000,
          packagingFeePaise: 1000,
          deliveryFeePaise: 3000,
          surgeFeePaise: 0,
          platformCommissionBps: 1800,
          riderBasePayoutPaise: 2500,
          riderSurgeIncentivePaise: 0,
        },
        refDate
      ),
    /FSSAI_COMPLIANCE_BLOCK/
  );
});

test('5. IST Shift-Based Geofence Radius Enforcement (12.0km Day, 7.5km Evening, 3.5km Late-Night)', () => {
  // 10:00 IST = 04:30 UTC -> DAY_SHIFT (12.0 km)
  const day = getShiftGeofenceRadiusKm(new Date('2026-11-06T04:30:00.000Z'));
  assert.equal(day.shiftName, 'DAY_SHIFT');
  assert.equal(day.maxRadiusKm, 12.0);

  // 20:00 IST = 14:30 UTC -> EVENING_SHIFT (7.5 km)
  const evening = getShiftGeofenceRadiusKm(new Date('2026-11-06T14:30:00.000Z'));
  assert.equal(evening.shiftName, 'EVENING_SHIFT');
  assert.equal(evening.maxRadiusKm, 7.5);

  // 01:30 IST = 20:00 UTC (previous day) -> LATE_NIGHT_SHIFT (3.5 km)
  const lateNight = getShiftGeofenceRadiusKm(new Date('2026-11-05T20:00:00.000Z'));
  assert.equal(lateNight.shiftName, 'LATE_NIGHT_SHIFT');
  assert.equal(lateNight.maxRadiusKm, 3.5);
});

test('6. Multi-Carrier SMS-Only Failover, Out-of-Coverage Invariant & DPDP AES-256-GCM Security', async () => {
  // Verify exact single-line out-of-coverage fallback string
  assert.equal(
    MANDATORY_OUT_OF_COVERAGE_NOTICE,
    'Food delivery is not available in your location, kindly update your location.'
  );

  assert.ok(TOP_CACHED_FLIGHT_CORRIDORS.every((c) => c.kvCacheLatencyMs < 50));
  assert.ok(
    PLACEMENT_EDTECH_OFFERS.every(
      (o) => o.affiliateCommissionPaise >= 250000 && o.affiliateCommissionPaise <= 750000
    )
  );

  // Simulate Fast2SMS HTTP 503 failure -> Automatic failover to 2Factor.in SMS-only endpoint
  const calledUrls = [];
  const simulatedFetch = async (url) => {
    calledUrls.push(String(url));
    if (String(url).includes('fast2sms.com')) {
      return { ok: false, status: 503, json: async () => ({ return: false }) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ Status: 'Success', Details: '2FACTOR-SMS-SESSION-99812' }),
    };
  };

  const smsDispatcher = new MultiCarrierSmsDispatcher(
    {
      fast2smsApiKey: 'f2s_live_key_assam',
      twoFactorApiKey: '2f_live_key_assam',
      senderId: 'ORDKNG',
      dltEntityId: '18AFXPH9838M1Z9',
      dltTemplateIdOtp: 'OrderKingOTP',
      dltTemplateIdTransactional: 'OrderKingTxn',
      primaryCarrier: 'FAST2SMS',
      timeoutMs: 3000,
    },
    simulatedFetch
  );

  const smsRes = await smsDispatcher.dispatchSms({
    recipientPhone: '+91 98640 12345',
    purpose: 'DELIVERY_DOORSTEP_OTP',
    otpCode: '4829',
    idempotencyKey: 'IDEMP-OTP-9001',
  });

  assert.equal(smsRes.success, true);
  assert.equal(smsRes.carrierUsed, 'TWOFACTOR');
  assert.equal(smsRes.failoverTriggered, true);
  assert.equal(smsRes.channelEnforced, 'SMS_ONLY_ZERO_VOICE');
  assert.ok(calledUrls[1].includes('/SMS/+919864012345/4829/'));
  assert.ok(!calledUrls.some((u) => u.toUpperCase().includes('VOICE')));

  // Verify AES-256-GCM Encryption & Decryption
  const keyHex = crypto.randomBytes(32).toString('hex');
  const secretBank = 'SBIN0000108|30981726351|Orderkingpay Escrow';
  const cipherPayload = encryptSensitivePiiAes256Gcm(secretBank, keyHex);
  assert.notEqual(cipherPayload, secretBank);

  const decrypted = decryptSensitivePiiAes256Gcm(cipherPayload, keyHex);
  assert.equal(decrypted, secretBank);

  // Verify DPDP 90-Day GPS Telemetry Auto-Purge vs 72-Month Financial Ledger Retention
  const now = new Date('2026-11-06T00:00:00.000Z');
  const retentionCheck = enforceDataRetentionPolicies(
    [
      { id: 1, recordType: 'GPS_TELEMETRY', recordedAtIso: '2026-06-01T00:00:00.000Z' }, // > 90 days old -> purged
      { id: 2, recordType: 'GPS_TELEMETRY', recordedAtIso: '2026-10-15T00:00:00.000Z' }, // < 90 days old -> retained
      { id: 3, recordType: 'FINANCIAL_LEDGER', recordedAtIso: '2024-01-01T00:00:00.000Z' }, // < 72 months -> retained
    ],
    now
  );

  assert.equal(retentionCheck.purgedCount, 1);
  assert.equal(retentionCheck.retained.length, 2);
});
