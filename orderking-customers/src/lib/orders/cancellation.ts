export const GRACE_WINDOW_SECONDS = 60;

export type GraceCountdownResult = {
  secondsRemaining: number;
  isWithinGraceWindow: boolean;
  elapsedSeconds: number;
  percentRemaining: number;
};

export type RefundDestination = "KINGPAY_WALLET" | "UPI_SOURCE" | "COD_NO_CHARGE" | "DIRECT_REVERSAL";

export type RefundCalculationResult = {
  refundPaise: number;
  isFullRefund: boolean;
  refundDestination: RefundDestination;
  zeroDeduction: boolean;
  instantApproval: boolean;
  message: string;
};

/**
 * Calculates remaining seconds in the 60-second cancellation grace window.
 */
export function calculateGraceTimeRemaining(
  placedAt: string | Date | number,
  now: number = Date.now(),
  graceWindowSeconds: number = GRACE_WINDOW_SECONDS
): GraceCountdownResult {
  const placedTimeMs =
    typeof placedAt === "number"
      ? placedAt
      : typeof placedAt === "string"
        ? new Date(placedAt).getTime()
        : placedAt.getTime();

  if (Number.isNaN(placedTimeMs) || placedTimeMs <= 0) {
    return {
      secondsRemaining: 0,
      isWithinGraceWindow: false,
      elapsedSeconds: graceWindowSeconds,
      percentRemaining: 0,
    };
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - placedTimeMs) / 1000));
  const secondsRemaining = Math.max(0, graceWindowSeconds - elapsedSeconds);
  const isWithinGraceWindow = secondsRemaining > 0;
  const percentRemaining = Math.min(100, Math.max(0, (secondsRemaining / graceWindowSeconds) * 100));

  return {
    secondsRemaining,
    isWithinGraceWindow,
    elapsedSeconds,
    percentRemaining,
  };
}

/**
 * Calculates 100% instant refund details for cancellations within the grace window.
 */
export function calculateRefundDetails(
  order: {
    totalPaise: number;
    paymentMethod: string;
    paymentStatus?: string;
  },
  isWithinGraceWindow: boolean
): RefundCalculationResult {
  const totalPaise = Math.max(0, Math.floor(order.totalPaise || 0));

  if (!isWithinGraceWindow) {
    return {
      refundPaise: 0,
      isFullRefund: false,
      refundDestination: "DIRECT_REVERSAL",
      zeroDeduction: false,
      instantApproval: false,
      message: "Grace window elapsed. Cancellation requires kitchen and partner review.",
    };
  }

  if (order.paymentMethod === "COD") {
    return {
      refundPaise: 0,
      isFullRefund: true,
      refundDestination: "COD_NO_CHARGE",
      zeroDeduction: true,
      instantApproval: true,
      message: "Order cancelled before kitchen confirmation. No cash collection required.",
    };
  }

  const refundDestination: RefundDestination =
    order.paymentMethod === "KING_PAY"
      ? "KINGPAY_WALLET"
      : order.paymentMethod === "RAZORPAY_ONLINE" || order.paymentMethod === "UPI_SANDBOX"
        ? "UPI_SOURCE"
        : "KINGPAY_WALLET";

  return {
    refundPaise: totalPaise,
    isFullRefund: true,
    refundDestination,
    zeroDeduction: true,
    instantApproval: true,
    message: "100% instant refund credited to your KingPay Wallet/UPI without dispute.",
  };
}
