/**
 * AutomatedFraudPreventionEngine.ts
 * 
 * Stress-tests and safeguards every growth loop from fraud, abuse, and margin leakage.
 * In India, referral programs are heavily abused via device emulators, temporary numbers, and UPI fraud.
 * This engine guarantees positive unit economics.
 */

export interface ReferralTransactionContext {
  referrerId: string;
  refereeId: string;
  refereeDeviceId: string;
  refereeIpAddress: string;
  refereeUpiId: string;
  channel: string;
}

export interface UserHistoryContext {
  completedOrdersCount: number;
  totalGrossSpendINR: number;
  daysSinceRegistration: number;
}

export class AutomatedFraudPreventionEngine {
  
  // Real-world anti-fraud thresholds
  private readonly MIN_ORDERS_BEFORE_PAYOUT = 1;
  private readonly MIN_SPEND_BEFORE_PAYOUT_INR = 200; // Must be higher than the ₹150 referral bonus
  private readonly SUSPICIOUS_IP_VELOCITY_LIMIT = 3; // Max 3 signups per IP per 24h

  // Mock databases for velocity checks (in prod: Redis)
  private ipVelocityLedger: Map<string, number> = new Map();
  private deviceFingerprintLedger: Set<string> = new Set();
  private upiPayoutLedger: Set<string> = new Set();

  /**
   * Evaluates if a referral payout should be processed or flagged for fraud.
   */
  public evaluateReferralPayout(
    context: ReferralTransactionContext, 
    refereeHistory: UserHistoryContext
  ): { isApproved: boolean; rejectionReason?: string } {
    
    // 1. Minimum Viable Engagement (Margin Leakage Protection)
    // Never pay a CAC if the customer hasn't delivered a positive contribution margin.
    if (refereeHistory.completedOrdersCount < this.MIN_ORDERS_BEFORE_PAYOUT) {
      return { isApproved: false, rejectionReason: 'REFEREE_HAS_NO_COMPLETED_ORDERS' };
    }

    if (refereeHistory.totalGrossSpendINR < this.MIN_SPEND_BEFORE_PAYOUT_INR) {
      return { isApproved: false, rejectionReason: 'REFEREE_SPEND_BELOW_PROFITABILITY_THRESHOLD' };
    }

    // 2. Device Fingerprint Cloning (Emulator Fraud)
    if (this.deviceFingerprintLedger.has(context.refereeDeviceId)) {
      return { isApproved: false, rejectionReason: 'DEVICE_FINGERPRINT_ALREADY_REWARDED' };
    }

    // 3. IP Velocity Check (Botnet / Click-Farm Protection)
    const currentIpCount = this.ipVelocityLedger.get(context.refereeIpAddress) || 0;
    if (currentIpCount >= this.SUSPICIOUS_IP_VELOCITY_LIMIT) {
      return { isApproved: false, rejectionReason: 'IP_VELOCITY_EXCEEDED' };
    }

    // 4. UPI Laundering Check (One UPI ID collecting multiple bounties)
    if (this.upiPayoutLedger.has(context.refereeUpiId)) {
      return { isApproved: false, rejectionReason: 'UPI_ID_ALREADY_REWARDED' };
    }

    return { isApproved: true };
  }

  /**
   * Commits the clean transaction to the ledger to prevent future double-spending.
   */
  public commitCleanTransaction(context: ReferralTransactionContext) {
    this.deviceFingerprintLedger.add(context.refereeDeviceId);
    this.upiPayoutLedger.add(context.refereeUpiId);
    
    const currentIpCount = this.ipVelocityLedger.get(context.refereeIpAddress) || 0;
    this.ipVelocityLedger.set(context.refereeIpAddress, currentIpCount + 1);
  }
}
