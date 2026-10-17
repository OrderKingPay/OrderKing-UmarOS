import type {
  CoolingOffInfo,
  DeliveryState,
  PocketBalanceInfo,
  RiderDisciplineConfig,
} from "./types.ts";

export type DisciplineState = {
  consecutiveDeclines: number;
  coolingOffUntil: string | null;
  coolingOffReason: string | null;
};

const DISCIPLINE_TAG_PREFIX = "[DISCIPLINE:";
const DISCIPLINE_TAG_SUFFIX = "]";

/**
 * Parses embedded discipline state from availability_notes.
 * Non-destructive: preserves any human notes outside the tag.
 */
export function parseDisciplineNotes(notes: string | null | undefined): {
  state: DisciplineState;
  cleanNotes: string;
} {
  const defaultState: DisciplineState = {
    consecutiveDeclines: 0,
    coolingOffUntil: null,
    coolingOffReason: null,
  };

  if (!notes || typeof notes !== "string") {
    return { state: defaultState, cleanNotes: "" };
  }

  const startIdx = notes.indexOf(DISCIPLINE_TAG_PREFIX);
  if (startIdx === -1) {
    return { state: defaultState, cleanNotes: notes.trim() };
  }

  const endIdx = notes.indexOf(DISCIPLINE_TAG_SUFFIX, startIdx);
  if (endIdx === -1) {
    return { state: defaultState, cleanNotes: notes.trim() };
  }

  const jsonStr = notes.slice(startIdx + DISCIPLINE_TAG_PREFIX.length, endIdx);
  let parsed: Partial<DisciplineState> = {};
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    /* fallback to defaults on corrupt payload */
  }

  const cleanNotes = (notes.slice(0, startIdx) + notes.slice(endIdx + DISCIPLINE_TAG_SUFFIX.length))
    .trim()
    .replace(/\s{2,}/g, " ");

  return {
    state: {
      consecutiveDeclines: typeof parsed.consecutiveDeclines === "number" ? Math.max(0, parsed.consecutiveDeclines) : 0,
      coolingOffUntil: parsed.coolingOffUntil ? String(parsed.coolingOffUntil) : null,
      coolingOffReason: parsed.coolingOffReason ? String(parsed.coolingOffReason) : null,
    },
    cleanNotes,
  };
}

/**
 * Serializes discipline state back into availability_notes alongside any existing human notes.
 */
export function serializeDisciplineNotes(cleanNotes: string, state: DisciplineState): string {
  const tag = `${DISCIPLINE_TAG_PREFIX}${JSON.stringify({
    consecutiveDeclines: state.consecutiveDeclines,
    coolingOffUntil: state.coolingOffUntil,
    coolingOffReason: state.coolingOffReason,
  })}${DISCIPLINE_TAG_SUFFIX}`;

  const trimmed = cleanNotes.trim();
  return trimmed ? `${trimmed} ${tag}` : tag;
}

/**
 * Calculates real-time COD Floating Cash ("Pocket Balance") and evaluates threshold caps.
 *
 * @param collectedPaise Total cash physically collected by the rider from COD deliveries
 * @param reconciledPaise Total cash reconciled via payout offset or direct UPI / gateway deposit
 * @param limitInr Configurable floating cash cap in INR (default: ₹2,000)
 * @param disciplineEnabled Master discipline toggle
 * @param incomingCodAmountPaise Incoming COD order amount in paise for lookahead validation
 */
export function calculatePocketBalance(
  collectedPaise: number,
  reconciledPaise: number,
  limitInr = 2000,
  disciplineEnabled = true,
  incomingCodAmountPaise = 0,
): PocketBalanceInfo {
  const validCollected = Math.max(0, Number.isFinite(collectedPaise) ? collectedPaise : 0);
  const validReconciled = Math.max(0, Number.isFinite(reconciledPaise) ? reconciledPaise : 0);
  const validIncoming = Math.max(0, Number.isFinite(incomingCodAmountPaise) ? incomingCodAmountPaise : 0);
  const pocketBalancePaise = Math.max(0, validCollected - validReconciled);
  const limitPaise = Math.max(10000, Math.round(limitInr * 100)); // Minimum ₹100 floor
  const isCodBlocked =
    disciplineEnabled &&
    (pocketBalancePaise >= limitPaise || (pocketBalancePaise + validIncoming) > limitPaise);
  const canAcceptCod = !isCodBlocked;
  const utilizationPct = Math.min(100, Math.round((pocketBalancePaise / limitPaise) * 100));

  return {
    collectedPaise: validCollected,
    reconciledPaise: validReconciled,
    pocketBalancePaise,
    limitPaise,
    isCodBlocked,
    canAcceptCod,
    utilizationPct,
  };
}

/**
 * Evaluates active cooling-off status and computes remaining seconds.
 */
export function getCoolingOffInfo(
  coolingOffUntil: string | null | undefined,
  coolingOffReason: string | null | undefined,
  nowMs = Date.now(),
): CoolingOffInfo {
  if (!coolingOffUntil) {
    return { isActive: false, until: null, reason: null, secondsRemaining: 0 };
  }

  const untilMs = new Date(coolingOffUntil).getTime();
  if (isNaN(untilMs) || untilMs <= nowMs) {
    return { isActive: false, until: null, reason: null, secondsRemaining: 0 };
  }

  const secondsRemaining = Math.max(0, Math.ceil((untilMs - nowMs) / 1000));
  return {
    isActive: true,
    until: coolingOffUntil,
    reason: coolingOffReason ?? "Temporary cooling-off",
    secondsRemaining,
  };
}

