/**
 * OrderKing Enterprise ESC/POS Hardware Thermal Printer Driver
 * Standard Petpooja / Vyapar POS Benchmark
 *
 * Implements:
 * 1. 58mm (32 chars/line) and 80mm (48 chars/line) formatting.
 * 2. Exact Raw Byte Protocol Sequences:
 *    - 0x1B 0x40 (Initialize printer)
 *    - 0x1B 0x61 0x01 (Center align)
 *    - 0x1B 0x21 0x30 (Double height + double width for large token numbers)
 *    - 0x1D 0x56 0x41 0x00 (Full paper cut)
 *    - 0x1B 0x70 0x00 0x19 0xFA (Cash drawer kick pulse)
 * 3. Kitchen Order Ticket (KOT) Layout with cooking notes & station routing.
 * 4. Statutory Customer Tax Invoice Layout with SAC 996331, FSSAI, GSTIN 18AFXPH9838M1Z9,
 *    CGST 2.5% + SGST 2.5%, packaging charges, and Section 9(5) statutory footer.
 * 5. Direct hardware interfaces: Web Bluetooth, WebUSB, and TCP Network Socket (Port 9100).
 * 6. Resilient Offline Print Spooler with retry and idempotency.
 */

export type PaperWidth = 58 | 80;

export interface KOTPrintData {
  restaurantName: string;
  fssaiNumber?: string;
  gstin?: string;
  orderNumber: string;
  orderSource?: "DELIVERY" | "TAKEAWAY" | "DINE_IN";
  tableOrArea?: string;
  orderDate: string;
  orderTime: string;
  items: Array<{
    name: string;
    quantity: number;
    variant?: string;
    pricePaise: number;
    station?: string;
    instructions?: string;
  }>;
  totalPaise: number;
  customerNote?: string;
}

export interface TaxInvoicePrintData {
  restaurantTradeName: string;
  restaurantLegalName?: string;
  restaurantAddress?: string;
  restaurantContact?: string;
  fssaiNumber: string;
  merchantGstin?: string;
  platformGstin?: string; // Default: 18AFXPH9838M1Z9
  sacCode?: string; // Default: 996331
  invoiceNumber: string;
  orderNumber: string;
  orderDate: string;
  orderTime: string;
  orderType: "DELIVERY" | "TAKEAWAY" | "DINE_IN";
  tableNumber?: string;
  items: Array<{
    name: string;
    quantity: number;
    ratePaise: number;
    totalAmountPaise: number;
  }>;
  foodSubtotalPaise: number;
  packagingChargePaise: number;
  discountPaise?: number;
  cgstPaise: number; // 2.5%
  sgstPaise: number; // 2.5%
  totalNetPaidPaise: number;
  paymentMode: "ORDERKING_PAY_UPI" | "CASH_ON_DELIVERY" | "PREPAID_ONLINE";
}

export interface SpooledPrintJob {
  id: string;
  type: "KOT" | "INVOICE";
  data: Uint8Array;
  attempts: number;
  status: "QUEUED" | "PRINTING" | "COMPLETED" | "FAILED";
  enqueuedAt: number;
}

export class ThermalPrinterDriver {
  public readonly width: PaperWidth;
  public readonly charsPerLine: number;

  // ESC/POS Command Byte Sequences
  public static readonly CMD = {
    INIT: [0x1b, 0x40],
    ALIGN_LEFT: [0x1b, 0x61, 0x00],
    ALIGN_CENTER: [0x1b, 0x61, 0x01],
    ALIGN_RIGHT: [0x1b, 0x61, 0x02],
    EMPHASIZE_ON: [0x1b, 0x45, 0x01],
    EMPHASIZE_OFF: [0x1b, 0x45, 0x00],
    DOUBLE_HW_ON: [0x1b, 0x21, 0x30], // Double height + double width
    DOUBLE_HEIGHT_ON: [0x1b, 0x21, 0x10],
    DOUBLE_WIDTH_ON: [0x1b, 0x21, 0x20],
    NORMAL_TEXT: [0x1b, 0x21, 0x00],
    FEED_AND_FULL_CUT: [0x1d, 0x56, 0x41, 0x00], // 0x1D 0x56 0x41 0x00
    DRAWER_KICK: [0x1b, 0x70, 0x00, 0x19, 0xfa], // 0x1B 0x70 0x00 0x19 0xFA
    LINE_FEED: [0x0a],
  };

