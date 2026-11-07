// File: HDmaster/src/lib/orderking/umaros/umaros-supreme-controller.ts
// UmarOS Operations Center (Cross-Platform Customization & Enterprise Governance):
// - Real-Time Operations Map (active order clusters, rider GPS coordinates, kitchen load status)
// - Full Cross-Platform Customizer (Add, Edit, Delete, Move Up/Down/Left/Right, Purge, Color & Option Controls)
// - Founder Master Dials (Flights Rs 399, Trains Rs 40, Hotels Rs 250, Shift Perimeters, Telecom Priority)
// - Customer Dispute Arbitration (Razorpay edge refund + immutable PostgreSQL audit trail)

export type TargetPlatformId =
  | 'orderking-customers'
  | 'orderking-partners'
  | 'orderking-riders'
  | 'HDmaster'
  | 'ALL_PLATFORMS';

export type LayoutMoveDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';

export interface PlatformUiSectionBlock {
  sectionId: string;
  platform: TargetPlatformId;
  title: string;
  visible: boolean;
  rowOrder: number;
  columnOrder: number;
  customProps: Record<string, string | number | boolean>;
}

export interface PlatformThemeAndOptionsConfig {
  primaryBrandHex: string;
  accentHex: string;
  backgroundSurfaceHex: string;
  textPrimaryHex: string;
  borderRadiusPx: number;
  densityMode: 'compact' | 'comfortable' | 'spacious';
  options: Record<string, boolean | string | number>;
}

export interface FounderMasterDialsConfig {
  convenienceFeesInr: {
    flightsInr: number; // Default Rs 399
    trainsInr: number;  // Default Rs 40
    hotelsInr: number;  // Default Rs 250
  };
  foodPlatformFeePaise: number;
  restaurantCommissionBps: number;
  shiftPerimetersKm: {
    dayKm: number;       // 12.0 km
    eveningKm: number;   // 7.5 km
    lateNightKm: number; // 3.5 km
  };
  telecomFailoverPriority: ReadonlyArray<'fast2sms_q' | 'twofactor_transactional' | 'whatsapp_fallback'>;
}

export const DEFAULT_FOUNDER_MASTER_DIALS: FounderMasterDialsConfig = {
  convenienceFeesInr: {
    flightsInr: 399,
    trainsInr: 40,
    hotelsInr: 250,
  },
  foodPlatformFeePaise: 1000, // Rs 10.00
  restaurantCommissionBps: 1000, // 10.00%
  shiftPerimetersKm: {
    dayKm: 12.0,
    eveningKm: 7.5,
    lateNightKm: 3.5,
  },
  telecomFailoverPriority: ['fast2sms_q', 'twofactor_transactional', 'whatsapp_fallback'],
};

/**
 * Reorders a UI section/module UP, DOWN, LEFT, RIGHT, TOP, or BOTTOM across any OrderKing platform
 * from UmarOS without touching code.
 */
export function movePlatformUiSection(
  sections: ReadonlyArray<PlatformUiSectionBlock>,
  sectionId: string,
  direction: LayoutMoveDirection
): PlatformUiSectionBlock[] {
  const list = sections.map((s) => ({ ...s, customProps: { ...s.customProps } }));
  const idx = list.findIndex((s) => s.sectionId === sectionId);
  if (idx === -1) {
    throw new Error(`Section "${sectionId}" not found in UmarOS layout registry.`);
  }

  const target = list[idx];
  if (direction === 'UP' && idx > 0) {
    const prev = list[idx - 1];
    const tmp = target.rowOrder;
    target.rowOrder = prev.rowOrder;
    prev.rowOrder = tmp;
    list[idx - 1] = target;
    list[idx] = prev;
  } else if (direction === 'DOWN' && idx < list.length - 1) {
    const next = list[idx + 1];
    const tmp = target.rowOrder;
    target.rowOrder = next.rowOrder;
    next.rowOrder = tmp;
    list[idx + 1] = target;
    list[idx] = next;
  } else if (direction === 'LEFT') {
    target.columnOrder = Math.max(0, target.columnOrder - 1);
  } else if (direction === 'RIGHT') {
    target.columnOrder = target.columnOrder + 1;
  } else if (direction === 'TOP') {
    target.rowOrder = 0;
    list.splice(idx, 1);
    list.unshift(target);
    list.forEach((s, i) => {
      s.rowOrder = i;
    });
  } else if (direction === 'BOTTOM') {
    list.splice(idx, 1);
    list.push(target);
    list.forEach((s, i) => {
      s.rowOrder = i;
    });
  }

  return list;
}

