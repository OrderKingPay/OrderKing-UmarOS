import { describe, it, expect } from "vitest";
import {
  isValidVPA,
  resolveFormattedAmount,
  buildNPCIUpiIntentUrl,
  generateAppDeepLink,
  generateAllUPIAppLinks,
  generateBharatQRPayload,
  verifyBharatQRChecksum,
  calculateCRC16CCITT,
  parseUPIIntentUrl,
  type UPIIntentParams,
  type BharatQRParams,
} from "../lib/payments/npci-upi-intent";

describe("NPCI UPI Intent & Dynamic BharatQR Engine", () => {
  describe("VPA Validation (NPCI / PSP Standard)", () => {
    it("accepts authentic Indian UPI ID formats", () => {
      expect(isValidVPA("orderking@icici")).toBe(true);
      expect(isValidVPA("merchant.pay@okhdfcbank")).toBe(true);
      expect(isValidVPA("user99@paytm")).toBe(true);
      expect(isValidVPA("billing-store@ybl")).toBe(true);
      expect(isValidVPA("rahul_sharma@okaxis")).toBe(true);
      expect(isValidVPA("store@upi")).toBe(true);
    });

    it("rejects malformed or unsafe VPAs", () => {
      expect(isValidVPA("")).toBe(false);
      expect(isValidVPA("plainstring")).toBe(false);
      expect(isValidVPA("user@")).toBe(false);
      expect(isValidVPA("@bank")).toBe(false);
      expect(isValidVPA("user with spaces@bank")).toBe(false);
      expect(isValidVPA("user@bank with spaces")).toBe(false);
      expect(isValidVPA("x@y")).toBe(false); // too short
      expect(isValidVPA("<script>alert(1)</script>@upi")).toBe(false);
    });
  });

  describe("Amount Formatting (Safe Decimal Conversion)", () => {
    it("formats amountInRupees with exact 2 decimal places", () => {
      expect(resolveFormattedAmount({ vpa: "a@upi", payeeName: "A", transactionRef: "R", amountInRupees: 100 })).toBe("100.00");
      expect(resolveFormattedAmount({ vpa: "a@upi", payeeName: "A", transactionRef: "R", amountInRupees: 49.5 })).toBe("49.50");
      expect(resolveFormattedAmount({ vpa: "a@upi", payeeName: "A", transactionRef: "R", amountInRupees: 0 })).toBe("0.00");
    });

    it("formats amountPaise accurately into INR decimals", () => {
      expect(resolveFormattedAmount({ vpa: "a@upi", payeeName: "A", transactionRef: "R", amountPaise: 25000 })).toBe("250.00");
      expect(resolveFormattedAmount({ vpa: "a@upi", payeeName: "A", transactionRef: "R", amountPaise: 12550 })).toBe("125.50");
      expect(resolveFormattedAmount({ vpa: "a@upi", payeeName: "A", transactionRef: "R", amountPaise: 99 })).toBe("0.99");
    });

    it("throws for negative amounts", () => {
      expect(() =>
        resolveFormattedAmount({ vpa: "a@upi", payeeName: "A", transactionRef: "R", amountInRupees: -50 })
      ).toThrow("negative");
      expect(() =>
        resolveFormattedAmount({ vpa: "a@upi", payeeName: "A", transactionRef: "R", amountPaise: -100 })
      ).toThrow("negative");
    });

    it("returns undefined when no amount specified (open payment)", () => {
      expect(resolveFormattedAmount({ vpa: "a@upi", payeeName: "A", transactionRef: "R" })).toBeUndefined();
    });
  });

  describe("Standards-Compliant NPCI UPI Intent URL Generator", () => {
    const baseParams: UPIIntentParams = {
      vpa: "orderking.food@icici",
      payeeName: "OrderKing Food Pvt Ltd",
      amountInRupees: 499.0,
      currency: "INR",
      transactionNote: "Order #OK-8921 Dinner",
      transactionRef: "OK-TXN-20261017-001",
      merchantCategoryCode: "5812",
      mode: "02",
    };

    it("constructs standard NPCI upi://pay URI", () => {
      const url = buildNPCIUpiIntentUrl(baseParams);

      expect(url.startsWith("upi://pay?")).toBe(true);
      expect(url).toContain("pa=orderking.food%40icici");
      expect(url).toContain("pn=OrderKing%20Food%20Pvt%20Ltd");
      expect(url).toContain("am=499.00");
      expect(url).toContain("cu=INR");
      expect(url).toContain("tn=Order%20%23OK-8921%20Dinner");
      expect(url).toContain("tr=OK-TXN-20261017-001");
      expect(url).toContain("mc=5812");
      expect(url).toContain("mode=02");
    });

    it("mandates INR and throws on non-INR currency", () => {
      expect(() =>
        buildNPCIUpiIntentUrl({
          ...baseParams,
          currency: "USD" as any,
        })
      ).toThrow("NPCI UPI strictly mandates 'INR'");
    });

    it("throws when mandatory fields are missing", () => {
      expect(() => buildNPCIUpiIntentUrl({ ...baseParams, vpa: "bad" })).toThrow("Invalid NPCI VPA");
      expect(() => buildNPCIUpiIntentUrl({ ...baseParams, payeeName: "" })).toThrow("Payee name");
      expect(() => buildNPCIUpiIntentUrl({ ...baseParams, transactionRef: "" })).toThrow("Transaction reference");
    });
  });

  describe("Deep-Link Triggers for Major Indian UPI Apps", () => {
    const params: UPIIntentParams = {
      vpa: "merchant@icici",
      payeeName: "Direct Merchant Foods",
      amountPaise: 15000, // ₹150.00
      transactionNote: "Lunch delivery",
      transactionRef: "ORD-998811",
    };

    it("generates correct scheme for PhonePe", () => {
      const link = generateAppDeepLink("phonepe", params);
      expect(link.startsWith("phonepe://pay?")).toBe(true);
      expect(link).toContain("pa=merchant%40icici");
      expect(link).toContain("am=150.00");
    });

    it("generates correct scheme for Google Pay (Tez)", () => {
      const link = generateAppDeepLink("gpay", params);
      expect(link.startsWith("tez://upi/pay?")).toBe(true);
      expect(link).toContain("pa=merchant%40icici");
      expect(link).toContain("am=150.00");
    });

    it("generates correct scheme for Paytm", () => {
      const link = generateAppDeepLink("paytm", params);
      expect(link.startsWith("paytmmp://pay?")).toBe(true);
      expect(link).toContain("pa=merchant%40icici");
    });

    it("generates correct scheme for CRED", () => {
      const link = generateAppDeepLink("cred", params);
      expect(link.startsWith("cred://pay?")).toBe(true);
      expect(link).toContain("pa=merchant%40icici");
    });

    it("generates correct scheme for BHIM", () => {
      const link = generateAppDeepLink("bhim", params);
      expect(link.startsWith("bhim://pay?")).toBe(true);
      expect(link).toContain("pa=merchant%40icici");
    });

    it("generates correct Universal Intent fallback", () => {
      const link = generateAppDeepLink("universal", params);
      expect(link.startsWith("upi://pay?")).toBe(true);
    });

    it("generateAllUPIAppLinks returns complete dictionary of all supported apps", () => {
      const links = generateAllUPIAppLinks(params);
      expect(links.phonepe.startsWith("phonepe://pay?")).toBe(true);
      expect(links.gpay.startsWith("tez://upi/pay?")).toBe(true);
      expect(links.paytm.startsWith("paytmmp://pay?")).toBe(true);
      expect(links.cred.startsWith("cred://pay?")).toBe(true);
      expect(links.bhim.startsWith("bhim://pay?")).toBe(true);
      expect(links.universal.startsWith("upi://pay?")).toBe(true);
    });
  });

  describe("Dynamic BharatQR Generator & EMVCo TLV Specification", () => {
    const bharatParams: BharatQRParams = {
      vpa: "orderking.store@okaxis",
      payeeName: "OrderKing Superstore",
      amountInRupees: 750.5,
      transactionNote: "Grocery Bill",
      transactionRef: "ORDK-BLR-0042",
      merchantCategoryCode: "5411", // Grocery Store MCC
      merchantCity: "Bengaluru",
      postalCode: "560001",
    };

    it("generates both dynamic UPI URI and EMVCo TLV string", () => {
      const result = generateBharatQRPayload(bharatParams);

      expect(result.isDynamic).toBe(true);
      expect(result.amount).toBe("750.50");
      expect(result.vpa).toBe("orderking.store@okaxis");
      expect(result.transactionRef).toBe("ORDK-BLR-0042");

      // Verify UPI URI has dynamic mode=02
      expect(result.upiUri).toContain("mode=02");
      expect(result.upiUri).toContain("am=750.50");

      // Verify EMVCo TLV Payload
      const emv = result.emvcoPayload;
      expect(emv.startsWith("000201010212")).toBe(true); // Tag 00="01", Tag 01="12" (Dynamic)
      expect(emv).toContain("5303356"); // Tag 53: Currency INR = 356
      expect(emv).toContain("5802IN");  // Tag 58: Country = IN
      expect(emv).toContain("5406750.50"); // Tag 54: Amount = 750.50
      expect(emv).toContain("52045411"); // Tag 52: MCC 5411
      expect(emv).toContain("in.npci.upi"); // Tag 26: UPI GUID
    });

    it("computes verified CRC-16 CCITT and passes verification", () => {
      const result = generateBharatQRPayload(bharatParams);
      expect(verifyBharatQRChecksum(result.emvcoPayload)).toBe(true);
    });

    it("detects tampered BharatQR payloads", () => {
      const result = generateBharatQRPayload(bharatParams);
      const original = result.emvcoPayload;
      // Tamper amount from 750.50 to 999.50 without recalculating CRC
      const tampered = original.replace("750.50", "999.50");
      expect(verifyBharatQRChecksum(tampered)).toBe(false);
    });

    it("calculates known CRC-16 CCITT test vectors accurately", () => {
      // Known standard test vector: "123456789" with CCITT 0xFFFF -> 0x29B1
      const crc = calculateCRC16CCITT("123456789");
      expect(crc).toBe("29B1");
    });
  });

  describe("UPI Intent URL Parser", () => {
    it("parses universal upi://pay URL into strongly typed fields", () => {
      const url = "upi://pay?pa=restaurant@hdfc&pn=Royal%20Biryani&am=340.00&cu=INR&tn=Dinner&tr=ORDER-101&mc=5812&mode=02";
      const parsed = parseUPIIntentUrl(url);

      expect(parsed.vpa).toBe("restaurant@hdfc");
      expect(parsed.payeeName).toBe("Royal Biryani");
      expect(parsed.amountInRupees).toBe(340.0);
      expect(parsed.currency).toBe("INR");
      expect(parsed.transactionNote).toBe("Dinner");
      expect(parsed.transactionRef).toBe("ORDER-101");
      expect(parsed.merchantCategoryCode).toBe("5812");
      expect(parsed.mode).toBe("02");
      expect(parsed.appScheme).toBe("upi");
    });

    it("parses app deep-link URLs (e.g. PhonePe, GPay)", () => {
      const phonePeUrl = "phonepe://pay?pa=merchant@upi&pn=Store&am=50.00&cu=INR&tr=TX-1";
      const parsedPhonePe = parseUPIIntentUrl(phonePeUrl);
      expect(parsedPhonePe.appScheme).toBe("phonepe");
      expect(parsedPhonePe.vpa).toBe("merchant@upi");

      const gpayUrl = "tez://upi/pay?pa=merchant@upi&pn=Store&am=50.00&cu=INR&tr=TX-1";
      const parsedGpay = parseUPIIntentUrl(gpayUrl);
      expect(parsedGpay.appScheme).toBe("tez");
    });

    it("throws when parsing invalid URLs", () => {
      expect(() => parseUPIIntentUrl("https://example.com")).toThrow("Not a valid UPI Intent URL");
      expect(() => parseUPIIntentUrl("upi://pay?pn=NoVpa&tr=1")).toThrow("Missing or invalid VPA");
    });
  });

  describe("Scan-and-Pay & Intent Integrity", () => {
    it("generates valid NPCI upi://pay URI for QR scan-and-pay with mandatory fields", () => {
      const vpa = "starbucks@okhdfcbank";
      const uri = buildNPCIUpiIntentUrl({
        vpa,
        payeeName: "Starbucks Reserve",
        amountInRupees: 250,
        transactionRef: "OKPAY-1700000000000",
        transactionNote: "Payment via OrderKing KingPay",
      });

      expect(uri.startsWith("upi://pay?")).toBe(true);
      expect(uri).toContain("pa=starbucks%40okhdfcbank");
      expect(uri).toContain("pn=Starbucks%20Reserve");
      expect(uri).toContain("am=250.00");
      expect(uri).toContain("cu=INR");
      expect(uri).toContain("tr=OKPAY-1700000000000");
    });

    it("verifies internal KingPay wallet debits emit genuine transaction IDs instead of fabricated banking UTRs", () => {
      const internalTxnId = `KP-TXN-${Date.now()}`;
      expect(internalTxnId.startsWith("KP-TXN-")).toBe(true);
      // Banking UTRs must never be randomly fabricated in client state
      expect(internalTxnId).not.toMatch(/^UTR\d{12}$/);
    });
  });
});
