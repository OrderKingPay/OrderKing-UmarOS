// File: orderking-partners/src/lib/kds/partner-zomato-kds.ts
// Exact Zomato Restaurant Partner Parity: 3-Column KDS, Dynamic KPT Slider,
// 58mm/80mm ESC/POS Hardware Thermal Auto-Print & 06:00 AM IST 86-Stockout Reset

export type KdsColumnStatus = 'NEW_ORDERS' | 'PREPARING' | 'READY_FOR_PICKUP';
export type KptExtensionMinutes = 0 | 5 | 10 | 15;
export type ThermalPaperWidthMm = 58 | 80;

export interface KotOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  variantName?: string;
  addons?: string[];
  specialInstructions?: string;
  isVeg: boolean;
}

export interface KdsOrderTicket {
  orderId: string;
  shortOrderCode: string; // e.g., "#OK-4821"
  restaurantId: string;
  restaurantName: string;
  fssaiNumber: string;
  gstin: string;
  column: KdsColumnStatus;
  items: KotOrderItem[];
  basePrepMinutes: number;
  kptSliderExtensionMinutes: KptExtensionMinutes;
  acceptedAtIso: string;
  estimatedReadyAtIso: string;
  riderAutoDispatchAtIso: string;
  customerEtaMinutes: number;
  pickupOtp4Digit: string;
}

/**
 * Computes updated customer ETA and dynamic rider auto-dispatch timestamp when the kitchen
 * adjusts the Dynamic KPT Slider (+5m, +10m, +15m) so riders never crowd the kitchen counter.
 */
export function applyDynamicKptSliderUpdate(params: {
  ticket: KdsOrderTicket;
  extensionMinutes: KptExtensionMinutes;
  estimatedRiderToStoreTransitMinutes: number;
  estimatedStoreToCustomerTransitMinutes: number;
}): KdsOrderTicket {
  if (![0, 5, 10, 15].includes(params.extensionMinutes)) {
    throw new Error('Dynamic KPT slider only accepts 0, +5, +10, or +15 minutes.');
  }
  const acceptedMs = new Date(params.ticket.acceptedAtIso).getTime();
  const totalPrepMinutes = params.ticket.basePrepMinutes + params.extensionMinutes;
  const readyMs = acceptedMs + totalPrepMinutes * 60_000;

  // Delay rider auto-dispatch so the rider arrives right as the food transitions to READY_FOR_PICKUP
  const dispatchLeadMinutes = Math.max(1, params.estimatedRiderToStoreTransitMinutes);
  const dispatchMs = Math.max(acceptedMs, readyMs - dispatchLeadMinutes * 60_000);
  const customerEtaMinutes = totalPrepMinutes + Math.max(5, params.estimatedStoreToCustomerTransitMinutes);

  return {
    ...params.ticket,
    kptSliderExtensionMinutes: params.extensionMinutes,
    estimatedReadyAtIso: new Date(readyMs).toISOString(),
    riderAutoDispatchAtIso: new Date(dispatchMs).toISOString(),
    customerEtaMinutes,
  };
}

/**
 * Transitions a KDS ticket across the 3-column board: NEW_ORDERS -> PREPARING -> READY_FOR_PICKUP.
 */
export function transitionKdsTicketColumn(
  ticket: KdsOrderTicket,
  targetColumn: KdsColumnStatus
): KdsOrderTicket {
  const validTransitions: Record<KdsColumnStatus, KdsColumnStatus[]> = {
    NEW_ORDERS: ['PREPARING'],
    PREPARING: ['READY_FOR_PICKUP'],
    READY_FOR_PICKUP: ['READY_FOR_PICKUP'],
  };
  if (!validTransitions[ticket.column].includes(targetColumn)) {
    throw new Error(`Invalid KDS transition from ${ticket.column} to ${targetColumn}`);
  }
  return {
    ...ticket,
    column: targetColumn,
  };
}

/**
 * Computes the exact next 06:00:00 AM IST (UTC+05:30) timestamp for automated daily 86 item stockout reset.
 */
export function computeNextSixAmIstResetIso(referenceNowMs: number = Date.now()): string {
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // +05:30
  const istNow = new Date(referenceNowMs + IST_OFFSET_MS);

  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth();
  const day = istNow.getUTCDate();
  const hours = istNow.getUTCHours();

  // Target 06:00:00 IST today if before 06:00 AM IST, otherwise 06:00:00 IST tomorrow
  const targetDayOffset = hours < 6 ? 0 : 1;
  const nextSixAmIstAsUtcMs = Date.UTC(year, month, day + targetDayOffset, 6, 0, 0, 0);
  const realUtcMs = nextSixAmIstAsUtcMs - IST_OFFSET_MS;
  return new Date(realUtcMs).toISOString();
}

