import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculatePlanetaryRevenueHarvest,
  generateMeityUpiClaimSchedule,
  CORPORATE_CATERING_PIPELINE,
} from "./revenue-harvester.ts";

describe("Planetary Revenue Harvester & Direct Money Generator Core", () => {
  it("strictly throws an error if owner consent is not provided", () => {
    assert.throws(
      () => {
        calculatePlanetaryRevenueHarvest({ ownerConsent: false });
      },
      {
        message: /OWNER_CONSENT_REQUIRED/,
      }
    );
  });

  it("calculates balanced double-entry revenue harvest when owner consent is verified", () => {
    const summary = calculatePlanetaryRevenueHarvest({
      ownerConsent: true,
      activeRestaurantsCount: 200,
      monthlyOrdersCount: 30000,
      monthlyGmvPaise: 900000000, // ₹90 Lakhs GMV
    });

    assert.equal(summary.ownerConsentVerified, true);
    assert.ok(summary.totalMonthlyCollectibleYieldPaise > 0);
    assert.ok(summary.totalAnnualCollectibleYieldPaise > 0);
    assert.equal(summary.streams.length, 11);

    // Verify double-entry ledger balance
    const totalDebits = summary.ledgerEntriesToPost
      .filter((e) => e.entryType === "DEBIT")
      .reduce((sum, e) => sum + e.amountPaise, 0);
    const totalCredits = summary.ledgerEntriesToPost
      .filter((e) => e.entryType === "CREDIT")
      .reduce((sum, e) => sum + e.amountPaise, 0);

    assert.equal(totalDebits, totalCredits, "Debits and Credits must balance exactly in integer paise");
    assert.equal(totalDebits, summary.totalMonthlyCollectibleYieldPaise);
  });

  it("accurately generates statutory MeitY 0.40% UPI claim schedule", () => {
    const claim = generateMeityUpiClaimSchedule({
      quarter: "Q1_2026_27",
      upiTransactionsCount: 25000,
      rupayTransactionsCount: 2500,
      totalEligibleVolumePaise: 750000000, // ₹75 Lakhs
    });

    // 0.40% of 750,000,000 paise = 3,000,000 paise (₹30,000.00)
    assert.equal(claim.reimbursementRateBps, 40);
    assert.equal(claim.totalClaimAmountPaise, 3000000);
    assert.ok(claim.claimSubmissionXmlPayload.includes("<BatchId>"));
    assert.ok(claim.claimSubmissionXmlPayload.includes("OrderKing Technologies Private Limited"));
    assert.ok(claim.claimSubmissionXmlPayload.includes("0.40%"));
    assert.equal(claim.nodalBankEscrowIfsc, "SBIN0000108");
  });

  it("includes all 5 regional corporate catering contracts with locked 15% margin", () => {
    assert.equal(CORPORATE_CATERING_PIPELINE.length, 5);

    const nit = CORPORATE_CATERING_PIPELINE.find((c) => c.id === "corp_nit_silchar");
    assert.ok(nit);
    assert.equal(nit.platformMarginBps, 1500); // 15%
    assert.equal(nit.monthlyPlatformProfitPaise, 3600000); // ₹36,000
    assert.ok(nit.rfpProposalLetter.includes("National Institute of Technology (NIT) Silchar"));

    const dc = CORPORATE_CATERING_PIPELINE.find((c) => c.id === "corp_dc_office_sribhumi");
    assert.ok(dc);
    assert.equal(dc.platformMarginBps, 1500);
    assert.equal(dc.monthlyPlatformProfitPaise, 2250000); // ₹22,500
    assert.ok(dc.rfpProposalLetter.includes("Deputy Commissioner"));

    const hospital = CORPORATE_CATERING_PIPELINE.find((c) => c.id === "corp_civil_hospital_karimganj");
    assert.ok(hospital);
    assert.equal(hospital.platformMarginBps, 1500);
    assert.equal(hospital.monthlyPlatformProfitPaise, 3150000); // ₹31,500
  });
});
