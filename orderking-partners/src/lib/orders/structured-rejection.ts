/**
 * AUTHENTIC TIER-1 LEADER STRUCTURED ORDER REJECTION & STOCKOUT LINK
 * 
 * Enforces structured operational rejection reasons:
 * 1. 'Kitchen Overloaded / Too Many Orders' (kitchen_overloaded)
 * 2. 'Item(s) in Order Out of Stock' (item_unavailable) -> Triggers dish checklist & Timed Stockout modal
 * 3. 'Outlet Closing Early / Staff Shortage' (restaurant_closed)
 * 4. 'Power / Gas / Technical Outage' (technical_issue)
 */

import {
  calculateStockoutExpiry,
  type TimedStockoutOption,
} from "@/lib/menu/timed-stockout";
import type { RejectReason } from "@/lib/orders/state-machine";

export interface Tier1RejectionReasonConfig {
  id: "kitchen_overloaded" | "item_unavailable" | "restaurant_closed" | "technical_issue";
  label: string;
  sublabel: string;
  icon: string;
  requiresItemChecklist?: boolean;
}

export const TIER1_REJECTION_REASONS: readonly Tier1RejectionReasonConfig[] = [
  {
    id: "kitchen_overloaded",
    label: "Kitchen Overloaded / Too Many Orders",
    sublabel: "Order queue at peak capacity. Recommend activating Kitchen Rush or 30m Pause.",
    icon: "Flame",
  },
  {
    id: "item_unavailable",
    label: "Item(s) in Order Out of Stock",
    sublabel: "One or more dishes finished. Triggers Timed Stockout so other customers cannot order them.",
    icon: "AlertOctagon",
    requiresItemChecklist: true,
  },
  {
    id: "restaurant_closed",
    label: "Outlet Closing Early / Staff Shortage",
    sublabel: "Shift ended early or staff shortage. Outlet will be switched offline.",
    icon: "Clock",
  },
  {
    id: "technical_issue",
    label: "Power / Gas / Technical Outage",
    sublabel: "Equipment malfunction, gas pipeline issue, or thermal printer failure.",
    icon: "ZapOff",
  },
] as const;

export interface OrderRejectionLineItem {
  id: string;
  itemName: string;
  variantName?: string | null;
  quantity: number;
}

export interface ProcessRejectionInput {
  orderId: string;
  orderNumber: string;
  reason: RejectReason;
  selectedLineItemIds?: string[];
  stockoutDuration?: TimedStockoutOption;
  refDate?: Date;
}

export interface ProcessRejectionResult {
  orderId: string;
  reason: RejectReason;
  reasonLabel: string;
  requiresStockout: boolean;
  stockoutItemIds: string[];
  stockoutOption?: TimedStockoutOption;
  nextAvailableAt?: string | null;
  stockoutStatus?: "sold_out" | "temporarily_unavailable";
  customerNotificationMessage: string;
}

/**
 * Validates and processes a structured Tier-1 Leader order rejection.
 */
export function processStructuredRejection(input: ProcessRejectionInput): ProcessRejectionResult {
  const reasonConfig = TIER1_REJECTION_REASONS.find((r) => r.id === input.reason);
  const reasonLabel = reasonConfig ? reasonConfig.label : "Other operational reason";

  if (input.reason === "item_unavailable") {
    const selectedIds = input.selectedLineItemIds ?? [];
    if (selectedIds.length === 0) {
      throw new Error("Please select at least one out-of-stock dish from the order to decline.");
    }

    const duration = input.stockoutDuration ?? "TURN_OFF_TOMORROW_8AM";
    const expiry = calculateStockoutExpiry(duration, input.refDate ?? new Date());

    return {
      orderId: input.orderId,
      reason: input.reason,
      reasonLabel,
      requiresStockout: true,
      stockoutItemIds: selectedIds,
      stockoutOption: duration,
      nextAvailableAt: expiry.nextAvailableAt,
      stockoutStatus: expiry.status as "sold_out" | "temporarily_unavailable",
      customerNotificationMessage: `Order #${input.orderNumber} declined: Item(s) out of stock and turned off (${expiry.label}).`,
    };
  }

  let notification = `Order #${input.orderNumber} declined: ${reasonLabel}.`;
  if (input.reason === "kitchen_overloaded") {
    notification = `Order #${input.orderNumber} declined: Kitchen overloaded. Kitchen Rush recommended.`;
  } else if (input.reason === "restaurant_closed") {
    notification = `Order #${input.orderNumber} declined: Outlet closing early.`;
  } else if (input.reason === "technical_issue") {
    notification = `Order #${input.orderNumber} declined: Technical / outage issue.`;
  }

  return {
    orderId: input.orderId,
    reason: input.reason,
    reasonLabel,
    requiresStockout: false,
    stockoutItemIds: [],
    customerNotificationMessage: notification,
  };
}
