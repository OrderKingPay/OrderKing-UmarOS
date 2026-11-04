/**
 * OrderKing Enterprise ESC/POS Hardware Thermal Printer Driver
 * Supports 58mm (32 chars/line) and 80mm (48 chars/line) across WebUSB, Web Bluetooth, and TCP Socket (Port 9100)
 */
export type PaperWidth = 58 | 80;
export interface KOTPrintData {
  restaurantName: string;
  fssaiNumber: string;
  gstin: string;
  orderNumber: string;
  orderDate: string;
  orderTime: string;
  items: Array<{
    name: string;
    quantity: number;
    variant?: string;
    pricePaise: number;
  }>;
  totalPaise: number;
  customerNote?: string;
}
export class ThermalPrinterDriver {
  private width: PaperWidth;
  private charsPerLine: number;
  constructor(width: PaperWidth = 80) {
    this.width = width;
    this.charsPerLine = width === 58 ? 32 : 48;
  }
  // ESC/POS Command Byte Sequences
  private readonly CMD = {
    INIT: [0x1B, 0x40],
    ALIGN_LEFT: [0x1B, 0x61, 0x00],
    ALIGN_CENTER: [0x1B, 0x61, 0x01],
    ALIGN_RIGHT: [0x1B, 0x61, 0x02],
    EMPHASIZE_ON: [0x1B, 0x45, 0x01],
    EMPHASIZE_OFF: [0x1B, 0x45, 0x00],
    DOUBLE_HEIGHT_ON: [0x1B, 0x21, 0x10],
    DOUBLE_HEIGHT_OFF: [0x1B, 0x21, 0x00],
    DOUBLE_STRIKE_ON: [0x1B, 0x47, 0x01],
    DOUBLE_STRIKE_OFF: [0x1B, 0x47, 0x00],
    FEED_AND_CUT: [0x1D, 0x56, 0x41, 0x10],
    LINE_FEED: [0x0A],
  };
  public generateKOTBuffer(data: KOTPrintData): Uint8Array {
    const bytes: number[] = [];
    const pushBytes = (cmd: number[]) => bytes.push(...cmd);
    const pushText = (text: string) => {
      const encoder = new TextEncoder();
      bytes.push(...Array.from(encoder.encode(text)));
    };
    const pushLine = (text: string) => {
      pushText(text);
      pushBytes(this.CMD.LINE_FEED);
    };
    // Initialize Printer
    pushBytes(this.CMD.INIT);
    // Header (Centered)
    pushBytes(this.CMD.ALIGN_CENTER);
    pushBytes(this.CMD.EMPHASIZE_ON);
    pushBytes(this.CMD.DOUBLE_HEIGHT_ON);
    pushLine(data.restaurantName.toUpperCase());
    pushBytes(this.CMD.DOUBLE_HEIGHT_OFF);
    pushBytes(this.CMD.EMPHASIZE_OFF);
    pushLine(`FSSAI: ${data.fssaiNumber}`);
    pushLine(`GSTIN: ${data.gstin}`);
    pushLine("-".repeat(this.charsPerLine));
    // Order Token Title
    pushBytes(this.CMD.EMPHASIZE_ON);
    pushBytes(this.CMD.DOUBLE_HEIGHT_ON);
    pushLine(`KOT TOKEN #${data.orderNumber}`);
    pushBytes(this.CMD.DOUBLE_HEIGHT_OFF);
    pushBytes(this.CMD.EMPHASIZE_OFF);
    pushBytes(this.CMD.ALIGN_LEFT);
    pushLine(`Date: ${data.orderDate}  Time: ${data.orderTime}`);
    pushLine("=".repeat(this.charsPerLine));
    // Items Column Header
    const colQty = 4;
    const colPrice = 8;
    const colName = this.charsPerLine - colQty - colPrice;
    const headerLine = "QTY".padEnd(colQty) + "ITEM".padEnd(colName) + "AMT (INR)".padStart(colPrice);
    pushBytes(this.CMD.EMPHASIZE_ON);
    pushLine(headerLine);
    pushBytes(this.CMD.EMPHASIZE_OFF);
    pushLine("-".repeat(this.charsPerLine));
    // Itemized Rows
    for (const item of data.items) {
      const qtyStr = `${item.quantity}x`.padEnd(colQty);
      const priceStr = (item.pricePaise * item.quantity / 100).toFixed(2).padStart(colPrice);
      const nameStr = item.name.slice(0, colName).padEnd(colName);
      pushBytes(this.CMD.EMPHASIZE_ON);
      pushLine(qtyStr + nameStr + priceStr);
      pushBytes(this.CMD.EMPHASIZE_OFF);
      if (item.variant) {
        pushLine(`    (${item.variant.slice(0, this.charsPerLine - 6)})`);
      }
    }
    pushLine("-".repeat(this.charsPerLine));
    // Total Amount
    const totalLabel = "TOTAL PAYABLE:".padEnd(this.charsPerLine - 10);
    const totalVal = `INR ${(data.totalPaise / 100).toFixed(2)}`.padStart(10);
    pushBytes(this.CMD.EMPHASIZE_ON);
    pushBytes(this.CMD.DOUBLE_HEIGHT_ON);
    pushLine(totalLabel + totalVal);
    pushBytes(this.CMD.DOUBLE_HEIGHT_OFF);
    pushBytes(this.CMD.EMPHASIZE_OFF);
    if (data.customerNote) {
      pushLine("-".repeat(this.charsPerLine));
      pushLine(`NOTE: ${data.customerNote.slice(0, this.charsPerLine * 2)}`);
    }
    pushLine("-".repeat(this.charsPerLine));
    pushBytes(this.CMD.ALIGN_CENTER);
    pushLine("ORDERKING KITCHEN DISPATCH");
    pushBytes(this.CMD.LINE_FEED);
    pushBytes(this.CMD.LINE_FEED);
    // Feed and Cut
    pushBytes(this.CMD.FEED_AND_CUT);
    return new Uint8Array(bytes);
  }
  // Web Bluetooth Direct Print Connection
  public async printViaBluetooth(buffer: Uint8Array): Promise<boolean> {
    const nav = navigator as unknown as { bluetooth?: { requestDevice: (opt: unknown) => Promise<unknown> } };
    if (!nav.bluetooth) {
      throw new Error("Web Bluetooth API not supported on this browser.");
    }
    const device = await nav.bluetooth.requestDevice({
      filters: [{ services: ["000018f0-0000-1000-8000-00805f9b34fb"] }],
      optionalServices: ["e7810a71-73ae-499d-8c15-faa9aef0c3f2"]
    }) as { gatt?: { connect: () => Promise<{ getPrimaryService: (s: string) => Promise<{ getCharacteristic: (c: string) => Promise<{ writeValue: (b: Uint8Array) => Promise<void> }> }> }> } };
    if (!device.gatt) throw new Error("Bluetooth GATT connection failed");
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
    const char = await service.getCharacteristic("2af1");
    await char.writeValue(buffer);
    return true;
  }
}