/**
 * Dignified, realistic operational reasons for pre-pickup trip reassignment
 * without harsh financial or disciplinary penalty (Tier-1 Fleet standard).
 */
export const JUSTIFIED_OPERATIONAL_REASONS = [
  "Bike Breakdown / Tyre Puncture 🛵",
  "Personal Emergency / Unwell 🏥",
  "Restaurant Distance Excessive (>5 km) 📍",
  "Heavy Rain / Waterlogging on Route 🌧️",
] as const;

export type JustifiedOperationalReason = (typeof JUSTIFIED_OPERATIONAL_REASONS)[number];

/**
 * Checks if a cancellation reason qualifies as a justified operational contingency.
 */
export function isJustifiedOperationalReason(reason: string | null | undefined): boolean {
  if (!reason || typeof reason !== "string") return false;
  const clean = reason
    .trim()
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .trim();

  const knownPatterns = [
    "bike breakdown / tyre puncture",
    "bike breakdown",
    "tyre puncture",
    "personal emergency / unwell",
    "personal emergency",
    "unwell",
    "restaurant distance excessive (>5 km)",
    "restaurant distance excessive (>5km)",
    "restaurant distance excessive",
    "heavy rain / waterlogging on route",
    "heavy rain",
    "waterlogging on route",
    "waterlogging",
  ];

  return knownPatterns.some((p) => clean.includes(p) || p.includes(clean));
}

/**
 * Computes exact cancellation penalty and discipline action based on order state.
 * OrderKing Partner Fleet Discipline Standards:
 * 1. Pre-Pickup: ₹25–₹50 deduction (configurable, default ₹25).
 *    - WAIVED (₹0 penalty) if a justified operational reason or verified emergency proof is provided.
 * 2. Post-Pickup without proof: Full order value deduction / dispute hold.
 */
export function calculateCancellationPenalty(
  state: DeliveryState,
  codAmountPaise: number,
  expectedPayoutPaise: number,
  cfg: RiderDisciplineConfig,
  hasVerifiedProof = false,
  reason = "",
): {
  penaltyPaise: number;
  isPostPickup: boolean;
  requiresAuditHold: boolean;
  label: string;
  isJustifiedReassignment?: boolean;
} {
  const PRE_PICKUP_STATES: ReadonlySet<DeliveryState> = new Set([
    "OFFERED",
    "OFFER_PRESENTED",
    "ACCEPTED",
    "ARRIVING_AT_RESTAURANT",
    "ARRIVED_AT_RESTAURANT",
    "ARRIVED_AT_STORE",
    "RESTAURANT_NOT_READY",
  ]);

  const POST_PICKUP_STATES: ReadonlySet<DeliveryState> = new Set([
    "PICKED_UP",
    "ON_THE_WAY",
    "OUT_FOR_DELIVERY",
    "ARRIVED_AT_CUSTOMER",
    "CUSTOMER_UNAVAILABLE",
    "SUPPORT_ESCALATION",
  ]);

  if (PRE_PICKUP_STATES.has(state)) {
    // If rider gave a justified operational reason or verified emergency proof, zero penalty applies
    if (hasVerifiedProof || isJustifiedOperationalReason(reason)) {
      return {
        penaltyPaise: 0,
        isPostPickup: false,
        requiresAuditHold: false,
        label: "Pre-pickup operational reassignment (Operational reason: penalty waived for fleet reassignment)",
        isJustifiedReassignment: true,
      };
    }

    // Standard pre-pickup cancellation penalty: ₹25 - ₹50 (clamped between ₹25 and ₹50 in paise)
    const inr = Math.min(50, Math.max(25, cfg.cancellationPenaltyBeforePickupInr || 25));
    const penaltyPaise = inr * 100;
    return {
      penaltyPaise,
      isPostPickup: false,
      requiresAuditHold: false,
      label: `Pre-pickup cancellation penalty (₹${inr})`,
      isJustifiedReassignment: false,
    };
  }

  if (POST_PICKUP_STATES.has(state)) {
    // If rider has verified proof (e.g., severe accident / emergency dispatched), penalty waived
    if (hasVerifiedProof) {
      return {
        penaltyPaise: 0,
        isPostPickup: true,
        requiresAuditHold: true,
        label: "Post-pickup cancellation with verified emergency proof (Penalty Waived, Audit Pending)",
        isJustifiedReassignment: false,
      };
    }

    // Post-pickup without proof: Full order deduction or custom configured deduction
    let penaltyPaise = 0;
    if (cfg.cancellationPenaltyPostPickupType === "CUSTOM_INR") {
      penaltyPaise = (cfg.cancellationPenaltyPostPickupCustomInr || 150) * 100;
    } else {
      // Full order value: order food/COD liability + payout forfeiture
      penaltyPaise = Math.max(codAmountPaise, 15000) + expectedPayoutPaise;
    }

    return {
      penaltyPaise,
      isPostPickup: true,
      requiresAuditHold: true,
      label: `Post-pickup cancellation without proof (Full Order Liability ₹${(penaltyPaise / 100).toFixed(2)})`,
      isJustifiedReassignment: false,
    };
  }

  return {
    penaltyPaise: 0,
    isPostPickup: false,
    requiresAuditHold: false,
    label: "No penalty applicable",
    isJustifiedReassignment: false,
  };
}
