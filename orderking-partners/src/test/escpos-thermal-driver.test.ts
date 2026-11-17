import { describe, it, expect, vi } from "vitest";
import {
  ThermalPrinterDriver,
  OfflinePrintSpooler,
  type KOTPrintData,
  type TaxInvoicePrintData,
} from "../hardware/escpos/ThermalPrinterDriver";

describe("ThermalPrinterDriver - Petpooja/Vyapar Standard ESC/POS Engine", () => {
  it("verifies exact raw byte command sequences match industrial ESC/POS standards", () => {
    expect(ThermalPrinterDriver.CMD.INIT).toEqual([0x1b, 0x40]);
    expect(ThermalPrinterDriver.CMD.ALIGN_CENTER).toEqual([0x1b, 0x61, 0x01]);
    expect(ThermalPrinterDriver.CMD.DOUBLE_HW_ON).toEqual([0x1b, 0x21, 0x30]);
    expect(ThermalPrinterDriver.CMD.FEED_AND_FULL_CUT).toEqual([0x1d, 0x56, 0x41, 0x00]);
    expect(ThermalPrinterDriver.CMD.DRAWER_KICK).toEqual([0x1b, 0x70, 0x00, 0x19, 0xfa]);
    expect(ThermalPrinterDriver.CMD.LINE_FEED).toEqual([0x0a]);
  });

  it("configures column widths correctly for 58mm and 80mm rolls", () => {
    const driver58 = new ThermalPrinterDriver(58);
    expect(driver58.width).toBe(58);
    expect(driver58.charsPerLine).toBe(32);

    const driver80 = new ThermalPrinterDriver(80);
    expect(driver80.width).toBe(80);
    expect(driver80.charsPerLine).toBe(48);
  });

  it("generates authentic Kitchen Order Ticket (KOT) raw binary buffer", () => {
    const driver = new ThermalPrinterDriver(80);
    const kotData: KOTPrintData = {
      restaurantName: "Assam Zaika Cloud Kitchen",
      fssaiNumber: "10323999000123",
      orderNumber: "OK-4902",
      orderSource: "DELIVERY",
      orderDate: "2026-11-17",
      orderTime: "16:45:00",
      items: [
        {
          name: "Chicken Biryani (Full)",
          quantity: 2,
          pricePaise: 32000,
          variant: "Spicy / Raita",
          station: "Tandoor & Rice",
          instructions: "Less spicy, extra raita",
        },
        {
          name: "Garlic Butter Naan",
          quantity: 3,
          pricePaise: 8000,
          station: "Clay Oven",
        },
      ],
      totalPaise: 88000,
      customerNote: "Ring doorbell twice, avoid plastic cutlery",
    };

    const buffer = driver.generateKOTBuffer(kotData);
    expect(buffer).toBeInstanceOf(Uint8Array);
    expect(buffer.length).toBeGreaterThan(100);

    // Verify INIT command at byte 0
    expect(buffer[0]).toBe(0x1b);
    expect(buffer[1]).toBe(0x40);

    // Decode textual content
    const decodedText = new TextDecoder().decode(buffer);
    expect(decodedText).toContain("ASSAM ZAIKA CLOUD KITCHEN");
    expect(decodedText).toContain("FSSAI: 10323999000123");
    expect(decodedText).toContain("DELIVERY ORDER");
    expect(decodedText).toContain("KOT #OK-4902");
    expect(decodedText).toContain("Chicken Biryani");
    expect(decodedText).toContain("Less spicy, extra raita");
    expect(decodedText).toContain("Ring doorbell twice");
    expect(decodedText).toContain("ORDERKING KITCHEN DISPATCH");

    // Verify paper cut at the end
    const lastFour = Array.from(buffer.slice(-4));
    expect(lastFour).toEqual([0x1d, 0x56, 0x41, 0x00]);
  });

  it("generates statutory Customer Tax Invoice with SAC 996331, FSSAI, GSTIN 18AFXPH9838M1Z9", () => {
    const driver = new ThermalPrinterDriver(80);
    const invoiceData: TaxInvoicePrintData = {
      restaurantTradeName: "Brahmaputra Spice Bistro",
      restaurantLegalName: "Brahmaputra Gourmet Hospitality LLP",
      restaurantAddress: "College Road, Hailakandi, Assam - 788151",
      restaurantContact: "+91 9395065587",
      fssaiNumber: "10321999000456",
      merchantGstin: "18ABCDE1234F1Z5",
      platformGstin: "18AFXPH9838M1Z9",
      sacCode: "996331",
      invoiceNumber: "INV-2026-8812",
      orderNumber: "OK-7721",
      orderDate: "2026-11-17",
      orderTime: "16:48:30",
      orderType: "DELIVERY",
      items: [
        {
          name: "Paneer Butter Masala",
          quantity: 1,
          ratePaise: 24000,
          totalAmountPaise: 24000,
        },
        {
          name: "Jeera Rice",
          quantity: 1,
          ratePaise: 16000,
          totalAmountPaise: 16000,
        },
      ],
      foodSubtotalPaise: 40000,
      packagingChargePaise: 3000,
      cgstPaise: 1075, // 2.5% on (40000 + 3000) = 43000 * 0.025 = 1075
      sgstPaise: 1075, // 2.5% on 43000 = 1075
      totalNetPaidPaise: 45150,
      paymentMode: "ORDERKING_PAY_UPI",
    };

    const buffer = driver.generateTaxInvoiceBuffer(invoiceData);
    expect(buffer).toBeInstanceOf(Uint8Array);
    const text = new TextDecoder().decode(buffer);

    expect(text).toContain("BRAHMAPUTRA SPICE BISTRO");
    expect(text).toContain("FSSAI License: 10321999000456");
    expect(text).toContain("SAC Code: 996331 (Restaurant Services)");
    expect(text).toContain("Merchant GSTIN: 18ABCDE1234F1Z5");
    expect(text).toContain("Platform GSTIN: 18AFXPH9838M1Z9");
    expect(text).toContain("CGST (2.5%)");
    expect(text).toContain("SGST (2.5%)");
    expect(text).toContain("Paid via OrderKing Pay (UPI)");
    expect(text).toContain("Section 9(5) CGST Act. Thank you for dining with OrderKing.");
  });

  describe("OfflinePrintSpooler", () => {
    it("enqueues jobs and deduplicates identical order prints", () => {
      const spooler = new OfflinePrintSpooler();
      const mockBytes = new Uint8Array([0x1b, 0x40, 0x0a]);

      const job1 = spooler.enqueueJob("KOT", mockBytes, "ord_101");
      expect(job1).toBeDefined();
      expect(spooler.getPendingCount()).toBe(1);

      // Duplicate order print request returns same jobId and avoids double queue
      const job2 = spooler.enqueueJob("KOT", mockBytes, "ord_101");
      expect(job2).toBe(job1);
      expect(spooler.getPendingCount()).toBe(1);

      // Different order creates new job
      const job3 = spooler.enqueueJob("INVOICE", mockBytes, "ord_102");
      expect(job3).not.toBe(job1);
      expect(spooler.getPendingCount()).toBe(2);
    });

    it("flushes print queue with success and marks jobs completed", async () => {
      const spooler = new OfflinePrintSpooler();
      const mockBytes = new Uint8Array([0x1b, 0x40]);
      spooler.enqueueJob("KOT", mockBytes, "ord_201");
      spooler.enqueueJob("INVOICE", mockBytes, "ord_202");

      const mockTransport = vi.fn().mockResolvedValue(true);
      const res = await spooler.flush(mockTransport);

      expect(res.succeeded).toBe(2);
      expect(res.failed).toBe(0);
      expect(spooler.getPendingCount()).toBe(0);
      expect(mockTransport).toHaveBeenCalledTimes(2);

      const jobs = spooler.getJobs();
      expect(jobs.every((j) => j.status === "COMPLETED")).toBe(true);
    });

    it("handles transport failures with retries and eventual FAILED status", async () => {
      const spooler = new OfflinePrintSpooler();
      const mockBytes = new Uint8Array([0x1b, 0x40]);
      spooler.enqueueJob("KOT", mockBytes, "ord_fail_1");

      const failingTransport = vi.fn().mockRejectedValue(new Error("Printer paper out"));

      // 1st attempt
      await spooler.flush(failingTransport);
      expect(spooler.getJobs()[0].attempts).toBe(1);
      expect(spooler.getJobs()[0].status).toBe("QUEUED");

      // 2nd attempt
      await spooler.flush(failingTransport);
      expect(spooler.getJobs()[0].attempts).toBe(2);
      expect(spooler.getJobs()[0].status).toBe("QUEUED");

      // 3rd attempt: reaches maxRetries (3) -> FAILED
      const finalRes = await spooler.flush(failingTransport);
      expect(finalRes.failed).toBe(1);
      expect(spooler.getJobs()[0].attempts).toBe(3);
      expect(spooler.getJobs()[0].status).toBe("FAILED");
    });
  });
});