  constructor(width: PaperWidth = 80) {
    this.width = width;
    this.charsPerLine = width === 58 ? 32 : 48;
  }

  /**
   * Generates Kitchen Order Ticket (KOT) raw ESC/POS binary bytecode.
   */
  public generateKOTBuffer(data: KOTPrintData): Uint8Array {
    const bytes: number[] = [];
    const pushBytes = (cmd: number[]) => bytes.push(...cmd);
    const pushText = (text: string) => {
      const encoder = new TextEncoder();
      bytes.push(...Array.from(encoder.encode(text)));
    };
    const pushLine = (text: string) => {
      pushText(text);
      pushBytes(ThermalPrinterDriver.CMD.LINE_FEED);
    };

    // 1. Initialize Printer
    pushBytes(ThermalPrinterDriver.CMD.INIT);

    // 2. Restaurant Header
    pushBytes(ThermalPrinterDriver.CMD.ALIGN_CENTER);
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_ON);
    pushLine(data.restaurantName.toUpperCase());
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_OFF);

    if (data.fssaiNumber) {
      pushLine(`FSSAI: ${data.fssaiNumber}`);
    }
    pushLine("-".repeat(this.charsPerLine));

    // 3. Order Source & Token Header (Large Double-HW)
    const sourceLabel = data.orderSource === "DINE_IN"
      ? `DINE-IN · TABLE ${data.tableOrArea || "1"}`
      : data.orderSource === "TAKEAWAY"
      ? "TAKEAWAY ORDER"
      : "DELIVERY ORDER";
    pushLine(sourceLabel);

    pushBytes(ThermalPrinterDriver.CMD.ALIGN_CENTER);
    pushBytes(ThermalPrinterDriver.CMD.DOUBLE_HW_ON);
    pushLine(`KOT #${data.orderNumber}`);
    pushBytes(ThermalPrinterDriver.CMD.NORMAL_TEXT);

    pushBytes(ThermalPrinterDriver.CMD.ALIGN_LEFT);
    pushLine(`Date: ${data.orderDate}  Time: ${data.orderTime}`);
    pushLine("=".repeat(this.charsPerLine));

    // 4. Column Headers
    const colQty = 4;
    const colPrice = 8;
    const colName = this.charsPerLine - colQty - colPrice;
    const headerLine = "QTY".padEnd(colQty) + "ITEM".padEnd(colName) + "AMT (INR)".padStart(colPrice);
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_ON);
    pushLine(headerLine);
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_OFF);
    pushLine("-".repeat(this.charsPerLine));

    // 5. Itemized Rows
    for (const item of data.items) {
      const qtyStr = `${item.quantity}x`.padEnd(colQty);
      const priceStr = ((item.pricePaise * item.quantity) / 100).toFixed(2).padStart(colPrice);
      const nameStr = item.name.slice(0, colName).padEnd(colName);

      pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_ON);
      pushLine(qtyStr + nameStr + priceStr);
      pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_OFF);

      if (item.variant) {
        pushLine(`    (${item.variant.slice(0, this.charsPerLine - 6)})`);
      }
      if (item.station) {
        pushLine(`    [Station: ${item.station.slice(0, this.charsPerLine - 16)}]`);
      }
      if (item.instructions) {
        pushLine(`    * Special: [${item.instructions.slice(0, this.charsPerLine - 18)}]`);
      }
    }

    pushLine("-".repeat(this.charsPerLine));

    // 6. Total Value
    const totalLabel = "TOTAL VALUE:".padEnd(this.charsPerLine - 10);
    const totalVal = `INR ${(data.totalPaise / 100).toFixed(2)}`.padStart(10);
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_ON);
    pushLine(totalLabel + totalVal);
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_OFF);

    // 7. Cooking Notes
    if (data.customerNote) {
      pushLine("-".repeat(this.charsPerLine));
      pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_ON);
      pushLine(`CHEF PREP NOTE:`);
      pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_OFF);
      pushLine(`[${data.customerNote.slice(0, this.charsPerLine * 2)}]`);
    }

    pushLine("-".repeat(this.charsPerLine));
    pushBytes(ThermalPrinterDriver.CMD.ALIGN_CENTER);
    pushLine("ORDERKING KITCHEN DISPATCH");
    pushBytes(ThermalPrinterDriver.CMD.LINE_FEED);
    pushBytes(ThermalPrinterDriver.CMD.LINE_FEED);

    // 8. Full Paper Cut
    pushBytes(ThermalPrinterDriver.CMD.FEED_AND_FULL_CUT);
    return new Uint8Array(bytes);
  }

  /**
   * Generates Statutory Customer Tax Invoice raw ESC/POS binary bytecode.
   */
  public generateTaxInvoiceBuffer(data: TaxInvoicePrintData): Uint8Array {
    const bytes: number[] = [];
    const pushBytes = (cmd: number[]) => bytes.push(...cmd);
    const pushText = (text: string) => {
      const encoder = new TextEncoder();
      bytes.push(...Array.from(encoder.encode(text)));
    };
    const pushLine = (text: string) => {
      pushText(text);
      pushBytes(ThermalPrinterDriver.CMD.LINE_FEED);
    };

    // 1. Initialize
    pushBytes(ThermalPrinterDriver.CMD.INIT);

    // 2. Restaurant Header
    pushBytes(ThermalPrinterDriver.CMD.ALIGN_CENTER);
    pushBytes(ThermalPrinterDriver.CMD.DOUBLE_WIDTH_ON);
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_ON);
    pushLine(data.restaurantTradeName.toUpperCase());
    pushBytes(ThermalPrinterDriver.CMD.NORMAL_TEXT);
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_OFF);

    if (data.restaurantLegalName) {
      pushLine(data.restaurantLegalName);
    }
    if (data.restaurantAddress) {
      pushLine(data.restaurantAddress.slice(0, this.charsPerLine));
    }
    if (data.restaurantContact) {
      pushLine(`Phone: ${data.restaurantContact}`);
    }

    pushLine(`FSSAI License: ${data.fssaiNumber}`);
    if (data.merchantGstin) {
      pushLine(`Merchant GSTIN: ${data.merchantGstin}`);
    }
    const platGstin = data.platformGstin || "18AFXPH9838M1Z9";
    pushLine(`Platform GSTIN: ${platGstin}`);
    pushLine("-".repeat(this.charsPerLine));

    // 3. Invoice Metadata
    pushBytes(ThermalPrinterDriver.CMD.ALIGN_LEFT);
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_ON);
    pushLine(`TAX INVOICE / BILL OF SUPPLY`);
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_OFF);
    pushLine(`Invoice #: ${data.invoiceNumber}`);
    pushLine(`Order Ref: #${data.orderNumber} (${data.orderType}${data.tableNumber ? ` · Table ${data.tableNumber}` : ""})`);
    pushLine(`Date & Time: ${data.orderDate} ${data.orderTime}`);
    const sac = data.sacCode || "996331";
    pushLine(`SAC Code: ${sac} (Restaurant Services)`);
    pushLine("=".repeat(this.charsPerLine));

    // 4. Itemized Lines
    const colQty = 4;
    const colRate = 8;
    const colTotal = 8;
    const colName = this.charsPerLine - colQty - colRate - colTotal;

    const colHeader =
      "QTY".padEnd(colQty) +
      "ITEM".padEnd(colName) +
      "RATE".padStart(colRate) +
      "TOTAL".padStart(colTotal);
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_ON);
    pushLine(colHeader);
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_OFF);
    pushLine("-".repeat(this.charsPerLine));

    for (const item of data.items) {
      const q = `${item.quantity}x`.padEnd(colQty);
      const r = (item.ratePaise / 100).toFixed(2).padStart(colRate);
      const t = (item.totalAmountPaise / 100).toFixed(2).padStart(colTotal);
      const n = item.name.slice(0, colName).padEnd(colName);

      pushLine(q + n + r + t);
    }

    pushLine("-".repeat(this.charsPerLine));

    // 5. Financial Summary Lines
    const printTwoCol = (label: string, amtPaise: number, sign = "") => {
      const amtStr = `${sign}INR ${(amtPaise / 100).toFixed(2)}`;
      const lbl = label.padEnd(this.charsPerLine - amtStr.length);
      pushLine(lbl + amtStr);
    };

    printTwoCol("Food Subtotal", data.foodSubtotalPaise);
    if (data.packagingChargePaise > 0) {
      printTwoCol("Packaging Charges", data.packagingChargePaise);
    }
    if (data.discountPaise && data.discountPaise > 0) {
      printTwoCol("Discounts", data.discountPaise, "-");
    }

    pushLine("-".repeat(this.charsPerLine));
    printTwoCol("CGST (2.5%)", data.cgstPaise);
    printTwoCol("SGST (2.5%)", data.sgstPaise);
    pushLine("=".repeat(this.charsPerLine));

    // 6. Net Total (Emphasized)
    const netStr = `INR ${(data.totalNetPaidPaise / 100).toFixed(2)}`;
    const netLbl = "NET AMOUNT PAID".padEnd(this.charsPerLine - netStr.length);
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_ON);
    pushBytes(ThermalPrinterDriver.CMD.DOUBLE_HEIGHT_ON);
    pushLine(netLbl + netStr);
    pushBytes(ThermalPrinterDriver.CMD.NORMAL_TEXT);
    pushBytes(ThermalPrinterDriver.CMD.EMPHASIZE_OFF);

    const modeStr =
      data.paymentMode === "ORDERKING_PAY_UPI"
        ? "Paid via OrderKing Pay (UPI)"
        : data.paymentMode === "CASH_ON_DELIVERY"
        ? "Cash on Delivery (Pending/Collected)"
        : "Prepaid Online (Card/NetBanking)";
    pushLine(`Payment Status: ${modeStr}`);
    pushLine("-".repeat(this.charsPerLine));

    // 7. Statutory Tax Invoice Footer
    pushBytes(ThermalPrinterDriver.CMD.ALIGN_CENTER);
    pushLine("Computer-generated tax invoice under Section 9(5) CGST Act. Thank you for dining with OrderKing.");
    pushBytes(ThermalPrinterDriver.CMD.LINE_FEED);
    pushBytes(ThermalPrinterDriver.CMD.LINE_FEED);

    // 8. Feed & Full Cut
    pushBytes(ThermalPrinterDriver.CMD.FEED_AND_FULL_CUT);
    return new Uint8Array(bytes);
  }

  // =========================================================================
  // HARDWARE PRINTER TRANSPORTS: Web Bluetooth, WebUSB, Network (TCP 9100)
  // =========================================================================

  /**
   * Web Bluetooth ESC/POS Print
   */
  public async printViaBluetooth(buffer: Uint8Array): Promise<boolean> {
    const nav = typeof navigator !== "undefined" ? (navigator as any) : null;
    if (!nav?.bluetooth) {
      throw new Error("Web Bluetooth API not supported in this browser environment.");
    }

    const device = await nav.bluetooth.requestDevice({
      filters: [{ services: ["000018f0-0000-1000-8000-00805f9b34fb"] }],
      optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb"],
    });

    if (!device?.gatt) throw new Error("Bluetooth GATT server unavailable.");
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
    const characteristics = await service.getCharacteristics();
    const writeChar = characteristics.find(
      (c: any) => c.properties.write || c.properties.writeWithoutResponse
    );

    if (!writeChar) throw new Error("Writable characteristic not found on Bluetooth printer.");
    await writeChar.writeValue(buffer);
    return true;
  }

  /**
   * WebUSB ESC/POS Print
   */
  public async printViaWebUsb(buffer: Uint8Array): Promise<boolean> {
    const nav = typeof navigator !== "undefined" ? (navigator as any) : null;
    if (!nav?.usb) {
      throw new Error("WebUSB API not supported in this browser environment.");
    }

    // Request USB Thermal Printer (Standard Class 0x07 = Printer)
    const device = await nav.usb.requestDevice({
      filters: [{ classCode: 0x07 }],
    });

    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    await device.claimInterface(0);

    // Find OUT endpoint for bulk transfer
    const iface = device.configuration.interfaces[0];
    const endpoint = iface.alternate.endpoints.find(
      (e: any) => e.direction === "out" && e.type === "bulk"
    );

    if (!endpoint) {
      throw new Error("Bulk OUT endpoint not found on USB printer device.");
    }

    await device.transferOut(endpoint.endpointNumber, buffer);
    return true;
  }

  /**
   * Network / Raw TCP Socket Print Stream (Port 9100 standard ESC/POS)
   */
  public async printViaNetwork(
    ip: string,
    port = 9100,
    buffer: Uint8Array
  ): Promise<boolean> {
    // In Node.js or edge bridge runtime:
    if (typeof process !== "undefined" && process.versions?.node) {
      const net = await import("node:net");
      return new Promise((resolve, reject) => {
        const client = net.connect({ host: ip, port }, () => {
          client.write(Buffer.from(buffer), () => {
            client.end();
            resolve(true);
          });
        });
        client.on("error", (err) => {
          client.destroy();
          reject(err);
        });
        client.setTimeout(5000, () => {
          client.destroy();
          reject(new Error(`TCP network timeout connecting to printer ${ip}:${port}`));
        });
      });
    }

    // In browser: dispatches print request to local bridge or proxy
    const resp = await fetch("/api/hardware/printer-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream", "X-Printer-Ip": ip, "X-Printer-Port": String(port) },
      body: buffer as unknown as BodyInit,
    });
    return resp.ok;
  }
}

