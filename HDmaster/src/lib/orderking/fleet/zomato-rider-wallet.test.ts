import { describe, expect, it } from "vitest";
import {
  calculateNetDepositDue,
  calculateCodNettingBalances,
  calculateEarlyPayoutNetting,
  calculateKitInstallmentDeduction,
  evaluatePrepaidFirstStatus,
  createInitialRiderWallet,
  processPrepaidOrderSettlement,
  processCodOrderSettlement,
  processCodDeposit,
  processKitInstallmentDeduction,
  processEarlyPayout,
  processWeeklySettlement,
  canRiderAcceptOrder,
  verifyLedgerIntegrity,
  ZomatoRiderWalletEngine,
  DEFAULT_RIDER_WALLET_CONFIG,
  formatPaiseToInr,
  formatPaiseToRupeesString,
} from "./zomato-rider-wallet";

describe("Supreme Zomato Rider Wallet, Accounting & Onboarding Economics Engine", () => {
  // ==========================================================================
  // 1. PURE MATHEMATICAL EQUATIONS & NETTING MECHANICS
  // ==========================================================================
  describe("Mathematical Foundations & COD Netting Equations", () => {
    it("calculates exact Net Deposit Due to Platform with zero rounding error", () => {
      // Formula: Net Deposit Due = max(0, orderCashPaise - payoutPaise - existingWithdrawableWalletPaise)

      // Scenario 1: Cash collected exceeds payout and existing wallet balance
      // Cash = ₹500 (50,000p), Payout = ₹40 (4,000p), Existing = ₹0
      // Due = 50,000 - 4,000 - 0 = 46,000p (₹460)
      expect(calculateNetDepositDue(50000, 4000, 0)).toBe(46000);

      // Scenario 2: Existing wallet balance partially absorbs cash
      // Cash = ₹500 (50,000p), Payout = ₹50 (5,000p), Existing = ₹200 (20,000p)
      // Due = 50,000 - 5,000 - 20,000 = 25,000p (₹250)
      expect(calculateNetDepositDue(50000, 5000, 20000)).toBe(25000);

      // Scenario 3: Payout + Existing exactly equals Cash collected
      // Cash = ₹300 (30,000p), Payout = ₹50 (5,000p), Existing = ₹250 (25,000p)
      // Due = 30,000 - 5,000 - 25,000 = 0p (₹0)
      expect(calculateNetDepositDue(30000, 5000, 25000)).toBe(0);

      // Scenario 4: Payout + Existing exceeds Cash collected (Over-collateralized)
      // Cash = ₹200 (20,000p), Payout = ₹60 (6,000p), Existing = ₹300 (30,000p)
      // Due = max(0, 20,000 - 6,000 - 30,000) = max(0, -16,000) = 0
      expect(calculateNetDepositDue(20000, 6000, 30000)).toBe(0);
    });

    it("maintains 100% balanced ledger invariant: Net Rider Wealth Gain is strictly identical to payoutPaise", () => {
      // Mathematical Invariant Test:
      // In all permutations of cash collected, payout, and existing wallet balance,
      // Rider Net Wealth Change = (Cash in pocket delta) + (Withdrawable balance delta) - (Floating cash debt delta)
      // Must ALWAYS equal EXACTLY payoutPaise!

      const testCases = [
        { orderCash: 50000, payout: 4500, existingWithdrawable: 0, existingFloating: 0 },
        { orderCash: 25000, payout: 6000, existingWithdrawable: 15000, existingFloating: 10000 },
        { orderCash: 12000, payout: 3500, existingWithdrawable: 30000, existingFloating: 5000 },
        { orderCash: 0, payout: 5000, existingWithdrawable: 10000, existingFloating: 0 },
        { orderCash: 100000, payout: 8000, existingWithdrawable: 50000, existingFloating: 20000 },
      ];

      for (const tc of testCases) {
        const res = calculateCodNettingBalances({
          orderCashPaise: tc.orderCash,
          payoutPaise: tc.payout,
          existingWithdrawableWalletPaise: tc.existingWithdrawable,
          existingFloatingCashPaise: tc.existingFloating,
        });

        // Rider receives tc.orderCash in physical paper notes:
        const physicalCashDelta = tc.orderCash;
        // Withdrawable wallet balance change:
        const walletDelta = res.newWithdrawableEarningsPaise - tc.existingWithdrawable;
        // Floating cash debt owed to platform delta:
        const debtDelta = res.newFloatingCashPaise - tc.existingFloating;

        // Net wealth change = physicalCashDelta + walletDelta - debtDelta
        const netWealthGain = physicalCashDelta + walletDelta - debtDelta;

        expect(netWealthGain).toBe(tc.payout);
      }
    });

    it("throws error if negative numbers are passed to netting functions", () => {
      expect(() => calculateNetDepositDue(-100, 50, 0)).toThrow();
      expect(() =>
        calculateCodNettingBalances({
          orderCashPaise: -500,
          payoutPaise: 40,
          existingWithdrawableWalletPaise: 0,
          existingFloatingCashPaise: 0,
        })
      ).toThrow();
    });
  });

  // ==========================================================================
  // 2. PREPAID ORDER ACCOUNTING
  // ==========================================================================
  describe("Prepaid Order Accounting", () => {
    it("credits payout directly to withdrawable wallet with zero customer cash collected", () => {
      const { state: initialWallet } = createInitialRiderWallet("rider_prepaid_01", {
        kitMode: "UPFRONT_PAID",
      });

      expect(initialWallet.withdrawableEarningsPaise).toBe(0);
      expect(initialWallet.floatingCashPaise).toBe(0);

      // Complete Prepaid Order 1: Payout ₹55.50 (5,550 paise)
      const res1 = processPrepaidOrderSettlement({
        wallet: initialWallet,
        orderId: "ord_prepaid_001",
        payoutPaise: 5550,
      });

      expect(res1.updatedWallet.withdrawableEarningsPaise).toBe(5550);
      expect(res1.updatedWallet.floatingCashPaise).toBe(0);
      expect(res1.updatedWallet.lifetimeEarningsPaise).toBe(5550);
      expect(res1.updatedWallet.completedDeliveriesCount).toBe(1);
      expect(res1.updatedWallet.completedPrepaidCount).toBe(1);
      expect(res1.ledgerEntries).toHaveLength(1);
      expect(res1.ledgerEntries[0].type).toBe("ORDER_PAYOUT_PREPAID");
      expect(res1.ledgerEntries[0].creditPaise).toBe(5550);

      // Complete Prepaid Order 2: Payout ₹42.00 (4,200 paise)
      const res2 = processPrepaidOrderSettlement({
        wallet: res1.updatedWallet,
        orderId: "ord_prepaid_002",
        payoutPaise: 4200,
      });

      expect(res2.updatedWallet.withdrawableEarningsPaise).toBe(5550 + 4200); // 9,750 paise = ₹97.50
      expect(res2.updatedWallet.completedDeliveriesCount).toBe(2);
      expect(res2.updatedWallet.completedPrepaidCount).toBe(2);
      expect(res2.updatedWallet.floatingCashPaise).toBe(0);
    });
  });

  // ==========================================================================
  // 3. COD ORDER ACCOUNTING & NETTING MECHANICS
  // ==========================================================================
  describe("COD Order Accounting & Instant Netting Mechanics", () => {
    it("Case A: Instant netting when order cash exceeds available earnings (Partial offset)", () => {
      // Rider has ₹100 (10,000p) in wallet.
      // Delivers COD order: Collects ₹450 (45,000p) cash. Payout is ₹50 (5,000p).
      // Available earnings before = 10,000 + 5,000 = 15,000p.
      // Net Deposit Due = max(0, 45,000 - 5,000 - 10,000) = 30,000p (₹300).
      // Offset applied = 15,000p.
      // New withdrawable earnings = 0p.
      // New floating cash = 30,000p.

      const { state: initialWallet } = createInitialRiderWallet("rider_cod_01", {
        kitMode: "UPFRONT_PAID",
      });
      initialWallet.withdrawableEarningsPaise = 10000;

      const res = processCodOrderSettlement({
        wallet: initialWallet,
        orderId: "ord_cod_001",
        orderCashPaise: 45000,
        payoutPaise: 5000,
      });

      expect(res.netting.netDepositDueToPlatformPaise).toBe(30000);
      expect(res.netting.offsetAppliedPaise).toBe(15000);
      expect(res.updatedWallet.withdrawableEarningsPaise).toBe(0);
      expect(res.updatedWallet.floatingCashPaise).toBe(30000);
      expect(res.updatedWallet.completedCodCount).toBe(1);
      expect(res.updatedWallet.lifetimeEarningsPaise).toBe(5000);
      expect(res.updatedWallet.lifetimeCashCollectedPaise).toBe(45000);
      expect(res.isCodLimitBreached).toBe(false);
      expect(res.isSoftWarningActive).toBe(false);

      // Verify double-entry ledger records
      expect(res.ledgerEntries).toHaveLength(4);
      expect(res.ledgerEntries[0].account).toBe("WITHDRAWABLE_EARNINGS");
      expect(res.ledgerEntries[0].creditPaise).toBe(5000); // Delivery payout
      expect(res.ledgerEntries[1].account).toBe("FLOATING_CASH_LIABILITY");
      expect(res.ledgerEntries[1].creditPaise).toBe(45000); // Cash collected
      expect(res.ledgerEntries[2].account).toBe("FLOATING_CASH_LIABILITY");
      expect(res.ledgerEntries[2].debitPaise).toBe(15000); // Netting offset on cash
      expect(res.ledgerEntries[3].account).toBe("WITHDRAWABLE_EARNINGS");
      expect(res.ledgerEntries[3].debitPaise).toBe(15000); // Netting offset on earnings
    });

    it("Case B: Instant netting when earnings exceed order cash (Zero deposit due, cash fully absorbed)", () => {
      // Rider has ₹500 (50,000p) in wallet.
      // Delivers COD order: Collects ₹200 (20,000p) cash. Payout is ₹60 (6,000p).
      // Total available = 50,000 + 6,000 = 56,000p.
      // Net Deposit Due = max(0, 20,000 - 6,000 - 50,000) = 0.
      // Offset applied = 20,000p.
      // Remaining withdrawable earnings = 56,000 - 20,000 = 36,000p (₹360).
      // Floating cash remains 0! Rider keeps the ₹200 cash as immediate payout realization.

      const { state: initialWallet } = createInitialRiderWallet("rider_cod_02", {
        kitMode: "UPFRONT_PAID",
      });
      initialWallet.withdrawableEarningsPaise = 50000;

      const res = processCodOrderSettlement({
        wallet: initialWallet,
        orderId: "ord_cod_002",
        orderCashPaise: 20000,
        payoutPaise: 6000,
      });

      expect(res.netting.netDepositDueToPlatformPaise).toBe(0);
      expect(res.netting.offsetAppliedPaise).toBe(20000);
      expect(res.netting.isAbsorbedEntirelyByEarnings).toBe(true);
      expect(res.updatedWallet.withdrawableEarningsPaise).toBe(36000);
      expect(res.updatedWallet.floatingCashPaise).toBe(0);
    });

    it("triggers soft warning at ₹1,200 (80%) and hard lock at ₹1,500 (100%)", () => {
      const { state: initialWallet } = createInitialRiderWallet("rider_cod_limits", {
        kitMode: "UPFRONT_PAID",
      });

      // Order 1: Collect ₹1,250 cash (125,000p), payout ₹50 (5,000p).
      // Net deposit due = 120,000p (₹1,200). Exactly soft warning limit!
      const res1 = processCodOrderSettlement({
        wallet: initialWallet,
        orderId: "ord_cod_limit_1",
        orderCashPaise: 125000,
        payoutPaise: 5000,
      });

      expect(res1.updatedWallet.floatingCashPaise).toBe(120000);
      expect(res1.isSoftWarningActive).toBe(true);
      expect(res1.isCodLimitBreached).toBe(false);
      expect(res1.updatedWallet.isCodLockedDueToLimit).toBe(false);

      // Check dispatch eligibility: Can still take COD, but gets warning message
      const eligibility1 = canRiderAcceptOrder(res1.updatedWallet, "COD");
      expect(eligibility1.allowed).toBe(true);
      expect(eligibility1.isSoftWarning).toBe(true);
      expect(eligibility1.softWarningMessage).toContain("COD SOFT WARNING");

      // Order 2: Collect ₹350 cash (35,000p), payout ₹50 (5,000p).
      // Net deposit due = 30,000p.
      // Floating cash becomes 120,000 + 30,000 = 150,000p (₹1,500). Hard limit breached!
      const res2 = processCodOrderSettlement({
        wallet: res1.updatedWallet,
        orderId: "ord_cod_limit_2",
        orderCashPaise: 35000,
        payoutPaise: 5000,
      });

      expect(res2.updatedWallet.floatingCashPaise).toBe(150000);
      expect(res2.isCodLimitBreached).toBe(true);
      expect(res2.updatedWallet.isCodLockedDueToLimit).toBe(true);

      // Check dispatch eligibility: COD orders are now HARD-LOCKED!
      const eligibility2 = canRiderAcceptOrder(res2.updatedWallet, "COD");
      expect(eligibility2.allowed).toBe(false);
      expect(eligibility2.reason).toContain("COD FLOATING CASH HARD LOCK");

      // But PREPAID orders are still allowed!
      const prepaidEligibility = canRiderAcceptOrder(res2.updatedWallet, "PREPAID");
      expect(prepaidEligibility.allowed).toBe(true);
    });
  });

  // ==========================================================================
  // 4. COD CASH DEPOSIT VIA UPI ENGINE
  // ==========================================================================
  describe("Rider COD Cash Deposit via UPI", () => {
    it("reduces floating cash liability and lifts hard lock when deposit is made", () => {
      const { state: initialWallet } = createInitialRiderWallet("rider_dep_01", {
        kitMode: "UPFRONT_PAID",
      });
      initialWallet.floatingCashPaise = 150000; // ₹1,500 (Locked)
      initialWallet.isCodLockedDueToLimit = true;

      // Rider deposits ₹1,000 (100,000p) via UPI
      const res = processCodDeposit({
        wallet: initialWallet,
        depositPaise: 100000,
        paymentRef: "UPI_AXIS_TXN_991823",
      });

      expect(res.updatedWallet.floatingCashPaise).toBe(50000); // ₹500 remaining
      expect(res.settledDebtPaise).toBe(100000);
      expect(res.excessCreditedToEarningsPaise).toBe(0);
      expect(res.codLockLifted).toBe(true);
      expect(res.updatedWallet.isCodLockedDueToLimit).toBe(false);
      expect(res.updatedWallet.lifetimeCashDepositedPaise).toBe(100000);

      // COD dispatch is now unlocked
      const eligibility = canRiderAcceptOrder(res.updatedWallet, "COD");
      expect(eligibility.allowed).toBe(true);
    });

    it("credits excess deposit to Withdrawable Earnings wallet when rider overpays", () => {
      const { state: initialWallet } = createInitialRiderWallet("rider_dep_02", {
        kitMode: "UPFRONT_PAID",
      });
      initialWallet.floatingCashPaise = 40000; // ₹400 debt
      initialWallet.withdrawableEarningsPaise = 10000; // ₹100 in wallet

      // Rider deposits ₹500 (50,000p)
      const res = processCodDeposit({
        wallet: initialWallet,
        depositPaise: 50000,
        paymentRef: "UPI_RAZORPAY_88812",
      });

      expect(res.updatedWallet.floatingCashPaise).toBe(0);
      expect(res.settledDebtPaise).toBe(40000);
      expect(res.excessCreditedToEarningsPaise).toBe(10000); // ₹100 excess
      expect(res.updatedWallet.withdrawableEarningsPaise).toBe(20000); // ₹100 original + ₹100 excess = ₹200
      expect(res.ledgerEntries).toHaveLength(2); // 1 clearing entry + 1 excess entry
    });
  });

  // ==========================================================================
  // 5. ONBOARDING KIT & ADVANCE DEDUCTION ENGINE
  // ==========================================================================
  describe("Onboarding Kit & Advance Deduction Engine", () => {
    it("Mode 1: ZERO_UPFRONT initializes with ₹1,200 liability and enforces PREPAID_FIRST", () => {
      const { state: wallet, initialEntries } = createInitialRiderWallet("rider_zero_upfront", {
        kitMode: "ZERO_UPFRONT",
        totalKitFeePaise: 120000,
        dailyInstallmentPaise: 5000,
        minOrdersBeforeCodUnlock: 10,
      });

      expect(wallet.onboarding.mode).toBe("ZERO_UPFRONT");
      expect(wallet.onboarding.totalKitFeePaise).toBe(120000);
      expect(wallet.onboarding.remainingKitLiabilityPaise).toBe(120000);
      expect(wallet.onboarding.isKitFullyPaid).toBe(false);
      expect(wallet.isPrepaidFirstLocked).toBe(true);
      expect(wallet.prepaidFirstUnlockReason).toContain("Completed 0/10 prepaid deliveries");

      // Verify COD dispatch is blocked
      const codCheck = canRiderAcceptOrder(wallet, "COD");
      expect(codCheck.allowed).toBe(false);
      expect(codCheck.reason).toContain("PREPAID_FIRST RESTRICTION");

      // Attempting to settle a COD order throws dispatch violation
      expect(() =>
        processCodOrderSettlement({
          wallet,
          orderId: "ord_illegal_cod",
          orderCashPaise: 10000,
          payoutPaise: 4000,
        })
      ).toThrow("Dispatch Violation: Rider rider_zero_upfront is restricted to PREPAID_FIRST");

      expect(initialEntries[0].account).toBe("KIT_RECEIVABLE");
      expect(initialEntries[0].debitPaise).toBe(120000);
    });

    it("Mode 2: UPFRONT_PAID starts with ₹0 kit liability and immediately enables COD", () => {
      const { state: wallet, initialEntries } = createInitialRiderWallet("rider_upfront_paid", {
        kitMode: "UPFRONT_PAID",
        totalKitFeePaise: 120000,
      });

      expect(wallet.onboarding.mode).toBe("UPFRONT_PAID");
      expect(wallet.onboarding.remainingKitLiabilityPaise).toBe(0);
      expect(wallet.onboarding.isKitFullyPaid).toBe(true);
      expect(wallet.isPrepaidFirstLocked).toBe(false);

      const codCheck = canRiderAcceptOrder(wallet, "COD");
      expect(codCheck.allowed).toBe(true);

      expect(initialEntries[0].type).toBe("KIT_UPFRONT_PAYMENT");
      expect(initialEntries[0].creditPaise).toBe(120000);
    });

    it("Mode 3: FOUNDER_NEGOTIATED_WAIVER provides full or partial kit waiver", () => {
      // 100% full waiver
      const { state: walletFullWaiver } = createInitialRiderWallet("rider_waiver_full", {
        kitMode: "FOUNDER_NEGOTIATED_WAIVER",
        totalKitFeePaise: 120000,
        waivedFeePaise: 120000,
      });

      expect(walletFullWaiver.onboarding.remainingKitLiabilityPaise).toBe(0);
      expect(walletFullWaiver.onboarding.isKitFullyPaid).toBe(true);
      expect(walletFullWaiver.isPrepaidFirstLocked).toBe(false);

      // 50% partial waiver (₹600 waived, ₹600 remaining)
      const { state: walletPartialWaiver } = createInitialRiderWallet("rider_waiver_partial", {
        kitMode: "FOUNDER_NEGOTIATED_WAIVER",
        totalKitFeePaise: 120000,
        waivedFeePaise: 60000,
      });

      expect(walletPartialWaiver.onboarding.remainingKitLiabilityPaise).toBe(60000);
      expect(walletPartialWaiver.onboarding.isKitFullyPaid).toBe(false);
      expect(walletPartialWaiver.isPrepaidFirstLocked).toBe(true);
    });

    it("deducts daily micro-installments from withdrawable earnings with partial fallback", () => {
      const { state: initialWallet } = createInitialRiderWallet("rider_micro_deduct", {
        kitMode: "ZERO_UPFRONT",
        totalKitFeePaise: 120000, // ₹1,200
        dailyInstallmentPaise: 5000, // ₹50 / day
      });

      // Rider has earned ₹80 (8,000p) from prepaid orders
      initialWallet.withdrawableEarningsPaise = 8000;

      // Day 1 Deduction: Standard ₹50 deducted
      const res1 = processKitInstallmentDeduction({
        wallet: initialWallet,
      });

      expect(res1.deductedPaise).toBe(5000);
      expect(res1.updatedWallet.withdrawableEarningsPaise).toBe(3000); // ₹30 left
      expect(res1.remainingLiabilityPaise).toBe(115000); // ₹1,150 left
      expect(res1.isKitFullyPaid).toBe(false);

      // Day 2 Deduction: Wallet only has ₹30, daily installment is ₹50
      // With allowPartial=true, it deducts the available ₹30
      const res2 = processKitInstallmentDeduction({
        wallet: res1.updatedWallet,
        allowPartial: true,
      });

      expect(res2.deductedPaise).toBe(3000);
      expect(res2.updatedWallet.withdrawableEarningsPaise).toBe(0);
      expect(res2.remainingLiabilityPaise).toBe(112000); // ₹1,120 left

      // Day 3 Deduction: Wallet has ₹0 -> ₹0 deducted
      const res3 = processKitInstallmentDeduction({
        wallet: res2.updatedWallet,
      });

      expect(res3.deductedPaise).toBe(0);
      expect(res3.updatedWallet.withdrawableEarningsPaise).toBe(0);
      expect(res3.remainingLiabilityPaise).toBe(112000);
    });

    it("automatically unlocks PREPAID_FIRST when rider completes 10 prepaid orders", () => {
      const { state: initialWallet } = createInitialRiderWallet("rider_milestone", {
        kitMode: "ZERO_UPFRONT",
        minOrdersBeforeCodUnlock: 10,
      });

      let currentWallet = initialWallet;
      expect(currentWallet.isPrepaidFirstLocked).toBe(true);

      // Complete 9 prepaid orders
      for (let i = 1; i <= 9; i++) {
        const res = processPrepaidOrderSettlement({
          wallet: currentWallet,
          orderId: `ord_prep_${i}`,
          payoutPaise: 5000,
        });
        currentWallet = res.updatedWallet;
        expect(currentWallet.isPrepaidFirstLocked).toBe(true);
        expect(res.unlockedCodThisOrder).toBe(false);
      }

      // Complete 10th prepaid order -> PREPAID_FIRST unlocks!
      const res10 = processPrepaidOrderSettlement({
        wallet: currentWallet,
        orderId: "ord_prep_10",
        payoutPaise: 5000,
      });

      expect(res10.updatedWallet.completedDeliveriesCount).toBe(10);
      expect(res10.updatedWallet.isPrepaidFirstLocked).toBe(false);
      expect(res10.unlockedCodThisOrder).toBe(true);
      expect(res10.updatedWallet.prepaidFirstUnlockReason).toContain("Trust threshold satisfied");

      // Rider can now receive COD orders!
      const codCheck = canRiderAcceptOrder(res10.updatedWallet, "COD");
      expect(codCheck.allowed).toBe(true);
    });
  });

  // ==========================================================================
  // 6. EARLY PAYOUT / INSTANT CASHOUT ENGINE
  // ==========================================================================
  describe("Early Payout / Instant Cashout Engine", () => {
    it("deducts flat convenience fee (₹10.00) and calculates net rider payout & platform revenue", () => {
      const { state: initialWallet } = createInitialRiderWallet("rider_early_payout", {
        kitMode: "UPFRONT_PAID",
      });
      initialWallet.withdrawableEarningsPaise = 50000; // ₹500.00 available

      // Rider requests instant cashout of ₹300.00 (30,000 paise)
      // Flat fee = ₹10.00 (1,000 paise)
      // Net rider disbursement = ₹290.00 (29,000 paise)
      // Platform revenue = ₹10.00 (1,000 paise)
      const res = processEarlyPayout({
        wallet: initialWallet,
        requestedPaise: 30000,
        config: { flatFeePaise: 1000 },
      });

      expect(res.calculation.isAllowed).toBe(true);
      expect(res.calculation.convenienceFeePaise).toBe(1000);
      expect(res.calculation.netRiderDisbursedPaise).toBe(29000);
      expect(res.calculation.platformRevenuePaise).toBe(1000);

      expect(res.updatedWallet.withdrawableEarningsPaise).toBe(20000); // 50,000 - 30,000 = 20,000p (₹200)
      expect(res.updatedWallet.lifetimeInstantCashoutsPaise).toBe(30000);
      expect(res.updatedWallet.lifetimeConvenienceFeesPaidPaise).toBe(1000);
      expect(res.updatedWallet.dailyCashoutCount).toBe(1);

      // Verify ledger entries
      expect(res.ledgerEntries).toHaveLength(2);
      expect(res.ledgerEntries[0].type).toBe("EARLY_CASHOUT_WITHDRAWAL");
      expect(res.ledgerEntries[0].debitPaise).toBe(30000);
      expect(res.ledgerEntries[1].type).toBe("EARLY_CASHOUT_FEE_PLATFORM");
      expect(res.ledgerEntries[1].account).toBe("PLATFORM_REVENUE");
      expect(res.ledgerEntries[1].creditPaise).toBe(1000);
    });

    it("rejects cashout below minimum threshold (₹100)", () => {
      const { state: wallet } = createInitialRiderWallet("rider_min_cashout");
      wallet.withdrawableEarningsPaise = 50000;

      // Request ₹50 (5,000 paise) < ₹100 min threshold
      expect(() =>
        processEarlyPayout({
          wallet,
          requestedPaise: 5000,
          config: { minCashoutAmountPaise: 10000 },
        })
      ).toThrow("below minimum cashout threshold");
    });

    it("rejects cashout exceeding withdrawable earnings balance", () => {
      const { state: wallet } = createInitialRiderWallet("rider_insufficient");
      wallet.withdrawableEarningsPaise = 15000; // ₹150

      // Request ₹200 (20,000 paise) > ₹150 balance
      expect(() =>
        processEarlyPayout({
          wallet,
          requestedPaise: 20000,
        })
      ).toThrow("Insufficient withdrawable earnings balance");
    });

    it("enforces maximum daily cashout frequency limit", () => {
      const { state: wallet } = createInitialRiderWallet("rider_daily_limit");
      wallet.withdrawableEarningsPaise = 100000; // ₹1,000
      wallet.dailyCashoutCount = 3;
      wallet.lastCashoutDate = new Date().toISOString().slice(0, 10);

      // 4th cashout on same day rejected
      expect(() =>
        processEarlyPayout({
          wallet,
          requestedPaise: 10000,
          config: { maxDailyCashouts: 3 },
        })
      ).toThrow("Instant Cashout Limit Reached");
    });
  });

  // ==========================================================================
  // 7. STANDARD WEEKLY SETTLEMENT CYCLE
  // ==========================================================================
  describe("Standard Weekly Settlement Cycle", () => {
    it("disburses 100% of withdrawable balance to bank with ZERO convenience fee", () => {
      const { state: initialWallet } = createInitialRiderWallet("rider_weekly");
      initialWallet.withdrawableEarningsPaise = 85000; // ₹850.00

      const res = processWeeklySettlement({ wallet: initialWallet });

      expect(res.disbursedPaise).toBe(85000);
      expect(res.updatedWallet.withdrawableEarningsPaise).toBe(0);
      expect(res.ledgerEntries).toHaveLength(1);
      expect(res.ledgerEntries[0].type).toBe("WEEKLY_PAYOUT_DISBURSEMENT");
      expect(res.ledgerEntries[0].debitPaise).toBe(85000);
    });

    it("handles zero balance gracefully during weekly settlement", () => {
      const { state: initialWallet } = createInitialRiderWallet("rider_weekly_zero");
      initialWallet.withdrawableEarningsPaise = 0;

      const res = processWeeklySettlement({ wallet: initialWallet });
      expect(res.disbursedPaise).toBe(0);
      expect(res.ledgerEntries).toHaveLength(0);
    });
  });

  // ==========================================================================
  // 8. DOUBLE-ENTRY LEDGER INTEGRITY AUDIT
  // ==========================================================================
  describe("Double-Entry Ledger Integrity Audit", () => {
    it("verifies that sum of debits and credits strictly matches wallet balances with 0 paise drift", () => {
      const engine = new ZomatoRiderWalletEngine();
      engine.registerRider("rider_audit_01", {
        kitMode: "ZERO_UPFRONT",
        totalKitFeePaise: 120000,
        dailyInstallmentPaise: 5000,
        minOrdersBeforeCodUnlock: 2,
      });

      // Step 1: Deliver 2 prepaid orders (unlcoking COD)
      engine.settlePrepaidOrder("rider_audit_01", "ord_p1", 6000); // +₹60
      engine.settlePrepaidOrder("rider_audit_01", "ord_p2", 8000); // +₹80 (Total = ₹140)

      // Step 2: Deduct 1 kit installment of ₹50
      engine.deductKitInstallment("rider_audit_01", 5000); // -₹50 (Wallet = ₹90)

      // Step 3: Deliver 1 COD order: Collect ₹250 cash, payout ₹50
      // Available = 9,000 + 5,000 = 14,000p. Cash = 25,000p.
      // Net deposit due = 11,000p (₹110). Wallet becomes ₹0.
      engine.settleCodOrder("rider_audit_01", "ord_c1", 25000, 5000);

      // Step 4: Rider deposits ₹110 via UPI
      engine.depositCodCash("rider_audit_01", 11000, "UPI_AUDIT_01");

      // Step 5: Deliver another prepaid order: +₹200
      engine.settlePrepaidOrder("rider_audit_01", "ord_p3", 20000);

      // Step 6: Early payout of ₹150 (Fee ₹10, Net ₹140)
      engine.requestEarlyPayout("rider_audit_01", 15000);

      // Verify Audit
      const audit = engine.auditRiderLedger("rider_audit_01");
      expect(audit.isValid).toBe(true);
      expect(audit.errors).toHaveLength(0);
      expect(audit.calculatedWithdrawablePaise).toBe(audit.actualWithdrawablePaise);
      expect(audit.calculatedFloatingCashPaise).toBe(audit.actualFloatingCashPaise);
      expect(audit.actualWithdrawablePaise).toBe(5000); // ₹50 remaining
      expect(audit.actualFloatingCashPaise).toBe(0); // ₹0 debt remaining
      expect(engine.getTotalPlatformEarlyPayoutRevenuePaise()).toBe(1000); // ₹10 fee earned
    });
  });

  // ==========================================================================
  // 9. END-TO-END LIFECYCLE SIMULATION (ORCHESTRATOR CLASS)
  // ==========================================================================
  describe("ZomatoRiderWalletEngine Complete Lifecycle Simulation", () => {
    it("simulates full lifecycle: ZERO_UPFRONT onboarding -> Prepaid First -> COD Unlock -> Netting -> Kit Repayment -> Payout", () => {
      const engine = new ZomatoRiderWalletEngine({
        onboarding: {
          kitMode: "ZERO_UPFRONT",
          totalKitFeePaise: 100000, // ₹1,000 kit
          dailyInstallmentPaise: 10000, // ₹100 daily deduction
          minOrdersBeforeCodUnlock: 3, // 3 prepaid orders to unlock COD
          waivedFeePaise: 0,
          upfrontPaidPaise: 0,
          minKitRepaidPctBeforeCodUnlock: 0,
        },
        codLimits: {
          cashInHandLimitPaise: 150000, // ₹1,500 hard lock
          softWarningLimitPaise: 120000, // ₹1,200 soft warning
          upiVpaPayee: "orderking.fleet@axisbank",
          merchantName: "OrderKing Rider Cash Settlement",
        },
      });

      // 1. Onboard Rider
      const wallet = engine.registerRider("rider_rahul");
      expect(wallet.isPrepaidFirstLocked).toBe(true);
      expect(wallet.onboarding.remainingKitLiabilityPaise).toBe(100000);

      // 2. Initial COD dispatch check fails
      const check1 = engine.checkDispatchEligibility("rider_rahul", "COD");
      expect(check1.allowed).toBe(false);

      // 3. Complete 3 Prepaid orders
      engine.settlePrepaidOrder("rider_rahul", "p1", 5000);
      engine.settlePrepaidOrder("rider_rahul", "p2", 6000);
      const prep3 = engine.settlePrepaidOrder("rider_rahul", "p3", 7000);
      expect(prep3.unlockedCodThisOrder).toBe(true);

      const updatedWallet = engine.getWallet("rider_rahul");
      expect(updatedWallet.withdrawableEarningsPaise).toBe(18000); // ₹180
      expect(updatedWallet.isPrepaidFirstLocked).toBe(false);

      // 4. COD dispatch is now allowed!
      const check2 = engine.checkDispatchEligibility("rider_rahul", "COD");
      expect(check2.allowed).toBe(true);

      // 5. Complete COD Order: Collect ₹400 cash (40,000p), payout ₹50 (5,000p)
      // Total available earnings = 18,000 + 5,000 = 23,000p.
      // Net deposit due = 40,000 - 23,000 = 17,000p (₹170).
      // Withdrawable earnings = 0p. Floating cash = 17,000p.
      const codRes = engine.settleCodOrder("rider_rahul", "c1", 40000, 5000);
      expect(codRes.netting.netDepositDueToPlatformPaise).toBe(17000);
      expect(codRes.updatedWallet.withdrawableEarningsPaise).toBe(0);
      expect(codRes.updatedWallet.floatingCashPaise).toBe(17000);

      // 6. Complete Prepaid Order: Payout ₹300 (30,000p)
      engine.settlePrepaidOrder("rider_rahul", "p4", 30000);

      // 7. Deduct kit installment: ₹100 (10,000p)
      const kitRes = engine.deductKitInstallment("rider_rahul");
      expect(kitRes.deductedPaise).toBe(10000);
      expect(kitRes.remainingLiabilityPaise).toBe(90000); // ₹900 remaining
      expect(engine.getWallet("rider_rahul").withdrawableEarningsPaise).toBe(20000); // ₹200 remaining

      // 8. Instant Cashout: Request ₹150 (15,000p)
      const cashoutRes = engine.requestEarlyPayout("rider_rahul", 15000);
      expect(cashoutRes.calculation.convenienceFeePaise).toBe(1000); // ₹10 flat fee
      expect(cashoutRes.calculation.netRiderDisbursedPaise).toBe(14000); // ₹140 net
      expect(engine.getWallet("rider_rahul").withdrawableEarningsPaise).toBe(5000); // ₹50 remaining

      // 9. Weekly Settlement Cycle
      const weeklyRes = engine.processWeeklySettlement("rider_rahul");
      expect(weeklyRes.disbursedPaise).toBe(5000); // ₹50 disbursed
      expect(engine.getWallet("rider_rahul").withdrawableEarningsPaise).toBe(0);

      // 10. Audit ledger
      const audit = engine.auditRiderLedger("rider_rahul");
      expect(audit.isValid).toBe(true);
      expect(audit.errors).toHaveLength(0);
    });
  });

  // ==========================================================================
  // 10. CURRENCY UTILITIES
  // ==========================================================================
  describe("Currency Formatting Utilities", () => {
    it("formats paise to Indian Rupee strings with ₹ symbol and decimals", () => {
      expect(formatPaiseToInr(120000)).toBe("₹1200.00");
      expect(formatPaiseToInr(5050)).toBe("₹50.50");
      expect(formatPaiseToInr(0)).toBe("₹0.00");
      expect(formatPaiseToRupeesString(1500)).toBe("15.00");
    });
  });
});
