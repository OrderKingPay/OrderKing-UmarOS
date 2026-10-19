import { describe, it, expect } from "vitest";
import {
  INDIA_COMPLIANCE_RATES,
  calculateSection95GST,
  validateFSSAILicense,
  calculateIndianRiderPayout,
  reconcileRiderCodStatus,
  processRiderCashDeposit,
  getRiderMaxCashLimit,
  validatePackagingChargePolicy,
  calculateMerchantOrderSettlement,
  indiaMarketplaceEngine,
  TIER1_MARKETPLACE_COMMISSION_TIERS,
  INDIAN_STATE_CODES,
  CENTRAL_COMMISSION_TIERS,
  CENTRAL_COMMISSION_TIER_PERCENTAGES,
  validateIndianPAN,
  validateIndianBankIFSC,
  compileTPlus1DailyMerchantSettlement,
  generateStatutoryCreditNote,
} from "./india-marketplace-engine.ts";
import { toPaise, fromPaise } from "../money.ts";

describe("🇮🇳 India-Specific Marketplace, Tax & Regulatory Compliance Engine", () => {
  // ==========================================================================
  // 1. CGST SECTION 9(5) TAX CALCULATION & REPORTING
  // ==========================================================================
  describe("1. CGST Section 9(5) Tax Calculation Engine", () => {
    it("correctly calculates 5% GST payable by platform (ECO) without ITC on food orders", () => {
      // Order: ₹500 food order intrastate
      const foodPaise = toPaise(500); // 50,000 paise
      const result = calculateSection95GST({
        foodSubtotalPaise: foodPaise,
        isInterstate: false,
      });

      // 5% of ₹500 = ₹25 (2500 paise)
      // CGST (2.5%) = ₹12.50 (1250 paise), SGST (2.5%) = ₹12.50 (1250 paise)
      expect(result.netFoodTaxablePaise).toBe(50000);
      expect(result.foodGstPaise).toBe(2500);
      expect(result.lineItems.food.cgstPaise).toBe(1250);
      expect(result.lineItems.food.sgstPaise).toBe(1250);
      expect(result.lineItems.food.igstPaise).toBe(0);

      // Section 9(5) and ITC assertions
      expect(result.lineItems.food.isSection95).toBe(true);
      expect(result.lineItems.food.itcEligible).toBe(false);
      expect(result.lineItems.food.liabilityBearer).toBe("ECO_PLATFORM");
      expect(result.itcBlockedSec95TaxPaise).toBe(2500);
      expect(result.itcEligibleTaxPaise).toBe(0);

      // GSTR-3B Table 3.1.1(i) reporting
      expect(result.gstr3b.table3_1_1_i_taxableAmountPaise).toBe(50000);
      expect(result.gstr3b.table3_1_1_i_taxPayablePaise).toBe(2500);
    });

    it("correctly calculates 18% GST on platform convenience & delivery fee with ITC eligibility", () => {
      const result = calculateSection95GST({
        foodSubtotalPaise: toPaise(400),
        packagingChargePaise: toPaise(20),
        platformFeePaise: toPaise(10), // ₹10 convenience fee
        deliveryFeePaise: toPaise(30), // ₹30 delivery fee
        customerTipPaise: toPaise(20), // ₹20 tip
        isInterstate: false,
      });

      // Food (₹400) + Packaging (₹20) = ₹420 taxable @ 5% GST = ₹21.00 (2100 paise)
      expect(result.totalSec95TaxablePaise).toBe(42000);
      expect(result.totalSec95GstPaise).toBe(2100);
      expect(result.itcBlockedSec95TaxPaise).toBe(2100);

      // Platform fee (₹10) @ 18% = ₹1.80 (180 paise)
      // Delivery fee (₹30) @ 18% = ₹5.40 (540 paise)
      // Total Platform GST = ₹7.20 (720 paise)
      expect(result.platformFeeTaxablePaise).toBe(1000);
      expect(result.platformFeeGstPaise).toBe(180);
      expect(result.deliveryFeeTaxablePaise).toBe(3000);
      expect(result.deliveryFeeGstPaise).toBe(540);
      expect(result.totalPlatformGstPaise).toBe(720);

      // ITC eligibility on platform supplies
      expect(result.lineItems.platformFee.itcEligible).toBe(true);
      expect(result.lineItems.deliveryFee.itcEligible).toBe(true);
      expect(result.itcEligibleTaxPaise).toBe(720);

      // Tip is 0% tax pure pass-through
      expect(result.lineItems.tip.totalTaxPaise).toBe(0);
      expect(result.lineItems.tip.liabilityBearer).toBe("EXEMPT");

      // Customer total payable
      // Items + Packaging + Taxes + Fees + Tip = 420 + 21 + 10 + 1.80 + 30 + 5.40 + 20 = ₹508.20 (50820 paise)
      expect(result.totalTaxPaise).toBe(2820); // 2100 + 720
      expect(result.customerPayablePaise).toBe(50820);

      // GSTR-3B Table 3.1(a) reporting
      expect(result.gstr3b.table3_1_a_taxableAmountPaise).toBe(4000); // 1000 + 3000
      expect(result.gstr3b.table3_1_a_taxPayablePaise).toBe(720);
    });

    it("correctly handles interstate orders with 5% IGST on food and 18% IGST on services", () => {
      const result = calculateSection95GST({
        foodSubtotalPaise: toPaise(1000),
        platformFeePaise: toPaise(50),
        isInterstate: true,
      });

      expect(result.isInterstate).toBe(true);
      // Food 5% IGST = 5000 paise (CGST = 0, SGST = 0, IGST = 5000)
      expect(result.lineItems.food.cgstPaise).toBe(0);
      expect(result.lineItems.food.sgstPaise).toBe(0);
      expect(result.lineItems.food.igstPaise).toBe(5000);
      expect(result.foodGstPaise).toBe(5000);

      // Platform fee 18% IGST = 900 paise
      expect(result.lineItems.platformFee.cgstPaise).toBe(0);
      expect(result.lineItems.platformFee.sgstPaise).toBe(0);
      expect(result.lineItems.platformFee.igstPaise).toBe(900);
      expect(result.platformFeeGstPaise).toBe(900);
    });

    it("correctly accounts for merchant discounts reducing the taxable food value", () => {
      const result = calculateSection95GST({
        foodSubtotalPaise: toPaise(600),
        merchantDiscountPaise: toPaise(100), // ₹100 discount funded by restaurant
        platformDiscountPaise: toPaise(50), // ₹50 voucher funded by platform
        isInterstate: false,
      });

      // Net food taxable = ₹600 - ₹100 = ₹500
      expect(result.netFoodTaxablePaise).toBe(50000);
      // 5% GST on ₹500 = ₹25 (2500 paise)
      expect(result.foodGstPaise).toBe(2500);

      // Customer payable: (₹500 + ₹25 GST) - ₹50 platform discount = ₹475 (47500 paise)
      expect(result.customerPayablePaise).toBe(47500);
    });
  });

  // ==========================================================================
  // 2. FSSAI 14-DIGIT LICENSE & REGISTRATION VALIDATOR
  // ==========================================================================
  describe("2. FSSAI 14-Digit Food Safety License Validation", () => {
    it("validates a legitimate 14-digit FSSAI License (Type 1)", () => {
      // 1: License, 27: Maharashtra, 24: 2024, 001: Registrar, 001234: Unit
      const validLicense = "12724001001234";
      const result = validateFSSAILicense(validLicense);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.details).toBeDefined();
      expect(result.details?.registrationType).toBe("LICENSE");
      expect(result.details?.stateCode).toBe("27");
      expect(result.details?.stateName).toBe("Maharashtra");
      expect(result.details?.enrollmentYear).toBe(24);
      expect(result.details?.fullEnrollmentYear).toBe(2024);
      expect(result.details?.registrarCode).toBe("001");
      expect(result.details?.unitNumber).toBe("001234");
    });

    it("validates a legitimate 14-digit FSSAI Petty Registration (Type 2)", () => {
      // 2: Registration, 07: Delhi, 23: 2023, 005: Registrar, 009876: Unit
      const validReg = "20723005009876";
      const result = validateFSSAILicense(validReg);

      expect(result.isValid).toBe(true);
      expect(result.details?.registrationType).toBe("REGISTRATION");
      expect(result.details?.stateCode).toBe("07");
      expect(result.details?.stateName).toBe("Delhi");
      expect(result.details?.enrollmentYear).toBe(23);
      expect(result.details?.fullEnrollmentYear).toBe(2023);
    });

    it("rejects FSSAI license with incorrect digit count", () => {
      const tooShort = validateFSSAILicense("1272400100123"); // 13 digits
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.error).toContain("must be exactly 14 digits");

      const tooLong = validateFSSAILicense("127240010012345"); // 15 digits
      expect(tooLong.isValid).toBe(false);
      expect(tooLong.error).toContain("must be exactly 14 digits");
    });

    it("rejects FSSAI numbers with non-numeric characters", () => {
      const withAlpha = validateFSSAILicense("1272400100ABCD");
      expect(withAlpha.isValid).toBe(false);
      expect(withAlpha.error).toContain("must contain only numeric digits");
    });

    it("rejects invalid registration type digit (not 1 or 2)", () => {
      const invalidType = validateFSSAILicense("32724001001234");
      expect(invalidType.isValid).toBe(false);
      expect(invalidType.error).toContain("Invalid FSSAI registration type digit");
    });

    it("rejects invalid state code not present in Indian state registry", () => {
      // State 99 does not exist
      const invalidState = validateFSSAILicense("19924001001234");
      expect(invalidState.isValid).toBe(false);
      expect(invalidState.error).toContain("Invalid state code '99'");

      // State 00 does not exist
      const zeroState = validateFSSAILicense("10024001001234");
      expect(zeroState.isValid).toBe(false);
      expect(zeroState.error).toContain("Invalid state code '00'");
    });

    it("rejects invalid enrollment year outside valid regulation bounds", () => {
      // Year 05 (2005) - FSSAI Act licensing regulations began in 2011
      const tooOld = validateFSSAILicense("12705001001234");
      expect(tooOld.isValid).toBe(false);
      expect(tooOld.error).toContain("Invalid enrollment year '5'");

      // Year 35 (2035) - Far future
      const future = validateFSSAILicense("12735001001234");
      expect(future.isValid).toBe(false);
      expect(future.error).toContain("Invalid enrollment year '35'");
    });

    it("rejects registrar code of 000 or all zeroes unit serial number", () => {
      // Unit number all zeroes
      const zeroUnit = validateFSSAILicense("12724001000000");
      expect(zeroUnit.isValid).toBe(false);
      expect(zeroUnit.error).toContain("Unit serial number cannot be all zeroes");

      // Registrar 000
      const zeroRegistrar = validateFSSAILicense("12724000000123");
      expect(zeroRegistrar.isValid).toBe(false);
      expect(zeroRegistrar.error).toContain("Invalid registrar / authority code");
    });

    it("executes purely synchronously and deterministically without random or delays", () => {
      const start = Date.now();
      for (let i = 0; i < 500; i++) {
        validateFSSAILicense("12922001005544");
      }
      const elapsed = Date.now() - start;
      // 500 checks must execute within a few milliseconds, proving zero setTimeout delays
      expect(elapsed).toBeLessThan(100);
    });
  });

  // ==========================================================================
  // 3. DISTANCE-BAND RIDER PAYOUT ALGORITHM
  // ==========================================================================
  describe("3. Indian Distance-Band Rider Payout Engine", () => {
    it("pays base fee for orders within initial 2.5 km in Tier 1 Metros", () => {
      const payout = calculateIndianRiderPayout({
        distanceKm: 2.0,
        cityTier: "TIER_1",
      });

      expect(payout.baseFeePaise).toBe(3500); // ₹35 base
      expect(payout.totalDistancePayPaise).toBe(0); // 0 km extra
      expect(payout.rawFarePaise).toBe(3500);
      expect(payout.deliveryEarningsPaise).toBe(3500);
      expect(payout.totalPayoutPaise).toBe(3500);
    });

    it("computes tiered distance bands correctly (>3km @ ₹8/km, >6km @ ₹10/km, >10km @ ₹12/km)", () => {
      // 12 km trip in Tier 1
      const payout = calculateIndianRiderPayout({
        distanceKm: 12.0,
        cityTier: "TIER_1", // Base covers 0-2.5 km @ ₹35
      });

      expect(payout.baseFeePaise).toBe(3500); // ₹35.00
      // Band 2: 3.0 to 6.0 km = 3.0 km @ ₹8.00 = ₹24.00 (2400 paise)
      // Band 3: 6.0 to 10.0 km = 4.0 km @ ₹10.00 = ₹40.00 (4000 paise)
      // Band 4: 10.0 to 12.0 km = 2.0 km @ ₹12.00 = ₹24.00 (2400 paise)
      // Total distance pay = 2400 + 4000 + 2400 = 8800 paise (₹88.00)
      expect(payout.totalDistancePayPaise).toBe(8800);
      expect(payout.distanceBands.length).toBe(3);

      const band2 = payout.distanceBands.find((b) => b.ratePerKmPaise === 800);
      expect(band2?.billableKm).toBe(3);
      expect(band2?.payoutPaise).toBe(2400);

      const band3 = payout.distanceBands.find((b) => b.ratePerKmPaise === 1000);
      expect(band3?.billableKm).toBe(4);
      expect(band3?.payoutPaise).toBe(4000);

      const band4 = payout.distanceBands.find((b) => b.ratePerKmPaise === 1200);
      expect(band4?.billableKm).toBe(2);
      expect(band4?.payoutPaise).toBe(2400);

      // Base (₹35) + Distance (₹88) = ₹123.00 (12300 paise)
      expect(payout.deliveryEarningsPaise).toBe(12300);
    });

    it("compensates rider for restaurant waiting time after 5-minute grace period", () => {
      const payout = calculateIndianRiderPayout({
        distanceKm: 2.0,
        cityTier: "TIER_1",
        waitMinutes: 15, // 15 mins total wait
        graceWaitMinutes: 5, // 5 mins free
        waitPayRatePerMinPaise: 200, // ₹2.00/min
      });

      // 15 - 5 = 10 billable mins @ ₹2/min = ₹20 (2000 paise)
      expect(payout.waiting.totalWaitMinutes).toBe(15);
      expect(payout.waiting.graceMinutes).toBe(5);
      expect(payout.waiting.billableWaitMinutes).toBe(10);
      expect(payout.waiting.waitPayPaise).toBe(2000);

      // Base (₹35) + Wait (₹20) = ₹55 (5500 paise)
      expect(payout.deliveryEarningsPaise).toBe(5500);
    });

    it("applies rain surge bonus, night surge bonus, and peak multiplier", () => {
      const payout = calculateIndianRiderPayout({
        distanceKm: 2.0,
        cityTier: "TIER_1", // Base ₹35 (3500 paise)
        isRainSurge: true,
        rainSurgeBonusPaise: 2500, // ₹25 rain surge
        nightHour: 1, // 01:00 AM (Night window 23:00 to 06:00)
        nightSurgeBonusPaise: 2000, // ₹20 night allowance
        peakMultiplier: 1.2, // 20% peak boost on base (3500 * 0.2 = 700 paise)
      });

      expect(payout.surges.isRainSurge).toBe(true);
      expect(payout.surges.rainSurgeBonusPaise).toBe(2500);
      expect(payout.surges.isNightSurge).toBe(true);
      expect(payout.surges.nightSurgeBonusPaise).toBe(2000);
      expect(payout.surges.peakSurgeBoostPaise).toBe(700);
      expect(payout.surges.totalSurgePaise).toBe(5200); // 2500 + 2000 + 700

      // Base (3500) + Surges (5200) = 8700 paise (₹87.00)
      expect(payout.deliveryEarningsPaise).toBe(8700);
    });

    it("passes 100% of customer tip directly to rider without platform cut", () => {
      const payout = calculateIndianRiderPayout({
        distanceKm: 2.0,
        cityTier: "TIER_1",
        customerTipPaise: 5000, // ₹50 tip
      });

      expect(payout.customerTipPaise).toBe(5000);
      expect(payout.deliveryEarningsPaise).toBe(3500);
      expect(payout.totalPayoutPaise).toBe(8500); // 3500 + 5000
    });

    it("enforces statutory minimum floor in Tier 2 and Tier 3 cities", () => {
      const tier2 = calculateIndianRiderPayout({
        distanceKm: 1.0,
        cityTier: "TIER_2",
      });
      expect(tier2.baseFeePaise).toBe(3000);
      expect(tier2.deliveryEarningsPaise).toBeGreaterThanOrEqual(3000);

      const tier3 = calculateIndianRiderPayout({
        distanceKm: 1.0,
        cityTier: "TIER_3",
      });
      expect(tier3.baseFeePaise).toBe(2500);
      expect(tier3.deliveryEarningsPaise).toBeGreaterThanOrEqual(2500);
    });
  });

  // ==========================================================================
  // 4. CASH-ON-DELIVERY (COD) CASH-IN-HAND RECONCILIATION
  // ==========================================================================
  describe("4. COD Cash-In-Hand Limit Reconciliation Engine", () => {
    it("permits order assignment when cash-in-hand is comfortably below threshold", () => {
      const recon = reconcileRiderCodStatus({
        rider: {
          riderId: "RIDER-101",
          tier: "STANDARD",
          currentCashInHandPaise: 60000, // ₹600 in hand
        },
        incomingOrderCodAmountPaise: 40000, // ₹400 incoming order
      });

      expect(recon.maxCashLimitPaise).toBe(150000); // ₹1,500
      expect(recon.softLimitPaise).toBe(120000); // 80% = ₹1,200
      expect(recon.status).toBe("HEALTHY");
      expect(recon.canAcceptCodOrder).toBe(true);
      expect(recon.isBlocked).toBe(false);
      expect(recon.excessCashPaise).toBe(0);
      expect(recon.reminder).toBeUndefined();
    });

    it("triggers warning advisory when cash-in-hand approaches soft limit (>= 80%)", () => {
      const recon = reconcileRiderCodStatus({
        rider: {
          riderId: "RIDER-102",
          tier: "STANDARD",
          currentCashInHandPaise: 125000, // ₹1,250 in hand (limit ₹1,500)
        },
      });

      expect(recon.status).toBe("APPROACHING_LIMIT");
      expect(recon.canAcceptCodOrder).toBe(true);
      expect(recon.isBlocked).toBe(false);
      expect(recon.reminder).toBeDefined();
      expect(recon.reminder?.urgency).toBe("NORMAL");
      expect(recon.reminder?.headline).toContain("Cash-in-hand advisory");
    });

    it("rejects order assignment if incoming order would breach the hard limit", () => {
      const recon = reconcileRiderCodStatus({
        rider: {
          riderId: "RIDER-103",
          tier: "STANDARD",
          currentCashInHandPaise: 110000, // ₹1,100 in hand
        },
        incomingOrderCodAmountPaise: 50000, // ₹500 order -> Projected = ₹1,600 > ₹1,500 limit
      });

      expect(recon.canAcceptCodOrder).toBe(false);
      expect(recon.projectedCashInHandPaise).toBe(160000);
      expect(recon.reminder).toBeDefined();
      expect(recon.reminder?.urgency).toBe("HIGH");
      expect(recon.reminder?.headline).toContain("Cannot accept order");
    });

    it("blocks rider from receiving COD orders when cash in hand exceeds threshold", () => {
      const recon = reconcileRiderCodStatus({
        rider: {
          riderId: "RIDER-104",
          tier: "STANDARD",
          currentCashInHandPaise: 165000, // ₹1,650 in hand (> ₹1,500 limit)
        },
      });

      expect(recon.status).toBe("LIMIT_BREACHED_COD_BLOCKED");
      expect(recon.isBlocked).toBe(true);
      expect(recon.canAcceptCodOrder).toBe(false);
      expect(recon.excessCashPaise).toBe(15000); // ₹150 excess over max
      expect(recon.requiredDepositToUnblockPaise).toBe(45000); // ₹450 to reach soft limit
      expect(recon.reminder?.urgency).toBe("CRITICAL");
      expect(recon.reminder?.headline).toContain("COD BLOCKED");
      expect(recon.reminder?.settlementChannels).toContain("UPI Instant Deposit (KingPay QR / VPA)");
    });

    it("processes cash deposit settlement and automatically unblocks the rider", () => {
      const blockedRider = {
        riderId: "RIDER-105",
        tier: "STANDARD" as const,
        currentCashInHandPaise: 170000, // ₹1,700 (Blocked)
      };

      // Deposit ₹1,000 via UPI
      const depositResult = processRiderCashDeposit({
        rider: blockedRider,
        depositAmountPaise: 100000,
        transactionRef: "UPI-TXN-9876543210",
      });

      expect(depositResult.previousBalancePaise).toBe(170000);
      expect(depositResult.depositAmountPaise).toBe(100000);
      expect(depositResult.newBalancePaise).toBe(70000); // ₹700 remaining
      expect(depositResult.isUnblocked).toBe(true);
      expect(depositResult.reconciliation.status).toBe("HEALTHY");
      expect(depositResult.reconciliation.canAcceptCodOrder).toBe(true);
    });

    it("respects higher floating cash limits for verified and premium riders", () => {
      expect(getRiderMaxCashLimit("TRAINEE")).toBe(100000); // ₹1,000
      expect(getRiderMaxCashLimit("STANDARD")).toBe(150000); // ₹1,500
      expect(getRiderMaxCashLimit("VERIFIED")).toBe(300000); // ₹3,000
      expect(getRiderMaxCashLimit("PREMIUM")).toBe(500000); // ₹5,000

      // Verified rider with ₹2,000 cash in hand is healthy
      const verified = reconcileRiderCodStatus({
        rider: {
          riderId: "RIDER-VERIFIED",
          tier: "VERIFIED",
          currentCashInHandPaise: 200000,
        },
      });
      expect(verified.isBlocked).toBe(false);
      expect(verified.status).toBe("HEALTHY");
    });
  });

  // ==========================================================================
  // 5. 3-TIER COMMISSION & PACKAGING CHARGE POLICIES
  // ==========================================================================
  describe("5. 3-Tier Commission Matrix & Packaging Charge Policies", () => {
    it("applies Tier-1 marketplace standard 3-tier commission rates", () => {
      expect(TIER1_MARKETPLACE_COMMISSION_TIERS.TIER_1_STARTER.baseRateBps).toBe(1800); // 18%
      expect(TIER1_MARKETPLACE_COMMISSION_TIERS.TIER_2_STANDARD.baseRateBps).toBe(2200); // 22%
      expect(TIER1_MARKETPLACE_COMMISSION_TIERS.TIER_3_PREMIUM.baseRateBps).toBe(2500); // 25%
    });

    it("applies weekly order volume rebates with statutory 8% floor protection", () => {
      // Tier 2 baseline: 22% (2200 bps)
      // 350 weekly orders qualifies for -200 bps rebate -> 20% (2000 bps)
      const settlement = calculateMerchantOrderSettlement({
        foodGrossPaise: toPaise(1000),
        commissionTierLevel: "TIER_2_STANDARD",
        weeklyOrdersCount: 350,
      });

      expect(settlement.baseCommissionBps).toBe(2200);
      expect(settlement.volumeRebateBps).toBe(200);
      expect(settlement.effectiveCommissionBps).toBe(2000); // 20%
      expect(settlement.commissionAmountPaise).toBe(20000); // 20% of ₹1000 = ₹200 (20000 paise)
    });

    it("enforces statutory 8% minimum floor even with extreme discounts", () => {
      const floorEnforced = calculateMerchantOrderSettlement({
        foodGrossPaise: toPaise(1000),
        customCommissionBps: 900, // 9%
        weeklyOrdersCount: 500, // -300 bps discount would make it 6%
      });

      // Floor protects platform at 800 bps (8.00%)
      expect(floorEnforced.effectiveCommissionBps).toBe(800);
    });

    it("validates packaging charge compliance under CCPA / Consumer Protection rules", () => {
      // Order: ₹400 food, ₹30 packaging charge (2 items) -> Compliant (<= 10% of ₹400 = ₹40, <= ₹50)
      const compliant = validatePackagingChargePolicy({
        itemSubtotalPaise: toPaise(400),
        packagingChargePaise: toPaise(30),
        itemCount: 2,
      });

      expect(compliant.isCompliant).toBe(true);
      expect(compliant.excessPackagingPaise).toBe(0);
      expect(compliant.approvedPackagingPaise).toBe(3000);

      // Order: ₹200 food, ₹60 packaging charge -> Non-compliant! (10% of ₹200 is ₹20, max allowed ₹20)
      const nonCompliant = validatePackagingChargePolicy({
        itemSubtotalPaise: toPaise(200),
        packagingChargePaise: toPaise(60),
        itemCount: 2,
      });

      expect(nonCompliant.isCompliant).toBe(false);
      expect(nonCompliant.excessPackagingPaise).toBe(4000); // ₹40 excess
      expect(nonCompliant.approvedPackagingPaise).toBe(2000); // ₹20 approved
      expect(nonCompliant.violationReason).toContain("exceeds regulatory cap");
    });

    it("calculates complete merchant settlement statement with 18% GST on commission, 1% TCS, and 1% TDS", () => {
      // Order: ₹1,000 food gross, ₹50 packaging, ₹100 merchant discount
      // Net Taxable Food = ₹900 + ₹50 packaging = ₹950 total merchant sales (95,000 paise)
      // Commission: 20% on ₹950 = ₹190 (19,000 paise)
      // GST on Commission: 18% on ₹190 = ₹34.20 (3,420 paise)
      // TCS: 1% on ₹950 = ₹9.50 (950 paise)
      // TDS: 1% on ₹950 = ₹9.50 (950 paise)
      // Net Payout = 950 - (190 + 34.20 + 9.50 + 9.50) = 950 - 243.20 = ₹706.80 (70,680 paise)
      const settlement = calculateMerchantOrderSettlement({
        foodGrossPaise: toPaise(1000),
        packagingChargePaise: toPaise(50),
        merchantDiscountPaise: toPaise(100),
        customCommissionBps: 2000, // 20%
      });

      expect(settlement.totalMerchantTaxableSalesPaise).toBe(95000);
      expect(settlement.commissionAmountPaise).toBe(19000);
      expect(settlement.commissionGstPaise).toBe(3420);
      expect(settlement.tcsPaise).toBe(950);
      expect(settlement.tdsPaise).toBe(950);
      expect(settlement.netMerchantPayoutPaise).toBe(70680);
      expect(settlement.isReconciled).toBe(true);

      // Verify exact double-entry equation
      const totalDebits = settlement.netMerchantPayoutPaise + settlement.totalStatutoryDeductionsPaise;
      expect(totalDebits).toBe(settlement.totalMerchantTaxableSalesPaise);
    });
  });

  // ==========================================================================
  // 6. UNIFIED ENGINE SINGLETON FACADE
  // ==========================================================================
  describe("6. Unified IndiaMarketplaceEngine Facade", () => {
    it("exposes all capabilities seamlessly on the engine singleton", () => {
      // Test facade methods
      const gst = indiaMarketplaceEngine.calculateGST({ foodSubtotalPaise: 10000 });
      expect(gst.foodGstPaise).toBe(500);

      const fssai = indiaMarketplaceEngine.validateFSSAI("12724001001234");
      expect(fssai.isValid).toBe(true);

      const rider = indiaMarketplaceEngine.calculateRiderPayout({ distanceKm: 3.0 });
      expect(rider.totalPayoutPaise).toBeGreaterThan(0);

      const cod = indiaMarketplaceEngine.reconcileCod({
        rider: { riderId: "R-1", currentCashInHandPaise: 50000 },
      });
      expect(cod.canAcceptCodOrder).toBe(true);

      const pkg = indiaMarketplaceEngine.validatePackaging({
        itemSubtotalPaise: 20000,
        packagingChargePaise: 1000,
      });
      expect(pkg.isCompliant).toBe(true);

      const settlement = indiaMarketplaceEngine.calculateMerchantSettlement({
        foodGrossPaise: 50000,
      });
      expect(settlement.isReconciled).toBe(true);
    });
  });

  // ==========================================================================
  // 7. CENTRAL COMMISSION RATE TIERS & STATUTORY TAX INVARIANTS
  // ==========================================================================
  describe("7. Central Commission Rate Tiers (0%, 3%, 5%, 8%, 12%, 18%) & Statutory Tax Policies", () => {
    it("verifies all 6 Central commission rate tiers exist with exact bps and statutory categories", () => {
      expect(CENTRAL_COMMISSION_TIER_PERCENTAGES).toEqual([0, 3, 5, 8, 12, 18]);
      expect(CENTRAL_COMMISSION_TIERS).toHaveLength(6);

      const expectedTiers = [
        { pct: 0, bps: 0, category: "DINE_IN" },
        { pct: 3, bps: 300, category: "ESSENTIAL" },
        { pct: 5, bps: 500, category: "HYPERLOCAL" },
        { pct: 8, bps: 800, category: "STATUTORY_FLOOR" },
        { pct: 12, bps: 1200, category: "STANDARD" },
        { pct: 18, bps: 1800, category: "ENTERPRISE" },
      ];

      expectedTiers.forEach((expected, idx) => {
        const tier = CENTRAL_COMMISSION_TIERS[idx];
        expect(tier.pct).toBe(expected.pct);
        expect(tier.bps).toBe(expected.bps);
        expect(tier.category).toBe(expected.category);
        expect(tier.label).toBeTruthy();
        expect(tier.description).toBeTruthy();
      });
    });

    it("verifies statutory tax policies: Section 9(5) 5% Food GST, SAC 9985 18% marketplace GST, Section 52 TCS, Section 194-O TDS", () => {
      // 1. Section 9(5) Food GST: 5% (500 bps = 250 CGST + 250 SGST)
      expect(INDIA_COMPLIANCE_RATES.FOOD_GST_BPS).toBe(500);
      expect(INDIA_COMPLIANCE_RATES.FOOD_CGST_BPS).toBe(250);
      expect(INDIA_COMPLIANCE_RATES.FOOD_SGST_BPS).toBe(250);
      expect(INDIA_COMPLIANCE_RATES.FOOD_IGST_BPS).toBe(500);

      // 2. SAC 9985 / 9983 Platform Fee GST: 18% (1800 bps = 900 CGST + 900 SGST)
      expect(INDIA_COMPLIANCE_RATES.PLATFORM_FEE_GST_BPS).toBe(1800);
      expect(INDIA_COMPLIANCE_RATES.PLATFORM_FEE_CGST_BPS).toBe(900);
      expect(INDIA_COMPLIANCE_RATES.PLATFORM_FEE_SGST_BPS).toBe(900);
      expect(INDIA_COMPLIANCE_RATES.PLATFORM_FEE_IGST_BPS).toBe(1800);

      // 3. SAC 9968 Delivery Fee GST: 18% (1800 bps)
      expect(INDIA_COMPLIANCE_RATES.DELIVERY_FEE_GST_BPS).toBe(1800);

      // 4. Section 52 TCS: 1% (100 bps = 50 CGST + 50 SGST)
      expect(INDIA_COMPLIANCE_RATES.TCS_BPS).toBe(100);
      expect(INDIA_COMPLIANCE_RATES.TCS_CGST_BPS).toBe(50);
      expect(INDIA_COMPLIANCE_RATES.TCS_SGST_BPS).toBe(50);
      expect(INDIA_COMPLIANCE_RATES.TCS_IGST_BPS).toBe(100);

      // 5. Section 194-O TDS: 1% (100 bps)
      expect(INDIA_COMPLIANCE_RATES.TDS_BPS).toBe(100);

      // 6. Statutory Floor: 8% (800 bps)
      expect(INDIA_COMPLIANCE_RATES.MIN_COMMISSION_BPS).toBe(800);
    });
  });

  // ==========================================================================
  // 6. STATUTORY ONBOARDING VALIDATION: PAN & BANK IFSC
  // ==========================================================================
  describe("6. Statutory Onboarding Validation: PAN & Bank IFSC", () => {
    it("validates 10-character PAN format and identifies entity type", () => {
      // Individual / Proprietor PAN
      const indPan = validateIndianPAN("ABCDE1234F");
      expect(indPan.isValid).toBe(true);
      expect(indPan.entityType).toContain("Individual");

      // Company PAN
      const coPan = validateIndianPAN("AAACC5678G");
      expect(coPan.isValid).toBe(true);
      expect(coPan.entityType).toContain("Company");

      // Invalid PANs
      expect(validateIndianPAN("INVALID").isValid).toBe(false);
      expect(validateIndianPAN("12345ABCDE").isValid).toBe(false);
      expect(validateIndianPAN("").isValid).toBe(false);

      // Class method check
      expect(indiaMarketplaceEngine.validatePAN("ABCDE1234F").isValid).toBe(true);
    });

    it("validates 11-character Bank IFSC format and extracts bank code", () => {
      const validIfsc = validateIndianBankIFSC("HDFC0001234");
      expect(validIfsc.isValid).toBe(true);
      expect(validIfsc.bankCode).toBe("HDFC");
      expect(validIfsc.branchCode).toBe("001234");

      // Invalid IFSCs
      expect(validateIndianBankIFSC("HDFC1234").isValid).toBe(false); // Length != 11
      expect(validateIndianBankIFSC("HDFC1001234").isValid).toBe(false); // 5th char not '0'
      expect(validateIndianBankIFSC("").isValid).toBe(false);

      // Class method check
      expect(indiaMarketplaceEngine.validateIFSC("SBIN0000456").isValid).toBe(true);
    });
  });

  // ==========================================================================
  // 7. T+1 DAILY MERCHANT SETTLEMENT (MIDNIGHT CUTOFF TO 10:00 AM DISPATCH)
  // ==========================================================================
  describe("7. T+1 Daily Merchant Settlement Engine", () => {
    it("compiles orders completed up to 12:00 Midnight and schedules payout for 10:00 AM next morning", () => {
      const orderDate = "2026-10-18";
      const batch = compileTPlus1DailyMerchantSettlement({
        restaurantId: "rest_bikanervala_01",
        restaurantName: "Bikanervala Sweets",
        bankAccountMasked: "HDFC-XXXX-5521",
        ifscCode: "HDFC0001234",
        orderDate,
        orders: [
          {
            orderId: "ord_1",
            foodValuePaise: 40000, // ₹400
            packingPaise: 2000, // ₹20
            restaurantDiscountPaise: 2000, // ₹20
            commissionBps: 1800, // 18%
            completedAt: "2026-10-18T14:30:00Z",
          },
          {
            orderId: "ord_2",
            foodValuePaise: 60000, // ₹600
            packingPaise: 3000, // ₹30
            restaurantDiscountPaise: 0,
            commissionBps: 1800, // 18%
            completedAt: "2026-10-18T23:58:00Z", // Just before 12:00 Midnight
          },
        ],
      });

      expect(batch.orderDate).toBe("2026-10-18");
      expect(batch.cutoffTimestamp).toBe("2026-10-18T23:59:59.999+05:30"); // 12:00 Midnight IST
      expect(batch.scheduledPayoutDate).toBe("2026-10-19"); // Day T+1
      expect(batch.scheduledPayoutTime).toBe("10:00 AM");
      expect(batch.scheduledPayoutTimestamp).toBe("2026-10-19T10:00:00.000+05:30");
      expect(batch.status).toBe("SCHEDULED_FOR_10AM_PAYOUT");
      expect(batch.isMidnightCompiled).toBe(true);
      expect(batch.ordersCount).toBe(2);

      // Gross sales = 42000 + 63000 = 105000 paise
      expect(batch.totalGrossSalesPaise).toBe(105000);
      // Net taxable supply = 40000 + 63000 = 103000 paise
      expect(batch.totalNetTaxableSupplyPaise).toBe(103000);

      // Section 52 TCS = 1% of 103,000 = 1030 paise
      expect(batch.totalTcsSection52Paise).toBe(1030);
      // Section 194-O TDS = 1% of 105,000 = 1050 paise
      expect(batch.totalTdsSection194OPaise).toBe(1050);

      expect(batch.netPayablePaise).toBeGreaterThan(0);
      expect(batch.netPayablePaise + batch.totalDeductionsPaise).toBe(batch.totalNetTaxableSupplyPaise);

      // Engine class integration test
      const engineBatch = indiaMarketplaceEngine.compileTPlus1Settlement({
        restaurantId: "rest_test",
        restaurantName: "Test Kitchen",
        orders: [],
      });
      expect(engineBatch.scheduledPayoutTime).toBe("10:00 AM");
    });
  });

  // ==========================================================================
  // 8. AUTOMATED STATUTORY CREDIT NOTE GENERATOR (SECTION 34 CGST ACT)
  // ==========================================================================
  describe("8. Automated Statutory Credit Note Generator (Section 34 CGST Act)", () => {
    it("generates GST credit note for order cancellation and adjusts tax withholdings", () => {
      const cn = generateStatutoryCreditNote({
        originalInvoiceNumber: "INV-202610-11223",
        originalOrderId: "ord_cancel_77",
        restaurantId: "rest_behrouz_01",
        reasonCode: "05_ORDER_CANCELLED",
        reasonDescription: "Kitchen stockout cancellation",
        taxableAmountPaise: 40000, // ₹400
      });

      expect(cn.creditNoteNumber).toMatch(/^CN-\d{6}-\d{6}$/);
      expect(cn.statutoryBasis).toContain("Section 34");
      expect(cn.reasonCode).toBe("05_ORDER_CANCELLED");
      expect(cn.taxableAmountPaise).toBe(40000);
      expect(cn.cgstPaise).toBe(3600); // 9% CGST
      expect(cn.sgstPaise).toBe(3600); // 9% SGST
      expect(cn.totalGstPaise).toBe(7200); // 18% GST reversal
      expect(cn.totalCreditNoteAmountPaise).toBe(47200);
      expect(cn.tcsReversalPaise).toBe(400); // 1% TCS reversal
      expect(cn.tdsAdjustmentPaise).toBe(400); // 1% TDS adjustment
      expect(cn.digitalSignatureRef).toContain("DSC-OK-ECO-");

      // Engine class integration
      const engineCn = indiaMarketplaceEngine.generateCreditNote({
        originalInvoiceNumber: "INV-100",
        originalOrderId: "ord_100",
        restaurantId: "rest_100",
        reasonCode: "01_SALES_RETURN",
        reasonDescription: "Return",
        taxableAmountPaise: 10000,
      });
      expect(engineCn.reasonCode).toBe("01_SALES_RETURN");
    });
  });
});
