/**
 * OrderKing Rider Handover Engine
 * Invariants: 4-digit Delivery Handover OTP Gate, COD Cash Limit Reconciliation (₹1,500 Hard Cutoff)
 */
export interface HandoverValidationResult {
  success: boolean;
  code: "OTP_VERIFIED" | "INVALID_OTP" | "COD_LIMIT_EXCEEDED" | "ORDER_STATUS_MISMATCH";
  message: string;
  nextStatus?: "DELIVERED";
  frozenState?: "ON_THE_WAY";
  payoutAllowed?: boolean;
}
export class CustomerDeliveryOTPValidator {
  /**
   * Validates customer 4-digit handover OTP
   * Prevents order status transition to DELIVERED without matching OTP
   */
  public static validateHandoverOTP(
    enteredOtp: string,
    actualOtp: string,
    currentOrderStatus: string
  ): HandoverValidationResult {
    if (currentOrderStatus !== "ON_THE_WAY") {
      return {
        success: false,
        code: "ORDER_STATUS_MISMATCH",
        message: `Order must be in ON_THE_WAY status. Current status: ${currentOrderStatus}`,
      };
    }
    const cleanInput = enteredOtp.trim();
    if (!/^\d{4}$/.test(cleanInput)) {
      return {
        success: false,
        code: "INVALID_OTP",
        message: "Handover OTP must be a valid 4-digit numeric code.",
      };
    }
    if (cleanInput !== actualOtp) {
      return {
        success: false,
        code: "INVALID_OTP",
        message: "Incorrect delivery OTP. Order state frozen in ON_THE_WAY. Payout release locked.",
        frozenState: "ON_THE_WAY",
        payoutAllowed: false,
      };
    }
    return {
      success: true,
      code: "OTP_VERIFIED",
      message: "Delivery OTP verified successfully.",
      nextStatus: "DELIVERED",
      payoutAllowed: true,
    };
  }
  /**
   * Real-time COD Cash Collection Limit Gate
   * Soft warning at ₹1,200, COD cutoff at ₹1,500, Hard lock at ₹2,000
   */
  public static evaluateFloatingCashStatus(currentCashPaise: number): {
    status: "NORMAL" | "WARNING" | "COD_PAUSED" | "ACCOUNT_LOCKED";
    currentCashInr: number;
    limitInr: number;
    actionRequired?: string;
  } {
    const cashInr = currentCashPaise / 100;
    const limitInr = 1500;
    if (cashInr >= 2000) {
      return {
        status: "ACCOUNT_LOCKED",
        currentCashInr: cashInr,
        limitInr,
        actionRequired: "Hard limit exceeded. Account paused. Deposit via UPI to orderking@ybl immediately.",
      };
    }
    if (cashInr >= 1500) {
      return {
        status: "COD_PAUSED",
        currentCashInr: cashInr,
        limitInr,
        actionRequired: "COD order assignments paused. Deposit cash to restore full shift eligibility.",
      };
    }
    if (cashInr >= 1200) {
      return {
        status: "WARNING",
        currentCashInr: cashInr,
        limitInr,
        actionRequired: "Approaching ₹1,500 threshold. Prepare to deposit cash.",
      };
    }
    return {
      status: "NORMAL",
      currentCashInr: cashInr,
      limitInr,
    };
  }
}
