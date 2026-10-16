import { describe, expect, it } from "vitest";
import {
  RiderTrustEngine,
  calculateRiderTier,
  calculateTrustScore,
  evaluateRiderCashLimit,
  canRiderAcceptOrder,
  generateUpiSettlementUri,
  validatePoliteMessage,
  FORBIDDEN_WORDS,
  DEFAULT_RIDER_TRUST_CONFIG,
  type RiderHistoricalStats,
  type RiderBehaviorMetrics,
  type FounderManualOverride,
} from "./rider-trust-engine";

describe("Supreme Rider Dynamic Trust, Risk Scoring & Polite Anti-Theft Shield Engine", () => {
  // ==========================================================================
  // 1. TIER ALLOCATION & DYNAMIC FLOATING CASH LIMITS
  // ==========================================================================
  describe("Dynamic Floating Cash Limits by Historical Tier", () => {
    it("allocates Tier 1 (Bronze / Beginner) with ₹1,500 limit for 0-20 orders and 0 settlement delays", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_bronze_01",
        completedOrders: 15,
        totalSettlementsCount: 5,
        onTimeSettlementCount: 5,
        settlementDelaysCount: 0,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 5,
      };

      const tier = calculateRiderTier(stats);
      expect(tier.tier).toBe("BRONZE");
      expect(tier.baseLimitPaise).toBe(150000); // ₹1,500.00
      expect(tier.allocatedLimitPaise).toBe(150000);
    });

    it("allocates Tier 2 (Silver / Reliable) with ₹3,000 limit for 21-100 orders and 100% on-time settlement", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_silver_01",
        completedOrders: 50,
        totalSettlementsCount: 20,
        onTimeSettlementCount: 20,
        settlementDelaysCount: 0,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 20,
      };

      const tier = calculateRiderTier(stats);
      expect(tier.tier).toBe("SILVER");
      expect(tier.allocatedLimitPaise).toBe(300000); // ₹3,000.00
    });

    it("withholds Silver tier and retains Bronze if rider has >20 orders but incurred settlement delays", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_delayed_01",
        completedOrders: 45,
        totalSettlementsCount: 15,
        onTimeSettlementCount: 14,
        settlementDelaysCount: 1, // Had 1 delay (>24h)
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 15,
      };

      const tier = calculateRiderTier(stats);
      // Fails Silver requirements due to delay > 0; stays at Bronze
      expect(tier.tier).toBe("BRONZE");
      expect(tier.allocatedLimitPaise).toBe(150000); // ₹1,500.00
    });

    it("allocates Tier 3 (Gold / High-Performer) with ₹5,000 limit for 101-300 orders, zero disputes, and high on-time rate", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_gold_01",
        completedOrders: 180,
        totalSettlementsCount: 60,
        onTimeSettlementCount: 59,
        settlementDelaysCount: 1, // <= 1 delay allowed with >98% on-time (59/60 = 98.3%)
        disputeCount: 0, // Zero disputes strictly enforced
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 60,
      };

      const tier = calculateRiderTier(stats);
      expect(tier.tier).toBe("GOLD");
      expect(tier.allocatedLimitPaise).toBe(500000); // ₹5,000.00
    });

    it("denies Gold tier if rider has disputes, dropping back to Silver", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_dispute_01",
        completedOrders: 200,
        totalSettlementsCount: 80,
        onTimeSettlementCount: 80,
        settlementDelaysCount: 0,
        disputeCount: 1, // 1 dispute disqualifies from Gold
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 80,
      };

      const tier = calculateRiderTier(stats);
      expect(tier.tier).toBe("SILVER");
      expect(tier.allocatedLimitPaise).toBe(300000); // ₹3,000.00
    });

    it("allocates Tier 4 (Diamond / Master Partner) with ₹8,000 limit for 301+ orders with >98% on-time", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_diamond_01",
        completedOrders: 350,
        totalSettlementsCount: 100,
        onTimeSettlementCount: 99, // 99% on-time (>98%)
        settlementDelaysCount: 1,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 100,
      };

      const tier = calculateRiderTier(stats);
      expect(tier.tier).toBe("DIAMOND");
      expect(tier.allocatedLimitPaise).toBe(800000); // ₹8,000.00 base Diamond limit
    });

    it("allocates Tier 4 (Diamond Apex) with ₹10,000 limit for exemplary 500+ order partners", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_diamond_master",
        completedOrders: 520,
        totalSettlementsCount: 200,
        onTimeSettlementCount: 199,
        settlementDelaysCount: 1,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 200,
      };

      const tier = calculateRiderTier(stats);
      expect(tier.tier).toBe("DIAMOND");
      expect(tier.allocatedLimitPaise).toBe(1000000); // ₹10,000.00 maximum peak limit
    });
  });

  // ==========================================================================
  // 2. SILENT ANTI-THEFT & RISK SCORING (TRUST SCORE: 0 - 100)
  // ==========================================================================
  describe("Silent Anti-Theft & Loss-Prevention Risk Scoring", () => {
    it("awards 100 trust score for flawless settlement, zero cancellations, clean GPS, and zero disputes", () => {
      const metrics: RiderBehaviorMetrics = {
        riderId: "rider_clean_01",
        totalCashCollections: 50,
        onTimeSettlements: 50,
        delayedSettlements: 0,
        activePendingOverdueHours: 0,
        cashOrdersCollected: 50,
        cancellationsAfterCashCollected: 0,
        totalGpsCheckpoints: 100,
        verifiedGpsCheckpoints: 100,
        totalCustomerCashTransactions: 50,
        disputedCashTransactions: 0,
      };

      const breakdown = calculateTrustScore(metrics);
      expect(breakdown.totalScore).toBe(100);
      expect(breakdown.settlementPunctualityScore).toBe(35);
      expect(breakdown.cancellationIntegrityScore).toBe(25);
      expect(breakdown.gpsConsistencyScore).toBe(20);
      expect(breakdown.disputeIntegrityScore).toBe(20);
    });

    it("scales cash limit back to base limit (₹1,500) when trust score drops below 60", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_gold_depressed",
        completedOrders: 150, // Gold by volume
        totalSettlementsCount: 50,
        onTimeSettlementCount: 50,
        settlementDelaysCount: 0,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 50,
      };

      // Metrics showing unverified GPS points and a post-collection cancellation
      const metrics: RiderBehaviorMetrics = {
        riderId: "rider_gold_depressed",
        totalCashCollections: 50,
        onTimeSettlements: 40,
        delayedSettlements: 10,
        activePendingOverdueHours: 30, // 6h past 24h cutoff
        cashOrdersCollected: 50,
        cancellationsAfterCashCollected: 1, // 1 cancellation after cash collection (-12.5 points)
        totalGpsCheckpoints: 100,
        verifiedGpsCheckpoints: 50, // Low GPS consistency
        totalCustomerCashTransactions: 50,
        disputedCashTransactions: 1, // 1 customer dispute (-10 points)
      };

      const evaluation = evaluateRiderCashLimit({
        stats,
        metrics,
        currentCashInHandPaise: 50000, // ₹500 in hand
      });

      expect(evaluation.trustScore).toBeLessThan(60);
      expect(evaluation.trustScore).toBeGreaterThanOrEqual(40);
      expect(evaluation.isScoreDepressed).toBe(true);
      // Despite Gold tier (base ₹5,000), limit is scaled back to base ₹1,500
      expect(evaluation.effectiveLimitPaise).toBe(150000);
      expect(evaluation.canAcceptCod).toBe(true);
      expect(evaluation.canAcceptPrepaid).toBe(true);
    });

    it("locks COD and switches to Prepaid-Only mode when trust score drops below 40", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_high_risk",
        completedOrders: 40,
        totalSettlementsCount: 20,
        onTimeSettlementCount: 10,
        settlementDelaysCount: 10,
        disputeCount: 2,
        cancellationsAfterCollectionCount: 2,
        totalCashOrdersCount: 20,
      };

      const metrics: RiderBehaviorMetrics = {
        riderId: "rider_high_risk",
        totalCashCollections: 20,
        onTimeSettlements: 8,
        delayedSettlements: 12,
        activePendingOverdueHours: 72, // 48h past cutoff!
        cashOrdersCollected: 20,
        cancellationsAfterCashCollected: 2, // 2 post-collection cancellations
        totalGpsCheckpoints: 50,
        verifiedGpsCheckpoints: 20,
        totalCustomerCashTransactions: 20,
        disputedCashTransactions: 2, // 2 customer cash disputes
      };

      const evaluation = evaluateRiderCashLimit({
        stats,
        metrics,
        currentCashInHandPaise: 80000,
      });

      expect(evaluation.trustScore).toBeLessThan(40);
      expect(evaluation.isPrepaidOnlyForced).toBe(true);
      expect(evaluation.canAcceptCod).toBe(false);
      expect(evaluation.canAcceptPrepaid).toBe(true); // Prepaid ALWAYS open
      expect(evaluation.thresholdState).toBe("SAFE_HOLD_PREPAID_ONLY");
    });
  });

  // ==========================================================================
  // 3. POLITE, NON-OFFENSIVE, HUMAN-STYLE UI MESSAGING
  // ==========================================================================
  describe("Polite, Human-First UI Messaging & Non-Offensive Guard", () => {
    it("ensures zero occurrences of forbidden punitive words across all messages", () => {
      // Test the forbidden word guard directly
      for (const word of FORBIDDEN_WORDS) {
        const testPhrase = `System alert: possible ${word} detected.`;
        const result = validatePoliteMessage(testPhrase);
        expect(result.valid).toBe(false);
        expect(result.violation?.toLowerCase()).toBe(word.toLowerCase());
      }
    });

    it("renders exact polite warning at 80% utilization (Soft Notice)", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_soft_warning",
        completedOrders: 10,
        totalSettlementsCount: 5,
        onTimeSettlementCount: 5,
        settlementDelaysCount: 0,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 5,
      };

      const metrics: RiderBehaviorMetrics = {
        riderId: "rider_soft_warning",
        totalCashCollections: 5,
        onTimeSettlements: 5,
        delayedSettlements: 0,
        cashOrdersCollected: 5,
        cancellationsAfterCashCollected: 0,
        totalGpsCheckpoints: 10,
        verifiedGpsCheckpoints: 10,
        totalCustomerCashTransactions: 5,
        disputedCashTransactions: 0,
      };

      // ₹1,200 out of ₹1,500 limit is exactly 80%
      const evaluation = evaluateRiderCashLimit({
        stats,
        metrics,
        currentCashInHandPaise: 120000, // ₹1,200
      });

      expect(evaluation.utilizationPct).toBe(80);
      expect(evaluation.thresholdState).toBe("SOFT_WARNING");
      expect(evaluation.canAcceptCod).toBe(true);
      expect(evaluation.canAcceptPrepaid).toBe(true);

      // Verify human-first message exact match
      expect(evaluation.politeNotification.message).toBe(
        "Quick reminder: Your daily cash limit is nearly reached. Deposit via UPI anytime to keep taking cash orders."
      );

      // Ensure no forbidden words
      const politeCheck = validatePoliteMessage(evaluation.politeNotification.message);
      expect(politeCheck.valid).toBe(true);
    });

    it("renders exact polite hard lock message at 100% utilization while keeping prepaid open", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_hard_lock",
        completedOrders: 10,
        totalSettlementsCount: 5,
        onTimeSettlementCount: 5,
        settlementDelaysCount: 0,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 5,
      };

      const metrics: RiderBehaviorMetrics = {
        riderId: "rider_hard_lock",
        totalCashCollections: 5,
        onTimeSettlements: 5,
        delayedSettlements: 0,
        cashOrdersCollected: 5,
        cancellationsAfterCashCollected: 0,
        totalGpsCheckpoints: 10,
        verifiedGpsCheckpoints: 10,
        totalCustomerCashTransactions: 5,
        disputedCashTransactions: 0,
      };

      // ₹1,500 out of ₹1,500 limit is 100%
      const evaluation = evaluateRiderCashLimit({
        stats,
        metrics,
        currentCashInHandPaise: 150000,
      });

      expect(evaluation.utilizationPct).toBe(100);
      expect(evaluation.thresholdState).toBe("HARD_LOCK");
      expect(evaluation.canAcceptCod).toBe(false);
      expect(evaluation.canAcceptPrepaid).toBe(true); // Crucial: Prepaid remains open!

      // Verify exact dignified phrasing
      expect(evaluation.politeNotification.message).toBe(
        "Daily Cash Limit reached. Settle collected cash via UPI to unlock your next cash trip. (Prepaid trips remain open!)."
      );

      const politeCheck = validatePoliteMessage(evaluation.politeNotification.message);
      expect(politeCheck.valid).toBe(true);
    });

    it("uses dignified phrasing: Daily Cash Wallet Threshold, Trust Tier Upgrade, Quick UPI Settlement Reminder, Cash Limit Safe Hold", () => {
      const phrases = [
        "Daily Cash Wallet Threshold",
        "Trust Tier Upgrade",
        "Quick UPI Settlement Reminder",
        "Cash Limit Safe Hold",
      ];

      for (const phrase of phrases) {
        const check = validatePoliteMessage(phrase);
        expect(check.valid).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 4. FOUNDER MANUAL OVERRIDE CONTROLS
  // ==========================================================================
  describe("Founder Manual Override Controls", () => {
    it("allows founder to set custom cash limit (e.g. ₹15,000 for trusted senior rider)", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_senior_01",
        completedOrders: 80, // Normally Silver (₹3,000)
        totalSettlementsCount: 40,
        onTimeSettlementCount: 40,
        settlementDelaysCount: 0,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 40,
      };

      const metrics: RiderBehaviorMetrics = {
        riderId: "rider_senior_01",
        totalCashCollections: 40,
        onTimeSettlements: 40,
        delayedSettlements: 0,
        cashOrdersCollected: 40,
        cancellationsAfterCashCollected: 0,
        totalGpsCheckpoints: 50,
        verifiedGpsCheckpoints: 50,
        totalCustomerCashTransactions: 40,
        disputedCashTransactions: 0,
      };

      const override: FounderManualOverride = {
        customLimitPaise: 1500000, // ₹15,000
        overrideReason: "Verified Senior Delivery Partner - High Festival Demand",
        overriddenBy: "umar@orderking.com",
        appliedAt: new Date().toISOString(),
      };

      const evaluation = evaluateRiderCashLimit({
        stats,
        metrics,
        currentCashInHandPaise: 500000, // ₹5,000 in hand (would exceed normal ₹3,000 limit)
        override,
      });

      expect(evaluation.effectiveLimitPaise).toBe(1500000); // Set to ₹15,000!
      expect(evaluation.canAcceptCod).toBe(true); // ₹5,000 / ₹15,000 is 33.3%, well below 80%
      expect(evaluation.thresholdState).toBe("NORMAL");
    });

    it("allows founder to force COD lock into prepaid-only mode", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_clean_locked",
        completedOrders: 100,
        totalSettlementsCount: 50,
        onTimeSettlementCount: 50,
        settlementDelaysCount: 0,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 50,
      };

      const metrics: RiderBehaviorMetrics = {
        riderId: "rider_clean_locked",
        totalCashCollections: 50,
        onTimeSettlements: 50,
        delayedSettlements: 0,
        cashOrdersCollected: 50,
        cancellationsAfterCashCollected: 0,
        totalGpsCheckpoints: 50,
        verifiedGpsCheckpoints: 50,
        totalCustomerCashTransactions: 50,
        disputedCashTransactions: 0,
      };

      const override: FounderManualOverride = {
        forceCodLock: true,
        overrideReason: "Routine Account Rebalance Hold",
        overriddenBy: "ops@orderking.com",
        appliedAt: new Date().toISOString(),
      };

      const evaluation = evaluateRiderCashLimit({
        stats,
        metrics,
        currentCashInHandPaise: 0,
        override,
      });

      expect(evaluation.canAcceptCod).toBe(false);
      expect(evaluation.canAcceptPrepaid).toBe(true);
      expect(evaluation.thresholdState).toBe("SAFE_HOLD_PREPAID_ONLY");
    });

    it("allows founder to grant temporary grace period during banking server downtime", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_grace_period",
        completedOrders: 10,
        totalSettlementsCount: 5,
        onTimeSettlementCount: 5,
        settlementDelaysCount: 0,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 5,
      };

      const metrics: RiderBehaviorMetrics = {
        riderId: "rider_grace_period",
        totalCashCollections: 5,
        onTimeSettlements: 5,
        delayedSettlements: 0,
        cashOrdersCollected: 5,
        cancellationsAfterCashCollected: 0,
        totalGpsCheckpoints: 10,
        verifiedGpsCheckpoints: 10,
        totalCustomerCashTransactions: 5,
        disputedCashTransactions: 0,
      };

      const twoHoursAhead = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const override: FounderManualOverride = {
        gracePeriodUntil: twoHoursAhead,
        graceHeadroomPaise: 50000, // ₹500 extra buffer
        overrideReason: "Bank UPI Server Outage - Temporary Grace",
        overriddenBy: "umar@orderking.com",
        appliedAt: new Date().toISOString(),
      };

      const evaluation = evaluateRiderCashLimit({
        stats,
        metrics,
        currentCashInHandPaise: 160000, // ₹1,600 (normally over ₹1,500 base)
        override,
      });

      expect(evaluation.isGracePeriodActive).toBe(true);
      // Effective limit = base ₹1,500 + grace headroom ₹500 = ₹2,000
      expect(evaluation.effectiveLimitPaise).toBe(200000);
      expect(evaluation.canAcceptCod).toBe(true); // ₹1,600 is 80%, so still allowed with soft warning
      expect(evaluation.thresholdState).toBe("SOFT_WARNING");
    });
  });

  // ==========================================================================
  // 5. DISPATCH ORDER ACCEPTANCE DECISION HELPER
  // ==========================================================================
  describe("canRiderAcceptOrder Dispatch Evaluation", () => {
    it("always permits prepaid orders even if cash in hand is 100% full", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_full_cash",
        completedOrders: 10,
        totalSettlementsCount: 5,
        onTimeSettlementCount: 5,
        settlementDelaysCount: 0,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 5,
      };

      const metrics: RiderBehaviorMetrics = {
        riderId: "rider_full_cash",
        totalCashCollections: 5,
        onTimeSettlements: 5,
        delayedSettlements: 0,
        cashOrdersCollected: 5,
        cancellationsAfterCashCollected: 0,
        totalGpsCheckpoints: 10,
        verifiedGpsCheckpoints: 10,
        totalCustomerCashTransactions: 5,
        disputedCashTransactions: 0,
      };

      const evaluation = evaluateRiderCashLimit({
        stats,
        metrics,
        currentCashInHandPaise: 150000, // 100% full
      });

      const orderDecision = canRiderAcceptOrder(evaluation, {
        isCod: false, // Prepaid order
      });

      expect(orderDecision.allowed).toBe(true);
      expect(orderDecision.isCod).toBe(false);
      expect(validatePoliteMessage(orderDecision.politeMessage).valid).toBe(true);
    });

    it("rejects a cash order that would breach remaining wallet limit with dignified prompt", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_near_limit",
        completedOrders: 10,
        totalSettlementsCount: 5,
        onTimeSettlementCount: 5,
        settlementDelaysCount: 0,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 5,
      };

      const metrics: RiderBehaviorMetrics = {
        riderId: "rider_near_limit",
        totalCashCollections: 5,
        onTimeSettlements: 5,
        delayedSettlements: 0,
        cashOrdersCollected: 5,
        cancellationsAfterCashCollected: 0,
        totalGpsCheckpoints: 10,
        verifiedGpsCheckpoints: 10,
        totalCustomerCashTransactions: 5,
        disputedCashTransactions: 0,
      };

      const evaluation = evaluateRiderCashLimit({
        stats,
        metrics,
        currentCashInHandPaise: 130000, // ₹1,300 in hand out of ₹1,500 limit (₹200 capacity left)
      });

      // Customer orders ₹350 cash order (35,000 paise)
      const orderDecision = canRiderAcceptOrder(evaluation, {
        isCod: true,
        codAmountPaise: 35000, // ₹350
      });

      expect(orderDecision.allowed).toBe(false);
      expect(orderDecision.isCod).toBe(true);
      expect(orderDecision.projectedCashInHandPaise).toBe(165000); // ₹1,650 > ₹1,500
      expect(orderDecision.politeMessage).toContain("Daily Cash Limit reached");
      expect(orderDecision.upiSettlementUri).toContain("upi://pay");
      expect(validatePoliteMessage(orderDecision.politeMessage).valid).toBe(true);
    });

    it("accepts a cash order when projected cash in hand remains within limit", () => {
      const stats: RiderHistoricalStats = {
        riderId: "rider_healthy",
        completedOrders: 50,
        totalSettlementsCount: 20,
        onTimeSettlementCount: 20,
        settlementDelaysCount: 0,
        disputeCount: 0,
        cancellationsAfterCollectionCount: 0,
        totalCashOrdersCount: 20,
      };

      const metrics: RiderBehaviorMetrics = {
        riderId: "rider_healthy",
        totalCashCollections: 20,
        onTimeSettlements: 20,
        delayedSettlements: 0,
        cashOrdersCollected: 20,
        cancellationsAfterCashCollected: 0,
        totalGpsCheckpoints: 20,
        verifiedGpsCheckpoints: 20,
        totalCustomerCashTransactions: 20,
        disputedCashTransactions: 0,
      };

      // Silver limit = ₹3,000 (300,000 paise)
      const evaluation = evaluateRiderCashLimit({
        stats,
        metrics,
        currentCashInHandPaise: 100000, // ₹1,000 in hand
      });

      // ₹400 cash order
      const orderDecision = canRiderAcceptOrder(evaluation, {
        isCod: true,
        codAmountPaise: 40000, // ₹400
      });

      expect(orderDecision.allowed).toBe(true);
      expect(orderDecision.projectedCashInHandPaise).toBe(140000); // ₹1,400 <= ₹3,000
      expect(validatePoliteMessage(orderDecision.politeMessage).valid).toBe(true);
    });
  });

  // ==========================================================================
  // 6. STATEFUL RIDER TRUST ENGINE LIFECYCLE
  // ==========================================================================
  describe("RiderTrustEngine Lifecycle & Settlement Flow", () => {
    it("handles full lifecycle: collection -> threshold warning -> lock -> UPI settlement -> unlock", () => {
      const engine = new RiderTrustEngine();
      const riderId = "rider_lifecycle_007";

      // 1. Initial State: Starter Bronze Partner
      let evaluation = engine.evaluateRider(riderId);
      expect(evaluation.tier).toBe("BRONZE");
      expect(evaluation.effectiveLimitPaise).toBe(150000); // ₹1,500
      expect(evaluation.currentCashInHandPaise).toBe(0);
      expect(evaluation.thresholdState).toBe("NORMAL");

      // 2. Collects Order 1: ₹900 COD
      evaluation = engine.recordCashCollection(riderId, 90000);
      expect(evaluation.currentCashInHandPaise).toBe(90000); // ₹900
      expect(evaluation.thresholdState).toBe("NORMAL"); // 900 / 1500 = 60% < 80%

      // 3. Collects Order 2: ₹350 COD -> Total ₹1,250 (83.3%) -> Trigger Soft Warning!
      evaluation = engine.recordCashCollection(riderId, 35000);
      expect(evaluation.currentCashInHandPaise).toBe(125000); // ₹1,250
      expect(evaluation.thresholdState).toBe("SOFT_WARNING");
      expect(evaluation.canAcceptCod).toBe(true);
      expect(evaluation.politeNotification.message).toBe(
        "Quick reminder: Your daily cash limit is nearly reached. Deposit via UPI anytime to keep taking cash orders."
      );

      // 4. Collects Order 3: ₹250 COD -> Total ₹1,500 (100%) -> Trigger Hard Lock!
      evaluation = engine.recordCashCollection(riderId, 25000);
      expect(evaluation.currentCashInHandPaise).toBe(150000); // ₹1,500
      expect(evaluation.thresholdState).toBe("HARD_LOCK");
      expect(evaluation.canAcceptCod).toBe(false); // COD locked!
      expect(evaluation.canAcceptPrepaid).toBe(true); // Prepaid trips remain open!
      expect(evaluation.politeNotification.message).toBe(
        "Daily Cash Limit reached. Settle collected cash via UPI to unlock your next cash trip. (Prepaid trips remain open!)."
      );

      // 5. Rider attempts another cash order -> Dispatched check declines politely
      const nextCodAttempt = engine.checkOrderAcceptance(riderId, {
        isCod: true,
        codAmountPaise: 20000,
      });
      expect(nextCodAttempt.allowed).toBe(false);
      expect(nextCodAttempt.politeMessage).toContain("Daily Cash Limit reached");

      // But a prepaid order is immediately welcomed!
      const nextPrepaidAttempt = engine.checkOrderAcceptance(riderId, {
        isCod: false,
      });
      expect(nextPrepaidAttempt.allowed).toBe(true);

      // 6. Rider deposits ₹1,500 via instant UPI settlement
      const settlementResult = engine.recordCashSettlement({
        riderId,
        settledAmountPaise: 150000,
        isOnTime: true,
      });

      expect(settlementResult.evaluation.currentCashInHandPaise).toBe(0);
      expect(settlementResult.evaluation.thresholdState).toBe("NORMAL");
      expect(settlementResult.evaluation.canAcceptCod).toBe(true);
      expect(settlementResult.politeReceipt).toContain("Quick UPI Settlement Confirmed");
      expect(validatePoliteMessage(settlementResult.politeReceipt).valid).toBe(true);
    });

    it("supports runtime tuning of dials from UmarOS without restart", () => {
      const engine = new RiderTrustEngine();
      expect(engine.getConfig().tiers.bronze.baseLimitPaise).toBe(150000);

      // UmarOS increases bronze base limit to ₹2,000 and soft warning threshold to 85%
      engine.updateConfig({
        tiers: {
          ...DEFAULT_RIDER_TRUST_CONFIG.tiers,
          bronze: {
            ...DEFAULT_RIDER_TRUST_CONFIG.tiers.bronze,
            baseLimitPaise: 200000, // ₹2,000
          },
        },
        softWarningThresholdPct: 85,
      });

      expect(engine.getConfig().tiers.bronze.baseLimitPaise).toBe(200000);
      expect(engine.getConfig().softWarningThresholdPct).toBe(85);
    });

    it("generates valid standard UPI Intent URI", () => {
      const uri = generateUpiSettlementUri({
        vpa: "orderking.fleet@axisbank",
        merchantName: "OrderKing",
        amountPaise: 150000,
        riderId: "rider_xyz_99",
      });

      expect(uri).toContain("upi://pay?");
      expect(uri).toContain("pa=orderking.fleet@axisbank");
      expect(uri).toContain("am=1500.00");
      expect(uri).toContain("cu=INR");
      expect(uri).toContain("rider_xyz_99");
    });
  });
});
