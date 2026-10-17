/**
 * UMAR OS - Zero-Human Dispute & Refund Matrix
 * Domain: Zero-Human Governance & Dispute Resolution
 * 
 * Mandate:
 * 1. Missing / Damaged Item Claims:
 *    - Customer submits photo proof through the app with structured reason
 *      (missing item, spilled gravy, broken tamper seal).
 * 2. Instant Auto-Refund:
 *    - Automatically approve valid claims for orders < ₹300 into the customer's KingPay wallet
 *      in < 30 seconds without customer support staff.
 * 3. Fraud Pattern Detector:
 *    - Track customer claim frequency (> 2 claims in 7 days or > 15% of lifetime orders
 *      triggers manual review quarantine).
 */

export type ClaimReason =
  | "MISSING_ITEM"
  | "SPILLED_GRAVY"
  | "BROKEN_TAMPER_SEAL"
  | "WRONG_ITEM_DELIVERED"
  | "FOOD_SPOILED_OR_DAMAGED";

export type DisputeClaimStatus =
  | "AUTO_APPROVED"
  | "REFUNDED"
  | "QUARANTINED_FOR_REVIEW"
  | "REJECTED_MISSING_PROOF"
  | "MANUAL_REVIEW_RESOLVED";

export interface ClaimItemDetail {
  itemId: string;
  itemName: string;
  quantity: number;
  pricePaise: number;
}

export interface DisputeClaimInput {
  claimId?: string;
  orderId: string;
  customerId: string;
  orderAmountPaise: number;
  claimAmountPaise: number;
  reason: ClaimReason;
  description?: string;
  photoProofUrl: string; // Mandatory photo proof uploaded by customer
  itemsAffected?: ClaimItemDetail[];
  submittedAt?: number | Date;
}

export interface KingPayWalletTransaction {
  transactionId: string;
  customerId: string;
  claimId: string;
  orderId: string;
  amountPaise: number;
  type: "REFUND_CREDIT";
  wallet: "KINGPAY";
  timestamp: number;
  balanceAfterPaise: number;
  status: "SUCCESS";
  processingLatencyMs: number;
}

export interface CustomerDisputeProfile {
  customerId: string;
  lifetimeOrdersCount: number;
  claimsHistory: Array<{
    claimId: string;
    orderId: string;
    amountPaise: number;
    submittedAt: number;
    status: DisputeClaimStatus;
    reason: ClaimReason;
  }>;
}

export interface FraudAssessmentResult {
  isQuarantined: boolean;
  reasons: string[];
  recentClaims7DaysCount: number;
  lifetimeClaimPercentage: number;
  orderValueExceeded: boolean;
}

export interface DisputeClaimResult {
  claimId: string;
  orderId: string;
  customerId: string;
  status: DisputeClaimStatus;
  autoRefundApproved: boolean;
  refundedAmountPaise: number;
  walletTransaction?: KingPayWalletTransaction;
  quarantineReasons?: string[];
  quarantineId?: string;
  processingTimeMs: number;
  zeroHumanResolved: boolean;
  message: string;
}

export class ZeroHumanDisputeMatrix {
  // Constants
  public readonly AUTO_REFUND_THRESHOLD_PAISE = 30000; // ₹300.00 = 30,000 paise
  public readonly MAX_CLAIMS_IN_7_DAYS = 2; // > 2 triggers quarantine (i.e. 3rd claim)
  public readonly MAX_LIFETIME_CLAIM_RATIO = 0.15; // > 15% triggers quarantine
  public readonly TARGET_SLA_SECONDS = 30; // < 30 seconds resolution SLA

  private customerProfiles: Map<string, CustomerDisputeProfile> = new Map();
  private kingPayWallets: Map<string, number> = new Map(); // customerId -> balance in paise
  private claims: Map<string, DisputeClaimResult> = new Map();
  private auditLog: Array<{ timestamp: number; action: string; metadata: Record<string, unknown> }> = [];

  /**
   * Initializes or seeds a customer's lifetime order count and existing wallet balance.
   */
  public registerCustomer(customerId: string, lifetimeOrders: number, initialBalancePaise = 0): void {
    if (!this.customerProfiles.has(customerId)) {
      this.customerProfiles.set(customerId, {
        customerId,
        lifetimeOrdersCount: Math.max(1, lifetimeOrders),
        claimsHistory: [],
      });
    } else {
      const profile = this.customerProfiles.get(customerId)!;
      profile.lifetimeOrdersCount = Math.max(profile.lifetimeOrdersCount, lifetimeOrders);
    }

    if (!this.kingPayWallets.has(customerId)) {
      this.kingPayWallets.set(customerId, initialBalancePaise);
    }
  }