/**
 * Full CRUD (Add, Edit, Delete, Purge) for UI sections and functional modules across all OrderKing apps.
 */
export function mutatePlatformUiRegistry(
  sections: ReadonlyArray<PlatformUiSectionBlock>,
  action:
    | { type: 'ADD'; block: PlatformUiSectionBlock }
    | { type: 'EDIT'; sectionId: string; patch: Partial<PlatformUiSectionBlock> }
    | { type: 'DELETE'; sectionId: string }
    | { type: 'PURGE_HIDDEN_OR_MOCK' }
): PlatformUiSectionBlock[] {
  if (action.type === 'ADD') {
    if (sections.some((s) => s.sectionId === action.block.sectionId)) {
      throw new Error(`Section "${action.block.sectionId}" already exists.`);
    }
    return [...sections, action.block];
  }
  if (action.type === 'EDIT') {
    return sections.map((s) =>
      s.sectionId === action.sectionId
        ? {
            ...s,
            ...action.patch,
            customProps: { ...s.customProps, ...(action.patch.customProps || {}) },
          }
        : s
    );
  }
  if (action.type === 'DELETE') {
    return sections.filter((s) => s.sectionId !== action.sectionId);
  }
  if (action.type === 'PURGE_HIDDEN_OR_MOCK') {
    return sections.filter(
      (s) =>
        s.visible &&
        !/mock|roulette|bounty|charity|fake|slogan/i.test(s.sectionId) &&
        !/mock|roulette|bounty|charity|fake|slogan/i.test(s.title)
    );
  }
  return [...sections];
}

/**
 * Updates theme colors, typography density, and live operational options across OrderKing platforms.
 */
export function updatePlatformThemeAndOptions(
  current: PlatformThemeAndOptionsConfig,
  patch: Partial<PlatformThemeAndOptionsConfig>
): PlatformThemeAndOptionsConfig {
  const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  if (patch.primaryBrandHex && !hexRegex.test(patch.primaryBrandHex)) {
    throw new Error(`Invalid primaryBrandHex "${patch.primaryBrandHex}".`);
  }
  if (patch.accentHex && !hexRegex.test(patch.accentHex)) {
    throw new Error(`Invalid accentHex "${patch.accentHex}".`);
  }
  return {
    ...current,
    ...patch,
    options: {
      ...current.options,
      ...(patch.options || {}),
    },
  };
}

export interface DisputeArbitrationAuditRecord {
  auditId: string;
  orderId: string;
  razorpayPaymentId: string;
  refundAmountPaise: number;
  reason: string;
  faultAttribution: 'KITCHEN_FAULT' | 'RIDER_FAULT' | 'GOODWILL_PLATFORM';
  authorizedByAdminId: string;
  idempotencyKey: string;
  createdAtIso: string;
  razorpayRefundEndpoint: string;
}

/**
 * 1-Tap Customer Dispute Arbitration:
 * Generates an immutable PostgreSQL audit record and Razorpay instant refund request payload.
 */
export function buildDisputeArbitrationRefundPayload(params: {
  orderId: string;
  razorpayPaymentId: string;
  refundAmountPaise: number;
  maxOrderPaidPaise: number;
  reason: string;
  faultAttribution: 'KITCHEN_FAULT' | 'RIDER_FAULT' | 'GOODWILL_PLATFORM';
  authorizedByAdminId: string;
  nowMs?: number;
}): DisputeArbitrationAuditRecord {
  if (!params.razorpayPaymentId.startsWith('pay_')) {
    throw new Error('Valid Razorpay payment ID (starting with "pay_") is required for refund.');
  }
  if (params.refundAmountPaise <= 0 || params.refundAmountPaise > params.maxOrderPaidPaise) {
    throw new Error(
      `Invalid refund amount (${params.refundAmountPaise} paise). Must be between 1 and ${params.maxOrderPaidPaise} paise.`
    );
  }
  const nowIso = new Date(params.nowMs ?? Date.now()).toISOString();
  const idempotencyKey = `ok_arb_${params.orderId}_${params.razorpayPaymentId}_${params.refundAmountPaise}`;

  return {
    auditId: `aud_${params.orderId}_${Date.now()}`,
    orderId: params.orderId,
    razorpayPaymentId: params.razorpayPaymentId,
    refundAmountPaise: Math.trunc(params.refundAmountPaise),
    reason: params.reason.trim(),
    faultAttribution: params.faultAttribution,
    authorizedByAdminId: params.authorizedByAdminId,
    idempotencyKey,
    createdAtIso: nowIso,
    razorpayRefundEndpoint: `https://api.razorpay.com/v1/payments/${encodeURIComponent(params.razorpayPaymentId)}/refund`,
  };
}