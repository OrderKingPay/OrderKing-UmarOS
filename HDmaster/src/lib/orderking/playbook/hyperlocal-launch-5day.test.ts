import { describe, it, expect } from "vitest";
import {
  DEFAULT_CLUSTER_CONFIG,
  FIVE_DAY_CUMULATIVE_QUOTAS,
  COMMERCIAL_TIERS,
  RESTAURANT_WALK_IN_SCRIPT,
  OBJECTION_COUNTERS,
  RIDER_RECRUITMENT_CONFIG,
  CUSTOMER_LAUNCH_PLAN,
  FIVE_DAY_STREET_TIMETABLE,
  LAUNCH_CASH_ENVELOPE,
  calculateLaunchEconomics,
  calculateRiderShiftPayout,
  compareMerchantNetPayout,
  formatPaiseToInr,
  formatInrWhole,
} from "./hyperlocal-launch-5day";

describe("5-Day Hyperlocal Launch Playbook & Economics Engine", () => {
  describe("Cluster Configuration & Ground Targets", () => {
    it("should match exact ground targets of 20 restaurants, 15 riders, and 500 customer leads", () => {
      expect(DEFAULT_CLUSTER_CONFIG.targetRestaurants).toBe(20);
      expect(DEFAULT_CLUSTER_CONFIG.targetRiders).toBe(15);
      expect(DEFAULT_CLUSTER_CONFIG.targetCustomerLeads).toBe(500);
      expect(DEFAULT_CLUSTER_CONFIG.coreRadiusKm).toBe(1.0);
      expect(DEFAULT_CLUSTER_CONFIG.maxRadiusKm).toBe(3.5);
    });

    it("should enforce exact 5-day cumulative quotas progression from Astra 6 ground playbook", () => {
      expect(FIVE_DAY_CUMULATIVE_QUOTAS).toHaveLength(5);

      const [day1, day2, day3, day4, day5] = FIVE_DAY_CUMULATIVE_QUOTAS;
      
      // Day 1
      expect(day1.cumulativeRestaurants).toBe(3);
      expect(day1.cumulativeRiders).toBe(4);
      expect(day1.cumulativeCustomerLeads).toBe(40);

      // Day 2
      expect(day2.cumulativeRestaurants).toBe(7);
      expect(day2.cumulativeRiders).toBe(7);
      expect(day2.cumulativeCustomerLeads).toBe(120);

      // Day 3
      expect(day3.cumulativeRestaurants).toBe(12);
      expect(day3.cumulativeRiders).toBe(10);
      expect(day3.cumulativeCustomerLeads).toBe(240);

      // Day 4
      expect(day4.cumulativeRestaurants).toBe(16);
      expect(day4.cumulativeRiders).toBe(13);
      expect(day4.cumulativeCustomerLeads).toBe(370);

      // Day 5
      expect(day5.cumulativeRestaurants).toBe(20);
      expect(day5.cumulativeRiders).toBe(15);
      expect(day5.cumulativeCustomerLeads).toBe(500);
    });
  });

  describe("Pure Mathematical Calculator: calculateLaunchEconomics", () => {
    it("calculates exact merchant deductions and net payable for standalone restaurant on ₹300 order", () => {
      // Food subtotal = ₹300 = 30,000 paise
      // Commission = 22% = 2,200 bps
      // GST on commission = 18% = 1,800 bps
      // TDS 194-O = 0.1% = 10 bps
      const res = calculateLaunchEconomics({
        foodSubtotalPaise: 30000,
        commissionRateBps: 2200,
        deliveryDistanceKm: 2.0,
        customerDeliveryFeePaise: 2900,
        customerDiscountPaise: 4000,
      });

      // Commission: 30,000 * 22% = 6,600 paise (₹66.00)
      expect(res.merchantCommissionPaise).toBe(6600);
      // GST on Commission: 6,600 * 18% = 1,188 paise (₹11.88)
      expect(res.gstOnCommissionPaise).toBe(1188);
      // TDS 194-O: 30,000 * 0.1% = 30 paise (₹0.30)
      expect(res.tdsSection194OPaise).toBe(30);
      // Total merchant deductions = 6,600 + 1,188 + 30 = 7,818 paise
      expect(res.totalMerchantDeductionsPaise).toBe(7818);
      // Net Merchant Payable = 30,000 - 7,818 = 22,182 paise (₹221.82)
      expect(res.netMerchantPayablePaise).toBe(22182);
    });

    it("verifies exact Astra 6 unit economics table (+₹13 margin on ₹300 order)", () => {
      // In Astra 6 table:
      // Commission: +₹66
      // Customer delivery fee: +₹29
      // Rider compensation: -₹42 (Base ₹25 + 2km distance compensation ₹17)
      // Launch discount: -₹40
      // Net contribution margin = +₹13 (1,300 paise)
      const res = calculateLaunchEconomics({
        foodSubtotalPaise: 30000,
        commissionRateBps: 2200, // 22%
        deliveryDistanceKm: 4.0, // 2km excess @ ₹8.50/km = ₹17, Base ₹25 + ₹17 = ₹42
        customerDeliveryFeePaise: 2900, // +₹29
        customerDiscountPaise: 4000, // -₹40
      });

      expect(res.merchantCommissionPaise).toBe(6600);
      expect(res.customerDeliveryFeePaise).toBe(2900);
      expect(res.riderGrossPayoutPaise).toBe(4200); // ₹42.00
      expect(res.platformFundedDiscountPaise).toBe(4000); // ₹40.00

      // Inflow = 6600 + 2900 = 9500 paise
      expect(res.grossPlatformInflowPaise).toBe(9500);
      // Outflow = 4200 + 4000 = 8200 paise
      expect(res.grossPlatformOutflowPaise).toBe(8200);
      // Contribution Margin = 9500 - 8200 = 1300 paise (+₹13.00)
      expect(res.platformContributionMarginPaise).toBe(1300);
    });

    it("verifies negative margin (-₹5) on anchor partner 16% commission", () => {
      // In Astra 6: 16% on ₹300 is ₹48.
      // Inflow: ₹48 (comm) + ₹29 (delivery fee) = ₹77
      // Outflow: ₹42 (rider) + ₹40 (discount) = ₹82
      // Margin: 77 - 82 = -₹5 (-500 paise)
      const res = calculateLaunchEconomics({
        foodSubtotalPaise: 30000,
        commissionRateBps: 1600, // 16%
        deliveryDistanceKm: 4.0, // ₹42 rider payout
        customerDeliveryFeePaise: 2900,
        customerDiscountPaise: 4000,
      });

      expect(res.merchantCommissionPaise).toBe(4800);
      expect(res.grossPlatformInflowPaise).toBe(7700);
      expect(res.grossPlatformOutflowPaise).toBe(8200);
      expect(res.platformContributionMarginPaise).toBe(-500); // -₹5.00
    });

    it("correctly includes weather surge in rider gross payout", () => {
      const res = calculateLaunchEconomics({
        foodSubtotalPaise: 25000,
        commissionRateBps: 2000,
        deliveryDistanceKm: 2.0,
        weatherSurgePaise: 1500, // ₹15 rain surge
      });

      expect(res.riderWeatherSurgePaise).toBe(1500);
      expect(res.riderGrossPayoutPaise).toBe(2500 + 1500); // Base ₹25 + ₹15 = ₹40 (4,000 paise)
    });
  });

  describe("Rider Shift Economics & ₹500 Floor Guarantee", () => {
    it("tops up rider payout to ₹500 floor when order earnings are below floor", () => {
      // Rider completed 8 deliveries with total earnings of ₹336 (33,600 paise)
      // Exactly matches Astra 6 example: ₹336 order earnings -> ₹164 top-up -> ₹500 total
      const deliveries = [
        { distanceKm: 4.0 }, // ₹25 + (2 * ₹8.50 = ₹17) = ₹42
        { distanceKm: 4.0 }, // ₹42
        { distanceKm: 4.0 }, // ₹42
        { distanceKm: 4.0 }, // ₹42
        { distanceKm: 4.0 }, // ₹42
        { distanceKm: 4.0 }, // ₹42
        { distanceKm: 4.0 }, // ₹42
        { distanceKm: 4.0 }, // ₹42 -> Total 8 * 42 = ₹336
      ];

      const res = calculateRiderShiftPayout({
        shiftHours: 8,
        completedDeliveries: deliveries,
        dayNumber: 2, // No kit deduction on Day 2
      });

      expect(res.totalOrdersDelivered).toBe(8);
      expect(res.grossOrderEarningsPaise).toBe(33600);
      expect(res.dailyFloorGuaranteePaise).toBe(50000);
      expect(res.guaranteeTopUpPaise).toBe(16400); // ₹164 top-up
      expect(res.grossShiftEarningsPaise).toBe(50000); // ₹500 gross
      expect(res.kitDeductionAppliedPaise).toBe(0);
      expect(res.netTakeHomePayoutPaise).toBe(50000);
    });

    it("pays full order earnings with ₹0 top-up when rider earns more than ₹500 floor", () => {
      // Rider completed 15 deliveries at ₹42 = ₹630 (63,000 paise)
      const deliveries = Array(15).fill({ distanceKm: 4.0 });

      const res = calculateRiderShiftPayout({
        shiftHours: 8,
        completedDeliveries: deliveries,
        dayNumber: 2,
      });

      expect(res.totalOrdersDelivered).toBe(15);
      expect(res.grossOrderEarningsPaise).toBe(63000);
      expect(res.guaranteeTopUpPaise).toBe(0);
      expect(res.grossShiftEarningsPaise).toBe(63000);
      expect(res.netTakeHomePayoutPaise).toBe(63000);
    });

    it("applies ₹50 kit deduction starting Day 4 onwards while safeguarding ₹500 floor", () => {
      const deliveries = Array(15).fill({ distanceKm: 4.0 }); // ₹630 earned

      const resDay4 = calculateRiderShiftPayout({
        shiftHours: 8,
        completedDeliveries: deliveries,
        dayNumber: 4, // Day 4 triggers kit amortization
      });

      expect(resDay4.grossShiftEarningsPaise).toBe(63000);
      expect(resDay4.kitDeductionAppliedPaise).toBe(5000); // ₹50 deducted
      expect(resDay4.netTakeHomePayoutPaise).toBe(58000); // ₹580 take home
    });
  });

  describe("Merchant Economics Comparison: OrderKing vs Legacy Aggregators", () => {
    it("demonstrates over ₹28 savings per order and >₹8,400 monthly savings", () => {
      const comp = compareMerchantNetPayout(30000, 2200, 3000);

      // OrderKing Net: ₹221.82 (22,182 paise)
      expect(comp.orderKingNetPayoutPaise).toBe(22182);

      // Competitor at 30%:
      // Comm = 9,000, GST = 1,620, TDS = 30 -> Deductions = 10,650 -> Net = 19,350 paise (₹193.50)
      expect(comp.competitorNetPayoutPaise).toBe(19350);

      // Savings per order: 22,182 - 19,350 = 2,832 paise (₹28.32)
      expect(comp.merchantSavingsPerOrderPaise).toBe(2832);

      // Monthly savings across 300 orders: 2,832 * 300 = 849,600 paise (₹8,496.00)
      expect(comp.projectedMonthlySavings300OrdersPaise).toBe(849600);
    });
  });

  describe("Restaurant Battlecard & Field Operations Scripts", () => {
    it("contains all 3 commercial tiers with exact rate cards", () => {
      expect(COMMERCIAL_TIERS.ANCHOR_RESTAURANT.commissionPct).toBe(16);
      expect(COMMERCIAL_TIERS.CLOUD_KITCHEN.commissionPct).toBe(20);
      expect(COMMERCIAL_TIERS.STANDALONE_RESTAURANT.commissionPct).toBe(22);
      expect(COMMERCIAL_TIERS.STANDALONE_RESTAURANT.onboardingFeePaise).toBe(0);
    });

    it("contains the complete 4-stage 15-minute walk-in script in English & Hinglish", () => {
      expect(RESTAURANT_WALK_IN_SCRIPT).toHaveLength(4);

      const [stage1, stage2, stage3, stage4] = RESTAURANT_WALK_IN_SCRIPT;

      // Stage 1: Hook
      expect(stage1.timeRangeMinutes).toContain("00:00–02:30");
      expect(stage1.englishScript).toContain("Good afternoon, boss");
      expect(stage1.hinglishScript).toContain("Hello bhaiya");

      // Stage 2: Demo
      expect(stage2.timeRangeMinutes).toContain("02:30–07:00");
      expect(stage2.englishScript).toContain("Bluetooth");
      expect(stage2.hinglishScript).toContain("KOT print");

      // Stage 3: Economics
      expect(stage3.timeRangeMinutes).toContain("07:00–12:00");
      expect(stage3.englishScript).toContain("₹300.00");
      expect(stage3.hinglishScript).toContain("30% commission");

      // Stage 4: Close
      expect(stage4.timeRangeMinutes).toContain("12:00–15:00");
      expect(stage4.englishScript).toContain("top 8 best-selling items");
      expect(stage4.hinglishScript).toContain("8 sabse popular");
    });

    it("contains the 3 crucial field objection counters with operational commitments", () => {
      expect(OBJECTION_COUNTERS).toHaveLength(3);

      const obj1 = OBJECTION_COUNTERS.find((o) => o.id === "obj-already-have-apps");
      const obj2 = OBJECTION_COUNTERS.find((o) => o.id === "obj-riders-wont-show-up");
      const obj3 = OBJECTION_COUNTERS.find((o) => o.id === "obj-too-complicated-fees");

      expect(obj1).toBeDefined();
      expect(obj2).toBeDefined();
      expect(obj3).toBeDefined();

      expect(obj1?.founderResponseHinglish).toContain("Counter par ek aur machine rakhne ki zaroorat bilkul nahi hai");
      expect(obj2?.operationalCommitment).toContain("3-minute rider assignment SLA");
      expect(obj3?.operationalCommitment).toContain("100% ₹0 onboarding fee guarantee");
    });
  });

  describe("Rider Fleet & Customer Launch Architecture", () => {
    it("configures 15-rider fleet allocation roster and recruitment parameters", () => {
      const roster = RIDER_RECRUITMENT_CONFIG.shiftRoster15;
      expect(roster.lunchPrimaryRiders).toBe(5);
      expect(roster.dinnerPrimaryRiders).toBe(7);
      expect(roster.peakReserves).toBe(2);
      expect(roster.flexibleFloatingBackup).toBe(1);
      expect(roster.totalFleetSize).toBe(15);

      expect(RIDER_RECRUITMENT_CONFIG.payStructure.dailyFloorGuaranteePaise).toBe(50000);
      expect(RIDER_RECRUITMENT_CONFIG.payStructure.kitDepositModel.totalCostPaise).toBe(120000);
      expect(RIDER_RECRUITMENT_CONFIG.payStructure.kitDepositModel.dailyDeductionPaise).toBe(5000);
      expect(RIDER_RECRUITMENT_CONFIG.payStructure.kitDepositModel.startDeductionDay).toBe(4);
    });

    it("contains customer LOCAL40 launch promotion and WhatsApp/QR copy", () => {
      const promo = CUSTOMER_LAUNCH_PLAN.promotionalOffer;
      expect(promo.couponCode).toBe("LOCAL40");
      expect(promo.discountPaise).toBe(4000); // ₹40
      expect(promo.minOrderValuePaise).toBe(14900); // ₹149 min order
      expect(promo.freeDeliveryOrdersCount).toBe(2);
      expect(promo.redemptionCapPerCluster).toBe(100);

      expect(CUSTOMER_LAUNCH_PLAN.whatsAppBroadcastCopy.customerDirectHinglish).toContain("LOCAL40");
      expect(CUSTOMER_LAUNCH_PLAN.qrTentCardCopy.counterCallToAction).toContain("₹40 OFF");
    });

    it("verifies 5-day timetable contains complete hour-by-hour operational schedules", () => {
      expect(FIVE_DAY_STREET_TIMETABLE).toHaveLength(5);
      for (const day of FIVE_DAY_STREET_TIMETABLE) {
        expect(day.schedule.length).toBeGreaterThanOrEqual(6);
        expect(day.endOfDayReconciliationAudit.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Launch Cash Envelope & Ledger Math", () => {
    it("verifies cash envelope budget bounds (₹65,000 to ₹95,000) and exact item summation", () => {
      const env = LAUNCH_CASH_ENVELOPE;
      expect(env.summary.leanTotalPaise).toBe(6500000); // ₹65,000
      expect(env.summary.standardTotalPaise).toBe(8500000); // ₹85,000
      expect(env.summary.scaleTotalPaise).toBe(9500000); // ₹95,000

      // Sum all standard items
      const sumStandard = env.items.reduce((acc, it) => acc + it.standardBudgetPaise, 0);
      expect(sumStandard).toBe(8500000); // Exactly ₹85,000

      // Sum all lean items
      const sumLean = env.items.reduce((acc, it) => acc + it.leanBudgetPaise, 0);
      expect(sumLean).toBe(6500000); // Exactly ₹65,000

      // Sum all scale items
      const sumScale = env.items.reduce((acc, it) => acc + it.scaleBudgetPaise, 0);
      expect(sumScale).toBe(9500000); // Exactly ₹95,000
    });

    it("verifies formatting helpers", () => {
      expect(formatPaiseToInr(22182)).toBe("₹221.82");
      expect(formatPaiseToInr(-500)).toBe("-₹5.00");
      expect(formatInrWhole(8500000)).toBe("₹85,000");
      expect(formatInrWhole(6500000)).toBe("₹65,000");
    });
  });
});