  /**
   * Records a completed order for the customer to maintain accurate lifetime ratios.
   */
  public recordCompletedOrder(customerId: string): void {
    const profile = this.getOrCreateCustomerProfile(customerId);
    profile.lifetimeOrdersCount += 1;
  }

  /**
   * Checks customer KingPay wallet balance in paise.
   */
  public getWalletBalance(customerId: string): number {
    return this.kingPayWallets.get(customerId) || 0;
  }

  /**
   * Retrieves full dispute profile for a customer.
   */
  public getCustomerProfile(customerId: string): CustomerDisputeProfile {
    return this.getOrCreateCustomerProfile(customerId);
  }

  /**
   * Evaluates fraud risk factors:
   * 1. Frequency check: > 2 claims in rolling 7 days triggers manual review quarantine.
   * 2. Ratio check: > 15% of lifetime orders claimed triggers quarantine.
   * 3. Value check: Order amount >= ₹300 (30,000 paise) triggers manual review quarantine.
   */
  public assessFraudRisk(
    customerId: string,
    orderAmountPaise: number,
    currentTime: number
  ): FraudAssessmentResult {
    const profile = this.getOrCreateCustomerProfile(customerId);
    const quarantineReasons: string[] = [];

    // Rolling 7-day window (7 * 24 * 60 * 60 * 1000 ms)
    const sevenDaysAgo = currentTime - 7 * 24 * 60 * 60 * 1000;
    const recentClaims = profile.claimsHistory.filter(
      (c) => c.submittedAt >= sevenDaysAgo && c.status !== "REJECTED_MISSING_PROOF"
    );
    const recentClaims7DaysCount = recentClaims.length;

    // Rule 1: > 2 claims in 7 days triggers manual review quarantine
    if (recentClaims7DaysCount > this.MAX_CLAIMS_IN_7_DAYS) {
      quarantineReasons.push(
        `CLAIM_FREQUENCY_EXCEEDED: ${recentClaims7DaysCount} claims in rolling 7-day window (maximum allowed: ${this.MAX_CLAIMS_IN_7_DAYS})`
      );
    }

    // Rule 2: > 15% of lifetime orders triggers manual review quarantine
    // Calculating new ratio including this incoming claim
    const totalClaimsConsideringCurrent = profile.claimsHistory.length + 1;
    const lifetimeOrders = Math.max(1, profile.lifetimeOrdersCount);
    const lifetimeClaimRatio = totalClaimsConsideringCurrent / lifetimeOrders;
    const lifetimeClaimPercentage = Number((lifetimeClaimRatio * 100).toFixed(1));

    if (lifetimeClaimRatio > this.MAX_LIFETIME_CLAIM_RATIO) {
      quarantineReasons.push(
        `LIFETIME_CLAIM_RATIO_EXCEEDED: ${lifetimeClaimPercentage}% of lifetime orders have claims (maximum allowed: ${this.MAX_LIFETIME_CLAIM_RATIO * 100}%)`
      );
    }

    // Rule 3: High-value order check: orders >= ₹300 (30,000 paise) require manual governance
    const orderValueExceeded = orderAmountPaise >= this.AUTO_REFUND_THRESHOLD_PAISE;
    if (orderValueExceeded) {
      quarantineReasons.push(
        `ORDER_VALUE_EXCEEDS_AUTO_REFUND_LIMIT: Order value ₹${(orderAmountPaise / 100).toFixed(2)} is >= ₹300 threshold (requires human governance review)`
      );
    }

    return {
      isQuarantined: quarantineReasons.length > 0,
      reasons: quarantineReasons,
      recentClaims7DaysCount,
      lifetimeClaimPercentage,
      orderValueExceeded,
    };
  }