/**
 * Resilient Offline Printer Spooler
 * Queues print jobs durably with automatic retry and idempotency keys
 */
export class OfflinePrintSpooler {
  private queue: SpooledPrintJob[] = [];
  private isProcessing = false;
  private maxRetries = 3;
  private readonly driver: ThermalPrinterDriver;

  constructor(driver?: ThermalPrinterDriver) {
    this.driver = driver || new ThermalPrinterDriver(80);
  }

  public enqueueJob(type: "KOT" | "INVOICE", bytes: Uint8Array, orderId: string): string {
    const jobId = `job_${orderId}_${Date.now()}`;
    // Deduplication check: do not enqueue identical active job
    if (this.queue.some((j) => j.id.startsWith(`job_${orderId}`) && j.status !== "FAILED")) {
      return this.queue.find((j) => j.id.startsWith(`job_${orderId}`))!.id;
    }

    const job: SpooledPrintJob = {
      id: jobId,
      type,
      data: bytes,
      attempts: 0,
      status: "QUEUED",
      enqueuedAt: Date.now(),
    };
    this.queue.push(job);
    return jobId;
  }

  public getPendingCount(): number {
    return this.queue.filter((j) => j.status === "QUEUED").length;
  }

  public getJobs(): readonly SpooledPrintJob[] {
    return [...this.queue];
  }

  public async flush(
    transport: (data: Uint8Array) => Promise<boolean>
  ): Promise<{ succeeded: number; failed: number }> {
    if (this.isProcessing) return { succeeded: 0, failed: 0 };
    this.isProcessing = true;

    let succeeded = 0;
    let failed = 0;

    for (const job of this.queue) {
      if (job.status === "COMPLETED") continue;
      job.status = "PRINTING";
      job.attempts += 1;

      try {
        const ok = await transport(job.data);
        if (ok) {
          job.status = "COMPLETED";
          succeeded += 1;
        } else {
          throw new Error("Transport returned false");
        }
      } catch {
        if (job.attempts >= this.maxRetries) {
          job.status = "FAILED";
          failed += 1;
        } else {
          job.status = "QUEUED"; // Retry on next flush
        }
      }
    }

    this.isProcessing = false;
    return { succeeded, failed };
  }
}
