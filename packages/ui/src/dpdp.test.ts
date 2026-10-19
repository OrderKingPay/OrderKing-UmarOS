import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  maskCustomerPhoneNumber,
  validateDpdpConsentRecord,
  evaluateDataRetentionStatus,
  generateDataPrincipalSummary,
  DPDP_OFFICIAL_DPO,
} from "./dpdp.ts";

describe("DPDP Act 2023 Data Governance Engine (packages/ui/src/dpdp.ts)", () => {
  describe("maskCustomerPhoneNumber", () => {
    it("masks 10-digit Indian phone numbers showing only first 2 and last 3 digits", () => {
      assert.strictEqual(maskCustomerPhoneNumber("9876543210"), "+91 98XXX XX210");
      assert.strictEqual(maskCustomerPhoneNumber("+919876543210"), "+91 98XXX XX210");
      assert.strictEqual(maskCustomerPhoneNumber("09876543210"), "+0 98XXX XX210");
    });

    it("handles invalid or short inputs safely", () => {
      assert.strictEqual(maskCustomerPhoneNumber("123"), "XXXXXXXXXX");
      assert.strictEqual(maskCustomerPhoneNumber(""), "XXXXXXXXXX");
      assert.strictEqual(maskCustomerPhoneNumber(null), "XXXXXXXXXX");
    });
  });

  describe("validateDpdpConsentRecord", () => {
    it("validates compliant explicit consent record", () => {
      const validRecord = {
        dataPrincipalId: "usr_cust_9981",
        dataPrincipalType: "CUSTOMER" as const,
        consentedPurposes: ["ORDER_FULFILLMENT" as const, "PAYMENT_AND_TAX_COMPLIANCE" as const],
        noticeVersion: "v2026.1",
        consentTimestampIso: new Date().toISOString(),
        ipAddress: "103.21.244.1",
        isFreelyGiven: true,
      };

      const result = validateDpdpConsentRecord(validRecord);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it("flags non-compliant consent records (bundled, missing IP, or empty purposes)", () => {
      const invalidRecord = {
        dataPrincipalId: "",
        dataPrincipalType: "CUSTOMER" as const,
        consentedPurposes: [],
        noticeVersion: "",
        consentTimestampIso: "invalid-date",
        ipAddress: "",
        isFreelyGiven: false, // Bundled / forced consent
      };

      const result = validateDpdpConsentRecord(invalidRecord);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.length >= 4);
    });
  });

  describe("evaluateDataRetentionStatus (Section 36 CGST Act vs DPDP Purge)", () => {
    const fixedNow = new Date(2026, 9, 20); // 2026-10-20

    it("strictly preserves financial ledgers and tax invoices for 72 months (6 years)", () => {
      // 2 years old financial record
      const twoYearsOld = new Date(2024, 9, 20);
      const evalFinancial = evaluateDataRetentionStatus("FINANCIAL_LEDGER", twoYearsOld, fixedNow);
      assert.strictEqual(evalFinancial.canBeDeleted, false);
      assert.strictEqual(evalFinancial.actionRequired, "RETAIN_MANDATORY");
      assert.ok(evalFinancial.retentionBasis.includes("Section 36 Central Goods and Services Tax"));
      assert.strictEqual(evalFinancial.statutoryRetentionMonths, 72);

      const evalInvoice = evaluateDataRetentionStatus("TAX_INVOICE", twoYearsOld, fixedNow);
      assert.strictEqual(evalInvoice.canBeDeleted, false);
      assert.strictEqual(evalInvoice.actionRequired, "RETAIN_MANDATORY");
    });

    it("allows purging of ephemeral GPS telemetry after 90 days (3 months)", () => {
      // 100 days old GPS breadcrumbs
      const hundredDaysOld = new Date(fixedNow.getTime() - 100 * 24 * 60 * 60 * 1000);
      const evalGps = evaluateDataRetentionStatus("GPS_TELEMETRY", hundredDaysOld, fixedNow);
      assert.strictEqual(evalGps.canBeDeleted, true);
      assert.strictEqual(evalGps.actionRequired, "ELIGIBLE_FOR_PURGE");
    });

    it("protects recent GPS telemetry within 90 days for dispute resolution", () => {
      // 30 days old GPS breadcrumbs
      const thirtyDaysOld = new Date(fixedNow.getTime() - 30 * 24 * 60 * 60 * 1000);
      const evalRecentGps = evaluateDataRetentionStatus("GPS_TELEMETRY", thirtyDaysOld, fixedNow);
      assert.strictEqual(evalRecentGps.canBeDeleted, false);
      assert.strictEqual(evalRecentGps.actionRequired, "RETAIN_MANDATORY");
    });
  });

  describe("generateDataPrincipalSummary (Section 11 DPDP Act 2023)", () => {
    it("generates complete statutory data principal report with DPO grievance channel", () => {
      const summary = generateDataPrincipalSummary("usr_merchant_456", "MERCHANT");
      assert.strictEqual(summary.dataPrincipalId, "usr_merchant_456");
      assert.strictEqual(summary.dataPrincipalType, "MERCHANT");
      assert.ok(summary.processedCategories.length > 0);
      assert.ok(summary.dataFiduciariesSharedWith.includes("OrderKing Technologies Private Limited (Data Fiduciary)"));
      assert.strictEqual(summary.dpoGrievanceDesk.email, DPDP_OFFICIAL_DPO.email);
      assert.strictEqual(summary.dpoGrievanceDesk.escalationSlaDays, 15);
      assert.ok(summary.rightsAvailable.some(r => r.includes("Section 11: Right to Access Summary")));
      assert.ok(summary.rightsAvailable.some(r => r.includes("Section 12: Right to Correction")));
      assert.ok(summary.rightsAvailable.some(r => r.includes("Section 13: Right of Grievance Redressal")));
    });
  });
});