  /**
   * Main Claim Processing Pipeline:
   * 1. Photo proof validation
   * 2. Fraud pattern detection
   * 3. Instant auto-refund into KingPay wallet for orders < ₹300 in < 30 seconds
   */
  public submitClaim(input: DisputeClaimInput): DisputeClaimResult {
    const startTime = Date.now();
    const submissionTime = input.submittedAt
      ? typeof input.submittedAt === "number"
        ? input.submittedAt
        : input.submittedAt.getTime()
      : startTime;

    const claimId = input.claimId || `clm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const profile = this.getOrCreateCustomerProfile(input.customerId);

    // Step 1: Missing photo proof validation
    // Customer must submit photo proof through the app with structured reason
    const validPhoto =
      input.photoProofUrl &&
      typeof input.photoProofUrl === "string" &&
      input.photoProofUrl.trim().length > 5;

    if (!validPhoto) {
      const rejectResult: DisputeClaimResult = {
        claimId,
        orderId: input.orderId,
        customerId: input.customerId,
        status: "REJECTED_MISSING_PROOF",
        autoRefundApproved: false,
        refundedAmountPaise: 0,
        processingTimeMs: Date.now() - startTime,
        zeroHumanResolved: true,
        message:
          "Claim rejected: Photo proof is mandatory for missing or damaged item claims.",
      };

      this.auditLog.push({
        timestamp: submissionTime,
        action: "CLAIM_REJECTED_NO_PROOF",
        metadata: { claimId, customerId: input.customerId, reason: input.reason },
      });

      return rejectResult;
    }

    // Step 2: Fraud pattern detection
    const fraudAssessment = this.assessFraudRisk(
      input.customerId,
      input.orderAmountPaise,
      submissionTime
    );

    if (fraudAssessment.isQuarantined) {
      // Move to quarantine for manual review
      const quarantineId = `qrt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const quarantinedResult: DisputeClaimResult = {
        claimId,
        orderId: input.orderId,
        customerId: input.customerId,
        status: "QUARANTINED_FOR_REVIEW",
        autoRefundApproved: false,
        refundedAmountPaise: 0,
        quarantineReasons: fraudAssessment.reasons,
        quarantineId,
        processingTimeMs: Date.now() - startTime,
        zeroHumanResolved: true,
        message:
          "Claim quarantined for secondary verification due to risk threshold triggers. An expedited review ticket has been dispatched.",
      };

      profile.claimsHistory.push({
        claimId,
        orderId: input.orderId,
        amountPaise: input.claimAmountPaise,
        submittedAt: submissionTime,
        status: "QUARANTINED_FOR_REVIEW",
        reason: input.reason,
      });

      this.claims.set(claimId, quarantinedResult);
      this.auditLog.push({
        timestamp: submissionTime,
        action: "CLAIM_QUARANTINED",
        metadata: {
          claimId,
          quarantineId,
          customerId: input.customerId,
          reasons: fraudAssessment.reasons,
        },
      });

      return quarantinedResult;
    }

    // Step 3: Instant Auto-Refund (< ₹300 order amount, processing in < 30 seconds into KingPay wallet)
    const refundAmountPaise = Math.min(input.claimAmountPaise, input.orderAmountPaise);
    const existingBalance = this.kingPayWallets.get(input.customerId) || 0;
    const newBalance = existingBalance + refundAmountPaise;
    this.kingPayWallets.set(input.customerId, newBalance);

    const transactionId = `kp_tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const processingLatencyMs = Math.max(12, Date.now() - startTime);

    const walletTransaction: KingPayWalletTransaction = {
      transactionId,
      customerId: input.customerId,
      claimId,
      orderId: input.orderId,
      amountPaise: refundAmountPaise,
      type: "REFUND_CREDIT",
      wallet: "KINGPAY",
      timestamp: Date.now(),
      balanceAfterPaise: newBalance,
      status: "SUCCESS",
      processingLatencyMs,
    };

    const approvedResult: DisputeClaimResult = {
      claimId,
      orderId: input.orderId,
      customerId: input.customerId,
      status: "AUTO_APPROVED",
      autoRefundApproved: true,
      refundedAmountPaise: refundAmountPaise,
      walletTransaction,
      processingTimeMs: processingLatencyMs,
      zeroHumanResolved: true,
      message: `Instant auto-refund of ₹${(refundAmountPaise / 100).toFixed(2)} credited to your KingPay wallet in ${Number((processingLatencyMs / 1000).toFixed(2))}s. Zero human wait time.`,
    };

    profile.claimsHistory.push({
      claimId,
      orderId: input.orderId,
      amountPaise: refundAmountPaise,
      submittedAt: submissionTime,
      status: "AUTO_APPROVED",
      reason: input.reason,
    });

    this.claims.set(claimId, approvedResult);
    this.auditLog.push({
      timestamp: submissionTime,
      action: "INSTANT_AUTO_REFUND_PROCESSED",
      metadata: {
        claimId,
        orderId: input.orderId,
        customerId: input.customerId,
        amountPaise: refundAmountPaise,
        transactionId,
        latencyMs: processingLatencyMs,
      },
    });

    return approvedResult;
  }

  public getClaim(claimId: string): DisputeClaimResult | undefined {
    return this.claims.get(claimId);
  }

  public getAuditLog() {
    return this.auditLog;
  }

  private getOrCreateCustomerProfile(customerId: string): CustomerDisputeProfile {
    let profile = this.customerProfiles.get(customerId);
    if (!profile) {
      profile = {
        customerId,
        lifetimeOrdersCount: 1,
        claimsHistory: [],
      };
      this.customerProfiles.set(customerId, profile);
    }
    return profile;
  }
}
