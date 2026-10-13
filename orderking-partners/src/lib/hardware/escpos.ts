/**
 * OrderKing Universal ESC/POS Thermal Receipt & KOT Protocol Engine
 * Supports 58mm (32 columns) and 80mm (48 columns) thermal printers.
 * Generates raw ESC/POS binary bytecode buffers and ASCII representations.
 */

export type PaperWidth = "58mm" | "80mm";

export interface EscPosLineItem {
  name: string;
  quantity: number;
  pricePaise: number;
  station?: string;
  instructions?: string;
}

export interface EscPosReceiptData {
  restaurantName: string;
  orderNumber: string;
  orderType: "DELIVERY" | "DINE_IN" | "TAKEAWAY";
  tableOrArea?: string;
  timestamp?: string;
  prepMinutes?: number;
  items: EscPosLineItem[];
  subtotalPaise: number;
  packingPaise?: number;
  discountPaise?: number;
  cgstPaise?: number;
  sgstPaise?: number;
  totalPaise: number;
  specialInstructions?: string;
  qrPayload?: string;
  autoCut?: boolean;
  drawerKick?: boolean;
}

export class EscPosReceiptBuilder {
  private buffer: number[] = [];
  private plainLines: string[] = [];
  public readonly cols: number;

  constructor(public readonly paperWidth: PaperWidth = "80mm") {
    this.cols = paperWidth === "58mm" ? 32 : 48;
    this.init();
  }

  public init(): this {
    // ESC @ (Initialize printer)
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  public align(alignment: "left" | "center" | "right"): this {
    const code = alignment === "left" ? 0x00 : alignment === "center" ? 0x01 : 0x02;
    // ESC a n
    this.buffer.push(0x1b, 0x61, code);
    return this;
  }

  public bold(enable = true): this {
    // ESC E n
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  public doubleSize(enable = true): this {
    // GS ! n (0x11 = double width & height, 0x00 = normal)
    this.buffer.push(0x1d, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  public text(str: string): this {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    for (let i = 0; i < encoded.length; i++) {
      this.buffer.push(encoded[i]);
    }
    return this;
  }

  public line(str = ""): this {
    this.text(str);
    this.buffer.push(0x0a); // LF
    this.plainLines.push(str);
    return this;
  }

  public divider(char = "-"): this {
    const lineStr = char.repeat(this.cols);
    return this.line(lineStr);
  }

  public twoColumn(left: string, right: string): this {
    const leftTrim = left.slice(0, this.cols - right.length - 1);
    const spaceCount = Math.max(1, this.cols - leftTrim.length - right.length);
    const formatted = `${leftTrim}${" ".repeat(spaceCount)}${right}`;
    return this.line(formatted);
  }

  public threeColumn(col1: string, col2: string, col3: string): this {
    // e.g. "2x" + "Chicken Biryani" + "₹520.00"
    const left = `${col1} ${col2}`;
    return this.twoColumn(left, col3);
  }

  public qrCode(data: string, moduleSize?: number): this {
    const size = moduleSize ?? (this.paperWidth === "58mm" ? 4 : 6);
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(data);
    const storeLen = payloadBytes.length + 3;

    // Center QR code
    this.align("center");

    // 1. Set model: GS ( k 4 0 49 65 50 0
    this.buffer.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);

    // 2. Set module size: GS ( k 3 0 49 67 size
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size);

    // 3. Set error correction level M: GS ( k 3 0 49 69 49
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);

    // 4. Store data: GS ( k pL pH 49 80 48 ...
    const pL = storeLen & 0xff;
    const pH = (storeLen >> 8) & 0xff;
    this.buffer.push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
    for (let i = 0; i < payloadBytes.length; i++) {
      this.buffer.push(payloadBytes[i]);
    }

    // 5. Print QR code: GS ( k 3 0 49 81 48
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);

    this.plainLines.push(`[QR CODE: ${data}]`);
    return this;
  }

  public feed(lines = 3): this {
    // ESC d n
    this.buffer.push(0x1b, 0x64, lines);
    for (let i = 0; i < lines; i++) this.plainLines.push("");
    return this;
  }

  public cut(partial = true): this {
    // GS V 65 0 (partial cut) or GS V 66 0 (full cut)
    this.buffer.push(0x1d, 0x56, partial ? 0x41 : 0x42, 0x10);
    this.plainLines.push(`=== CUT PAPER ===`);
    return this;
  }

