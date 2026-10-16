import { describe, it, expect } from "vitest";
import {
  TRUST_TIER_CONFIGS,
  EV_PARTNER_BENEFITS,
  FUEL_PARTNER_BENEFITS,
  SOCIAL_SECURITY_BENEFIT,
  INSTANT_CASHOUT_BENEFIT,
  REST_POINT_HUBS,
  getTrustTier,
  getTrustTierProgression,
  getPoliteFloatingCashMessage,
  calculateRiderMonthlySavings,
  calculateFounderRevenuePerRider,
  calculateFleetEcosystemFinancials,
  riderAffiliateEcosystemEngine,
} from "./rider-affiliate-ecosystem";

describe("Supreme Rider Affiliate Ecosystem & Founder Revenue Maximization", () => {
  describe("1. Curated High-Value Partner Benefits Catalog", () => {
    it("provides EV rental & battery swap benefits with 15% discount, ₹350 bounty, and ₹100/mo recurring revenue", () => {
      expect(EV_PARTNER_BENEFITS.length).toBeGreaterThanOrEqual(3);

      const yulu = EV_PARTNER_BENEFITS.find((p) => p.brand === "YULU");
      expect(yulu).toBeDefined();
      expect(yulu?.riderDiscountPct).toBe(15);
      expect(yulu?.founderReferralBountyInr).toBe(350);
      expect(yulu?.founderMonthlyActiveRevenueInr).toBe(100);
      expect(yulu?.monthlyRiderSavingsInr).toBe(1275); // 15% of 8500
      expect(yulu?.claimedDiscountCode).toBe("OKYULU15");

      const zypp = EV_PARTNER_BENEFITS.find((p) => p.brand === "ZYPP");
      expect(zypp).toBeDefined();
      expect(zypp?.riderDiscountPct).toBe(15);
      expect(zypp?.founderReferralBountyInr).toBe(350);
      expect(zypp?.founderMonthlyActiveRevenueInr).toBe(100);
      expect(zypp?.monthlyRiderSavingsInr).toBe(1350); // 15% of 9000

      const batterySmart = EV_PARTNER_BENEFITS.find((p) => p.brand === "BATTERY_SMART");
      expect(batterySmart).toBeDefined();
      expect(batterySmart?.riderDiscountPct).toBe(15);
      expect(batterySmart?.founderReferralBountyInr).toBe(350);
      expect(batterySmart?.founderMonthlyActiveRevenueInr).toBe(100);
      expect(batterySmart?.monthlyRiderSavingsInr).toBe(450); // 15% of 3000
    });

    it("integrates HPCL & IOCL fleet petrocards offering ₹2.50/L cashback and 0.5% founder interchange", () => {
      expect(FUEL_PARTNER_BENEFITS.length).toBe(2);

      const hpcl = FUEL_PARTNER_BENEFITS.find((p) => p.petrocardBrand === "HPCL_DRIVETRACK");
      expect(hpcl).toBeDefined();
      expect(hpcl?.cashbackPerLiterInr).toBe(2.5);
      expect(hpcl?.founderInterchangeBps).toBe(50); // 0.5%
      expect(hpcl?.estimatedMonthlyRiderCashbackInr).toBe(300); // 120L * ₹2.50
      expect(hpcl?.estimatedMonthlyFounderInterchangeInr).toBe(60); // 0.5% on ₹12,000 spend

      const iocl = FUEL_PARTNER_BENEFITS.find((p) => p.petrocardBrand === "IOCL_XTRAPOWER");
      expect(iocl).toBeDefined();
      expect(iocl?.cashbackPerLiterInr).toBe(2.5);
      expect(iocl?.founderInterchangeBps).toBe(50);
    });

    it("complies with Code on Social Security 2020 with ₹10 Lakh accident cover and ₹5/week OPD health card", () => {
      expect(SOCIAL_SECURITY_BENEFIT.statute).toBe("Code on Social Security, 2020");
      expect(SOCIAL_SECURITY_BENEFIT.accidentalDeathCoverInr).toBe(1000000); // ₹10 Lakh
      expect(SOCIAL_SECURITY_BENEFIT.permanentTotalDisabilityCoverInr).toBe(1000000); // ₹10 Lakh
      expect(SOCIAL_SECURITY_BENEFIT.healthOpdWeeklyCostInr).toBe(5);
      expect(SOCIAL_SECURITY_BENEFIT.founderBrokerMonthlyAffinityInr).toBe(15);
      expect(SOCIAL_SECURITY_BENEFIT.nomineeRegistrationRequired).toBe(true);
      expect(SOCIAL_SECURITY_BENEFIT.partnerClinicNetwork).toContain("MediBuddy");
    });

    it("structures Instant Cashout with ₹10 flat fee and 100% founder profit while keeping scheduled Wednesday payout ₹0 free", () => {
      expect(INSTANT_CASHOUT_BENEFIT.convenienceFeeInr).toBe(10);
      expect(INSTANT_CASHOUT_BENEFIT.founderNetProfitInr).toBe(9.85); // 98.5% margin after 15p IMPS rail
      expect(INSTANT_CASHOUT_BENEFIT.scheduledWeeklySettlementFeeInr).toBe(0);
      expect(INSTANT_CASHOUT_BENEFIT.transferRail).toBe("NPCI_IMPS");
    });

    it("provisions Rider Rest Points & Charging Zones with 0 platform capex", () => {
      expect(REST_POINT_HUBS.length).toBeGreaterThanOrEqual(3);
      for (const hub of REST_POINT_HUBS) {
        expect(hub.founderCapexInr).toBe(0);
        expect(hub.amenities.freePurifiedWater).toBe(true);
        expect(hub.amenities.fastPhoneChargingDocks).toBe(true);
        expect(hub.amenities.cleanRestrooms).toBe(true);
      }
    });
  });

  describe("2. Dynamic Trust Tier Progression", () => {
    it("accurately classifies riders across Bronze, Silver, Gold, and Diamond tiers", () => {
      expect(getTrustTier(0).tier).toBe("BRONZE");
      expect(getTrustTier(30).tier).toBe("BRONZE");
      expect(getTrustTier(50).tier).toBe("SILVER");
      expect(getTrustTier(150).tier).toBe("SILVER");
      expect(getTrustTier(200).tier).toBe("GOLD");
      expect(getTrustTier(400).tier).toBe("GOLD");
      expect(getTrustTier(500).tier).toBe("DIAMOND");
      expect(getTrustTier(1200).tier).toBe("DIAMOND");
    });

    it("scales floating cash limits dynamically from ₹2,000 to ₹5,000 based on verified deliveries", () => {
      expect(TRUST_TIER_CONFIGS.BRONZE.floatingCashLimitInr).toBe(2000);
      expect(TRUST_TIER_CONFIGS.SILVER.floatingCashLimitInr).toBe(2500);
      expect(TRUST_TIER_CONFIGS.GOLD.floatingCashLimitInr).toBe(3500);
      expect(TRUST_TIER_CONFIGS.DIAMOND.floatingCashLimitInr).toBe(5000);
    });

    it("computes accurate progression towards the next trust tier", () => {
      // Rider with 25 deliveries is halfway to Silver (50)
      const prog = getTrustTierProgression(25);
      expect(prog.currentTier.tier).toBe("BRONZE");
      expect(prog.nextTier?.tier).toBe("SILVER");
      expect(prog.deliveriesCompleted).toBe(25);
      expect(prog.deliveriesNeededForNextTier).toBe(25);
      expect(prog.progressPercentage).toBe(50);
      expect(prog.nextHeadroomBonusInr).toBe(500); // 2500 - 2000

      // Diamond rider has reached maximum tier
      const diamondProg = getTrustTierProgression(600);
      expect(diamondProg.currentTier.tier).toBe("DIAMOND");
      expect(diamondProg.nextTier).toBeNull();
      expect(diamondProg.progressPercentage).toBe(100);
    });
  });

  describe("3. Polite Human-Style Messaging Engine", () => {
    const FORBIDDEN_WORDS = ["theft", "fraud", "criminal", "cheat", "punish", "defaulter", "blacklisted"];

    function assertPoliteTone(text: string) {
      const lower = text.toLowerCase();
      for (const word of FORBIDDEN_WORDS) {
        expect(lower).not.toContain(word);
      }
    }

    it("emits dignified, encouraging messaging when cash balance is comfortable", () => {
      const msg = getPoliteFloatingCashMessage({
        currentBalancePaise: 40000, // ₹400
        lifetimeDeliveries: 10,
        riderName: "Ramesh Kumar",
      });

      expect(msg.tone).toBe("COMFORTABLE");
      expect(msg.badgeTone).toBe("online");
      expect(msg.headline).toContain("Ramesh");
      expect(msg.headroomInr).toBe(1600);
      expect(msg.prepaidOrdersUninterruptedNotice).toContain("active");
      assertPoliteTone(msg.headline + " " + msg.greetingAndStatus + " " + msg.suggestedAction);
    });

    it("emits warm soft-warning messaging when cash balance reaches 75%", () => {
      const msg = getPoliteFloatingCashMessage({
        currentBalancePaise: 160000, // ₹1,600 out of ₹2,000 = 80%
        lifetimeDeliveries: 20,
        riderName: "Vikram Singh",
      });

      expect(msg.tone).toBe("SOFT_WARNING");
      expect(msg.badgeTone).toBe("warning");
      expect(msg.headroomInr).toBe(400);
      expect(msg.suggestedAction).toContain("Wednesday payout");
      expect(msg.chaiBreakEncouragement).toContain("RO water");
      assertPoliteTone(msg.headline + " " + msg.greetingAndStatus + " " + msg.suggestedAction);
    });

    it("emits tea-break centered notification when 100% cash limit is reached", () => {
      const msg = getPoliteFloatingCashMessage({
        currentBalancePaise: 200000, // ₹2,000 out of ₹2,000 = 100%
        lifetimeDeliveries: 15,
        riderName: "Deepak Sharma",
      });

      expect(msg.tone).toBe("LIMIT_REACHED");
      expect(msg.badgeTone).toBe("busy");
      expect(msg.headline).toContain("Incredible hustle today, Deepak!");
      expect(msg.suggestedAction).toContain("tea break");
      expect(msg.chaiBreakEncouragement).toContain("Chai break time");
      expect(msg.prepaidOrdersUninterruptedNotice).toContain("Prepaid online deliveries remain 100% active");
      expect(msg.upiIntentUrl).toContain("upi://pay");
      expect(msg.qrCodeUrl).toContain("api.qrserver.com");
      assertPoliteTone(msg.headline + " " + msg.greetingAndStatus + " " + msg.suggestedAction);
    });

    it("honors custom discipline config limits when set by UmarOS", () => {
      const msg = getPoliteFloatingCashMessage({
        currentBalancePaise: 240000, // ₹2,400 (80% of ₹3,000)
        lifetimeDeliveries: 10, // Bronze normally ₹2,000
        disciplineConfigLimitInr: 3000, // Custom override to ₹3,000
      });

      expect(msg.holdingLimitInr).toBe(3000);
      expect(msg.tone).toBe("SOFT_WARNING"); // ₹2,400 / ₹3,000 = 80%
      expect(msg.headroomInr).toBe(600);
    });
  });

  describe("4. Financial Return & Founder Revenue Calculations", () => {
    it("calculates comprehensive monthly savings for an active rider using EV + Health OPD + Rest Hubs", () => {
      const savings = calculateRiderMonthlySavings({
        hasEvRental: true,
        evPartnerId: "yulu-dex-fleet",
        hasFuelPetrocard: false,
        hasHealthOpdCard: true,
        instantCashoutsPerMonth: 2,
        usesRestPoints: true,
      });

      expect(savings.evRentalSavingsInr).toBe(1275);
      expect(savings.fuelCashbackSavingsInr).toBe(0);
      expect(savings.healthOpdDoctorSavingsInr).toBe(428); // ₹450 - ~₹21.65 rounded
      expect(savings.restPointPerksValueInr).toBe(300);
      expect(savings.instantCashoutFeePaidInr).toBe(20);
      expect(savings.totalNetMonthlyRiderSavingsInr).toBe(1983);
      expect(savings.annualizedRiderSavingsInr).toBe(1983 * 12); // ~₹23,796/year savings
    });

    it("calculates comprehensive monthly savings for an IC-engine petrol rider using Petrocard + OPD", () => {
      const savings = calculateRiderMonthlySavings({
        hasEvRental: false,
        hasFuelPetrocard: true,
        monthlyFuelLiters: 150,
        hasHealthOpdCard: true,
        instantCashoutsPerMonth: 1,
        usesRestPoints: true,
      });

      expect(savings.fuelCashbackSavingsInr).toBe(375); // 150L * 2.50
      expect(savings.instantCashoutFeePaidInr).toBe(10);
      expect(savings.totalNetMonthlyRiderSavingsInr).toBe(375 + 428 + 300 - 10);
    });

    it("calculates Founder net revenue generated per active rider", () => {
      const founderRev = calculateFounderRevenuePerRider({
        hasEvRental: true,
        hasFuelPetrocard: false,
        hasHealthOpdCard: true,
        instantCashoutsPerMonth: 4,
        usesRestPoints: true,
      });

      expect(founderRev.evReferralBountyUpfrontInr).toBe(350);
      expect(founderRev.evMonthlySubscriptionRevShareInr).toBe(100);
      expect(founderRev.insuranceBrokerShareMonthlyInr).toBe(15);
      expect(founderRev.instantCashoutConvenienceFeeRevenueInr).toBe(39); // 4 * 9.85 rounded = 39
      expect(founderRev.evReferralBountyAmortizedMonthlyInr).toBe(58); // 350 / 6
      expect(founderRev.totalMonthlyFounderNetRevenueInr).toBe(100 + 15 + 39 + 58); // ₹212/month
      expect(founderRev.annualizedFounderNetRevenueInr).toBe(212 * 12); // ₹2,544/year net profit per rider
    });

    it("simulates fleet economics at scale (e.g. 1,000 riders)", () => {
      const sim = calculateFleetEcosystemFinancials({
        fleetSize: 1000,
        evAdoptionPct: 35, // 350 riders on EV
        petrocardAdoptionPct: 55, // 550 riders on Petrocard
        insuranceAdoptionPct: 80, // 800 riders with insurance
        avgInstantCashoutsPerRiderPerMonth: 3.5, // 3,500 total cashouts
      });

      expect(sim.fleetSize).toBe(1000);
      expect(sim.ridersOnEv).toBe(350);
      expect(sim.ridersOnPetrocard).toBe(550);
      expect(sim.ridersWithInsurance).toBe(800);
      expect(sim.monthlyFleetTotalInstantCashouts).toBe(3500);

      // Rider savings
      expect(sim.totalFleetMonthlyRiderSavingsInr).toBeGreaterThan(500000); // > ₹5 Lakhs saved/month by riders
      expect(sim.totalFleetAnnualRiderSavingsInr).toBeGreaterThan(6000000); // > ₹60 Lakhs/year

      // Founder profits
      expect(sim.monthlyFounderEvRevenueInr).toBe(35000); // 350 * ₹100
      expect(sim.monthlyFounderFuelInterchangeInr).toBe(33000); // 550 * ₹60
      expect(sim.monthlyFounderInsuranceBrokerageInr).toBe(12000); // 800 * ₹15
      expect(sim.monthlyFounderInstantCashoutNetProfitInr).toBe(34475); // 3,500 * 9.85
      expect(sim.totalMonthlyFounderNetProfitInr).toBe(114475); // > ₹1.14 Lakhs/month pure founder net profit
      expect(sim.totalAnnualFounderNetProfitInr).toBe(114475 * 12); // > ₹13.7 Lakhs/year pure founder profit
      expect(sim.founderUpfrontEvBountiesPipelineInr).toBe(122500); // 350 * ₹350
    });
  });

  describe("5. Singleton Engine Methods", () => {
    it("provides access to partners, benefits, and rest points via singleton", () => {
      const engine = riderAffiliateEcosystemEngine;
      expect(engine.getEvPartners().length).toBeGreaterThan(0);
      expect(engine.getFuelPartners().length).toBeGreaterThan(0);
      expect(engine.getSocialSecurityInsurance().statute).toContain("Code on Social Security");
      expect(engine.getInstantCashoutConfig().convenienceFeeInr).toBe(10);
      expect(engine.getRestPoints("bengaluru").length).toBe(2);
    });
  });
});