export interface MenuItemStockState {
  itemId: string;
  name: string;
  inStock: boolean;
  eightySixedAtIso: string | null;
  autoResetAtSixAmIstIso: string | null;
}

/**
 * 1-Tap 86 Item Stockout Toggle with automated 06:00 AM IST daily reset.
 */
export function toggleMenuItem86Stockout(
  item: MenuItemStockState,
  markOutOfStock: boolean,
  nowMs: number = Date.now()
): MenuItemStockState {
  if (!markOutOfStock) {
    return {
      ...item,
      inStock: true,
      eightySixedAtIso: null,
      autoResetAtSixAmIstIso: null,
    };
  }
  return {
    ...item,
    inStock: false,
    eightySixedAtIso: new Date(nowMs).toISOString(),
    autoResetAtSixAmIstIso: computeNextSixAmIstResetIso(nowMs),
  };
}

/**
 * Evaluates whether an 86'd menu item has passed its 06:00 AM IST daily auto-reset threshold.
 */
export function evaluateDailySixAmIstStockReset(
  items: ReadonlyArray<MenuItemStockState>,
  nowMs: number = Date.now()
): MenuItemStockState[] {
  return items.map((item) => {
    if (!item.inStock && item.autoResetAtSixAmIstIso) {
      const resetMs = new Date(item.autoResetAtSixAmIstIso).getTime();
      if (nowMs >= resetMs) {
        return {
          ...item,
          inStock: true,
          eightySixedAtIso: null,
          autoResetAtSixAmIstIso: null,
        };
      }
    }
    return item;
  });
}

/**
 * Hardware ESC/POS Binary Ticket Generator for 58mm (32 cols) and 80mm (48 cols) Thermal Printers.
 * Compatible with Web Bluetooth, WebUSB, and raw TCP socket (port 9100).
 */
export function buildEscPosKotBinaryPayload(
  ticket: KdsOrderTicket,
  paperWidthMm: ThermalPaperWidthMm = 80
): Uint8Array {
  const cols = paperWidthMm === 58 ? 32 : 48;
  const divider = '-'.repeat(cols);
  const encoder = new TextEncoder();
  const chunks: number[] = [];

  const pushBytes = (...bytes: number[]) => chunks.push(...bytes);
  const pushLine = (text = '') => {
    const encoded = encoder.encode(text + '\n');
    for (let i = 0; i < encoded.length; i++) chunks.push(encoded[i]);
  };

  // ESC @ (Initialize printer)
  pushBytes(0x1b, 0x40);
  // ESC a 1 (Center align)
  pushBytes(0x1b, 0x61, 0x01);
  // GS ! 0x11 (Double height & width for KOT header)
  pushBytes(0x1d, 0x21, 0x11);
  pushLine(`ORDERKING KOT ${ticket.shortOrderCode}`);
  // GS ! 0x00 (Normal size)
  pushBytes(0x1d, 0x21, 0x00);
  pushLine(ticket.restaurantName.slice(0, cols));
  pushLine(`FSSAI: ${ticket.fssaiNumber}`);
  pushLine(divider);

  // ESC a 0 (Left align)
  pushBytes(0x1b, 0x61, 0x00);
  pushLine(`Order ID : ${ticket.orderId}`);
  pushLine(`Accepted : ${ticket.acceptedAtIso.slice(11, 19)} UTC`);
  pushLine(`Prep Time: ${ticket.basePrepMinutes + ticket.kptSliderExtensionMinutes} mins`);
  pushLine(`PickupOTP: ${ticket.pickupOtp4Digit}`);
  pushLine(divider);

  // ESC E 1 (Bold on)
  pushBytes(0x1b, 0x45, 0x01);
  pushLine('QTY  ITEM');
  pushBytes(0x1b, 0x45, 0x00);
  pushLine(divider);

  for (const item of ticket.items) {
    const dietTag = item.isVeg ? '[VEG]' : '[NON-VEG]';
    const line = `${String(item.quantity).padEnd(4)} ${dietTag} ${item.name}`;
    pushLine(line.slice(0, cols));
    if (item.variantName) {
      pushLine(`     Variant: ${item.variantName}`.slice(0, cols));
    }
    if (item.addons && item.addons.length > 0) {
      pushLine(`     Add-ons: ${item.addons.join(', ')}`.slice(0, cols));
    }
    if (item.specialInstructions) {
      pushLine(`     Note: ${item.specialInstructions}`.slice(0, cols));
    }
  }

  pushLine(divider);
  pushBytes(0x1b, 0x61, 0x01);
  pushLine('HANDOVER ONLY ON 4-DIGIT RIDER PICKUP CODE');
  pushLine('\n\n');
  // GS V 66 0 (Partial cut with feed)
  pushBytes(0x1d, 0x56, 0x42, 0x00);

  return new Uint8Array(chunks);
}