  public drawerKick(): this {
    // ESC p 0 25 250 (cash drawer kick pin 2)
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa);
    return this;
  }

  public beep(): this {
    // ESC B 2 2 (2 beeps, length 2)
    this.buffer.push(0x1b, 0x42, 0x02, 0x02);
    return this;
  }

  public build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  public toHex(): string {
    return Array.from(this.buffer)
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join(" ");
  }

  public toPlainText(): string {
    return this.plainLines.join("\n");
  }
}

/**
 * Format paise into clean INR string: ₹520.00
 */
function formatPaise(paise: number): string {
  const rs = (paise / 100).toFixed(2);
  return `Rs.${rs}`;
}

/**
 * Generates standard OrderKing KOT & Tax Invoice in ESC/POS binary bytecode.
 */
export function generateEscPosReceipt(data: EscPosReceiptData, width: PaperWidth = "80mm"): {
  bytes: Uint8Array;
  hex: string;
  plainText: string;
  colCount: number;
} {
  const builder = new EscPosReceiptBuilder(width);

  if (data.drawerKick) {
    builder.drawerKick();
  }

  // Header
  builder.align("center");
  builder.doubleSize(true);
  builder.bold(true);
  builder.line(data.restaurantName.toUpperCase());
  builder.doubleSize(false);
  builder.bold(false);

  builder.line(`KITCHEN KOT & TAX INVOICE`);
  builder.bold(true);
  builder.line(`ORDER #${data.orderNumber}`);
  builder.bold(false);
  builder.line(`Type: ${data.orderType} · ${data.tableOrArea || "Counter/Delivery"}`);
  builder.line(`Time: ${data.timestamp || new Date().toLocaleString("en-IN")}`);
  if (data.prepMinutes) {
    builder.line(`Prep SLA: ${data.prepMinutes} mins`);
  }
  builder.divider("=");

  // Itemized Kitchen KOT lines
  builder.align("left");
  builder.bold(true);
  builder.twoColumn("ITEM / DISH", "AMOUNT");
  builder.bold(false);
  builder.divider("-");

  for (const item of data.items) {
    const qtyPrefix = `${item.quantity}x `;
    const priceStr = formatPaise(item.pricePaise * item.quantity);
    builder.bold(true);
    builder.threeColumn(qtyPrefix, item.name, priceStr);
    builder.bold(false);

    if (item.station) {
      builder.line(`  [Station: ${item.station}]`);
    }
    if (item.instructions) {
      builder.line(`  * Chef Note: ${item.instructions}`);
    }
  }

  if (data.specialInstructions) {
    builder.divider("-");
    builder.bold(true);
    builder.line(`SPECIAL PREP NOTE:`);
    builder.line(data.specialInstructions);
    builder.bold(false);
  }

  builder.divider("=");

  // Financial Breakdown
  builder.twoColumn("Food Subtotal:", formatPaise(data.subtotalPaise));
  if (data.packingPaise && data.packingPaise > 0) {
    builder.twoColumn("Packaging:", formatPaise(data.packingPaise));
  }
  if (data.discountPaise && data.discountPaise > 0) {
    builder.twoColumn("Discount:", `-${formatPaise(data.discountPaise)}`);
  }
  if (data.cgstPaise && data.cgstPaise > 0) {
    builder.twoColumn("CGST §9(5) (2.5%):", formatPaise(data.cgstPaise));
  }
  if (data.sgstPaise && data.sgstPaise > 0) {
    builder.twoColumn("SGST §9(5) (2.5%):", formatPaise(data.sgstPaise));
  }

  builder.divider("-");
  builder.bold(true);
  builder.doubleSize(true);
  builder.twoColumn("TOTAL:", formatPaise(data.totalPaise));
  builder.doubleSize(false);
  builder.bold(false);
  builder.divider("=");

  // Footer & Reorder QR
  if (data.qrPayload) {
    builder.align("center");
    builder.line("SCAN TO REORDER ON ORDERKING");
    builder.qrCode(data.qrPayload);
    builder.line("Save Rs.40-80 on every order");
  }

  builder.align("center");
  builder.line("FSSAI & CGST Sec 9(5) Compliant");
  builder.line("*** POWERED BY ORDERKING POS ***");

  // Feed & Auto Cut
  builder.feed(4);
  if (data.autoCut !== false) {
    builder.cut(true);
  }

  return {
    bytes: builder.build(),
    hex: builder.toHex(),
    plainText: builder.toPlainText(),
    colCount: builder.cols,
  };
}
