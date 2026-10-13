/**
 * Crown Promotional Credits — safe eligibility calculations.
 *
 * This module deliberately contains NO browser wallet, cash payout, UPI transfer,
 * stored credit balance, or self-approval. Amounts shown to customers are NOT
 * available until a trusted server verifies a settled merchant transaction,
 * checks refunds/fees, and atomically posts a discount entitlement to a ledger.
 */
export type MicroTaskType =
  | "REST_PHOTO_VERIFICATION"
  | "MENU_ITEM_REVIEW"
  | "COMMUNITY_REFERRAL"
  | "SURVEY";

export interface TaskDefinition {
  type: MicroTaskType;
  title: string;
  description: string;
  evidenceType: "photo_url" | "review_text" | "referral_code" | "survey_answers";
  estimatedMinutes: number;
  availability: "NOT_OPEN";
}
export const TASK_DEFINITIONS: Record<MicroTaskType, TaskDefinition> = {
  REST_PHOTO_VERIFICATION: {
    type: "REST_PHOTO_VERIFICATION",
    title: "Restaurant Photo Review",
    description: "Potential community contribution. This activity is not accepting paid claims.",
    evidenceType: "photo_url", estimatedMinutes: 3, availability: "NOT_OPEN",
  },
  MENU_ITEM_REVIEW: {
    type: "MENU_ITEM_REVIEW",
    title: "Menu Feedback",
    description: "Share helpful and authentic menu observations when submissions are available.",
    evidenceType: "review_text", estimatedMinutes: 2, availability: "NOT_OPEN",
  },
  COMMUNITY_REFERRAL: {
    type: "COMMUNITY_REFERRAL",
    title: "Refer a Local Restaurant",
    description: "Introduce a business; no referral credit is promised until verified eligibility.",
    evidenceType: "referral_code", estimatedMinutes: 4, availability: "NOT_OPEN",
  },
  SURVEY: {
    type: "SURVEY",
    title: "Product Feedback",
    description: "Feedback opportunities may open later; they do not create a cash entitlement.",
    evidenceType: "survey_answers", estimatedMinutes: 2, availability: "NOT_OPEN",
  },
};

/** Only server-controlled verified settlement records can be used to post credits.
 * This function returns a QUOTE, never a redeemable credit or wallet balance.
 * All currency amounts are non-negative integer paise.
 */
export interface CrownCreditFunding {
  verifiedSettled: boolean;
  settledCommissionPaise: number;
  providerFeePaise: number;
  taxPaise: number;
  refundReservePaise: number;
  serviceCostPaise: number;
  founderRetainedMinimumPaise: number;
  rewardShareBps?: number;
}

export interface CrownCreditQuote {
  eligibleForConsideration: boolean;
  maxPromotionalCreditPaise: number;
  founderContributionAfterCreditPaise: number;
  reason: string;
}

const isWholeNonnegative = (value: number) =>
  Number.isSafeInteger(value) && value >= 0;

export function quoteCrownPromotionalCredits(f: CrownCreditFunding): CrownCreditQuote {
  const values = [
    f.settledCommissionPaise, f.providerFeePaise, f.taxPaise,
    f.refundReservePaise, f.serviceCostPaise, f.founderRetainedMinimumPaise,
  ];
  const bps = f.rewardShareBps ?? 1500; // maximum 15% of net contribution by default
  if (!values.every(isWholeNonnegative) || !Number.isSafeInteger(bps) || bps < 0 || bps > 2000) {
    throw new Error("Invalid cost data or promotional share. Maximum is 20%.");
  }
  if (!f.verifiedSettled) {
    return { eligibleForConsideration: false, maxPromotionalCreditPaise: 0,
      founderContributionAfterCreditPaise: 0, reason: "A verified settled commission is required." };
  }
  const net = f.settledCommissionPaise - f.providerFeePaise - f.taxPaise -
    f.refundReservePaise - f.serviceCostPaise;
  if (net <= f.founderRetainedMinimumPaise || net <= 0) {
    return { eligibleForConsideration: false, maxPromotionalCreditPaise: 0,
      founderContributionAfterCreditPaise: Math.max(0,net),
      reason: "Insufficient verified contribution after costs and founder reserve." };
  }
  const maxCredit = Math.max(0,Math.min(
    Math.floor(net * bps / 10_000),
    net - f.founderRetainedMinimumPaise,
  ));
  return { eligibleForConsideration: maxCredit > 0,
    maxPromotionalCreditPaise: maxCredit,
    founderContributionAfterCreditPaise: net - maxCredit,
    reason: maxCredit > 0
      ? "Quote only; server-side authorization and eligible food order required."
      : "No promotional entitlement available." };
}

export interface FoodDiscountLimit {
  eligibleOrder: boolean;
  verifiedPostedCreditPaise: number;
  unredeemedCreditPaise: number;
  payableFoodSubtotalPaise: number;
  confirmedOrderContributionPaise: number;
  founderRetainedMinimumPaise: number;
}
/** Independent server-side discount cap for a separately validated eligible food order.
 * No client-created credits can be passed directly to checkout or treated as money.
 */
export function quoteEligibleFoodDiscount(f: FoodDiscountLimit): number {
  const amounts = [f.verifiedPostedCreditPaise, f.unredeemedCreditPaise,
    f.payableFoodSubtotalPaise, f.confirmedOrderContributionPaise,
    f.founderRetainedMinimumPaise];
  if (!amounts.every(isWholeNonnegative)) throw new Error("Invalid food discount data.");
  if (!f.eligibleOrder) return 0;
  return Math.max(0,Math.min(f.verifiedPostedCreditPaise, f.unredeemedCreditPaise,
    f.payableFoodSubtotalPaise,
    f.confirmedOrderContributionPaise - f.founderRetainedMinimumPaise));
}

/** Legacy callers fail closed. No in-memory cash map or cashoutToUpi exists. */
export class MicroTaskEngine {
  getAvailableTasks() { return Object.values(TASK_DEFINITIONS); }
  getWalletBalance(_customerId: string) {
    return { balancePaise: 0, balanceRupees: 0 };
  }
  getCustomerLedger(_customerId: string) { return []; }
  getCustomerClaims(_customerId: string) { return []; }
  canClaimTask(_customerId: string, _taskType: MicroTaskType) {
    return { allowed: false, reason: "Program not open. No payouts or credits can be issued." };
  }
  claimTask(): never { throw new Error("Micro-task claims require a verified server-side program."); }
  submitTaskEvidence(): never { throw new Error("Evidence submission is not enabled."); }
  verifyTask(): never { throw new Error("Client-controlled task approval is forbidden."); }
  payoutTask(): never { throw new Error("Unbacked payouts are disabled."); }
  completeAndPayoutMicroTask(): never { throw new Error("Automatic cash rewards are disabled."); }
}
export const microTaskEngine = new MicroTaskEngine();
