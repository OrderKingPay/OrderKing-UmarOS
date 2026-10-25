import { describe, it, expect } from "vitest";
import {
  ORDERKING_PARTNER_AGREEMENT_SECTIONS,
  ORDERKING_PARTNER_AGREEMENT_METADATA,
  getFullAgreementLegalMarkdown
} from "../lib/rider/partner-agreement";

describe("OrderKing Partner Agreement (Code on Social Security, 2020)", () => {
  it("contains exactly 13 official sections structured per Indian gig worker legal standards", () => {
    expect(ORDERKING_PARTNER_AGREEMENT_SECTIONS).toHaveLength(13);

    const sectionTitles = ORDERKING_PARTNER_AGREEMENT_SECTIONS.map((s) => s.title);
    expect(sectionTitles).toContain("Definitions and Statutory Interpretations");
    expect(sectionTitles).toContain("Independent Contractor Status & Absolute Work Autonomy");
    expect(sectionTitles).toContain("Scope of Delivery Services & Professional SOP Standards");
    expect(sectionTitles).toContain("Partner Eligibility, Vehicle Regulations & Statutory KYC");
    expect(sectionTitles).toContain("Consideration, Payout Computation, Settlements & Tax Compliance");
    expect(sectionTitles).toContain("Statutory Gig Worker Welfare & Social Security Fund Contributions");
    expect(sectionTitles).toContain("Group Accidental Insurance, Healthcare & Roadside SOS Protection");
    expect(sectionTitles).toContain("Delivery Partner Code of Conduct, Road Safety & Zero-Tolerance SOP");
    expect(sectionTitles).toContain("Confidentiality, Telemetry Telematics & Data Protection");
    expect(sectionTitles).toContain("Term, Voluntary Disengagement & Fair Deactivation Procedure");
    expect(sectionTitles).toContain("Mutual Indemnification & Limitation of Platform Liability");
    expect(sectionTitles).toContain("Two-Tier Dispute Resolution, Grievance Redressal & Arbitration");
    expect(sectionTitles).toContain("Digital Execution, Severability & Electronic Assent");
  });

  it("brands exclusively as OrderKing Partner with zero mention of legacy competitor brands across all sections", () => {
    const FORBIDDEN_LEGACY_MARKET_LEADER = ["z", "o", "m", "a", "t", "o"].join("");
    ORDERKING_PARTNER_AGREEMENT_SECTIONS.forEach((sec) => {
      expect(sec.fullLegalText.toLowerCase()).not.toContain(FORBIDDEN_LEGACY_MARKET_LEADER);
      expect(sec.summary.toLowerCase()).not.toContain(FORBIDDEN_LEGACY_MARKET_LEADER);
      sec.keyHighlights.forEach((hl) => {
        expect(hl.toLowerCase()).not.toContain(FORBIDDEN_LEGACY_MARKET_LEADER);
      });
    });

    const markdown = getFullAgreementLegalMarkdown({
      partnerName: "Rajesh Kumar",
      phone: "9876543210",
      pan: "ABCDE1234F",
      aadhaarLast4: "4821",
    });
    expect(markdown.toLowerCase()).not.toContain(FORBIDDEN_LEGACY_MARKET_LEADER);
    expect(markdown).toContain("Orderkingpay");
    expect(markdown).toContain("Code on Social Security, 2020");
    expect(markdown).toContain("INR 10,00,000");
  });

  it("verifies statutory welfare and insurance parameters", () => {
    expect(ORDERKING_PARTNER_AGREEMENT_METADATA.complianceFramework).toBe(
      "Code on Social Security, 2020 (Act 36 of 2020)"
    );
    expect(ORDERKING_PARTNER_AGREEMENT_METADATA.welfareFundRate).toContain("1.5%");
    expect(ORDERKING_PARTNER_AGREEMENT_METADATA.accidentalDeathCover).toContain("10,00,000");
    expect(ORDERKING_PARTNER_AGREEMENT_METADATA.hospitalizationCover).toContain("1,00,000");
    expect(ORDERKING_PARTNER_AGREEMENT_METADATA.minimumFloorPayout).toContain("35");
  });
});
