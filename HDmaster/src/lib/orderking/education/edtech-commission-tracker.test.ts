import { describe, it, expect, beforeEach } from "vitest";
import {
  EdTechCommissionTracker,
  PLACEMENT_CAREER_COURSES,
  type EdTechCourse,
} from "./edtech-commission-tracker.ts";
import { canonicalLedger } from "../finance/canonical-ledger.ts";
import { AITutor } from "./ai-tutor.ts";
import { CurriculumManager } from "./curriculum-manager.ts";

describe("EdTech Placement Affiliate Commission & Zero-Hallucination Certification Suite", () => {
  let tracker: EdTechCommissionTracker;
  let tutor: AITutor;

  beforeEach(() => {
    tracker = new EdTechCommissionTracker();
    const cm = new CurriculumManager();
    tutor = new AITutor(cm);
  });

  describe("1. Statutory Course Catalog & Commission Bounds (₹2,500 – ₹7,500)", () => {
    it("registers all 4 authentic placement career cohorts adhering to statutory commission bounds", () => {
      const courses = tracker.getAllCourses();
      expect(courses.length).toBe(4);

      for (const course of courses) {
        expect(course.courseId).toBeTruthy();
        expect(course.title).toBeTruthy();
        expect(course.partnerInstitute).toBeTruthy();
        expect(course.affiliateTrackingId).toMatch(/^OK-AFF-[A-Z0-9]+-[A-Z0-9]+$/);
        expect(course.placementGuaranteeLabel).toBeTruthy();
        expect(course.minPlacementCtcPaise).toBeGreaterThanOrEqual(30_000_000); // At least ₹3.0 LPA CTC

        // Statutory Bound check: ₹2,500 (250,000 paise) to ₹7,500 (750,000 paise)
        expect(course.affiliateCommissionPaise).toBeGreaterThanOrEqual(250_000);
        expect(course.affiliateCommissionPaise).toBeLessThanOrEqual(750_000);
      }
    });

    it("verifies specific bounds for Full-Stack, FinOps, AI Accelerator, and Banking courses", () => {
      const fs = tracker.getCourse("ED-FS-101");
      expect(fs?.title).toContain("Full-Stack Cloud & FinTech");
      expect(fs?.affiliateCommissionPaise).toBe(550_000); // ₹5,500.00
      expect(fs?.affiliateTrackingId).toBe("OK-AFF-FS101-PLCMT");

      const da = tracker.getCourse("ED-DA-202");
      expect(da?.title).toContain("Applied Data Analytics & GST FinOps");
      expect(da?.affiliateCommissionPaise).toBe(325_000); // ₹3,250.00
      expect(da?.affiliateTrackingId).toBe("OK-AFF-DA202-FINOPS");

      const ai = tracker.getCourse("ED-AI-303");
      expect(ai?.title).toContain("Cloud Native AI & Systems Architecture");
      expect(ai?.affiliateCommissionPaise).toBe(750_000); // ₹7,500.00 (Upper Bound)
      expect(ai?.affiliateTrackingId).toBe("OK-AFF-AI303-EXEC");

      const fop = tracker.getCourse("ED-FOP-104");
      expect(fop?.title).toContain("FinTech Core Banking Operations");
      expect(fop?.affiliateCommissionPaise).toBe(250_000); // ₹2,500.00 (Lower Bound)
      expect(fop?.affiliateTrackingId).toBe("OK-AFF-FOP104-BANKING");
    });

    it("fails closed when attempting to register a course with commission outside ₹2,500 to ₹7,500", () => {
      // Below lower bound
      expect(() => {
        tracker.registerCourse({
          courseId: "ED-LOW-001",
          title: "Low Commission Course",
          partnerInstitute: "Illegal Academy",
          placementGuaranteeLabel: "None",
          courseFeePaise: 1000000,
          affiliateCommissionPaise: 200_000, // ₹2,000 (Below ₹2,500)
          affiliateTrackingId: "OK-AFF-LOW001-TEST",
          minPlacementCtcPaise: 30000000,
          durationWeeks: 8,
          curriculumTrack: "FULL_STACK",
        });
      }).toThrow(/STATUTORY ERROR.*must be between ₹2,500.*and ₹7,500/i);

      // Above upper bound
      expect(() => {
        tracker.registerCourse({
          courseId: "ED-HIGH-999",
          title: "Excessive Commission Course",
          partnerInstitute: "Price Gouge Inst",
          placementGuaranteeLabel: "None",
          courseFeePaise: 8000000,
          affiliateCommissionPaise: 800_000, // ₹8,000 (Above ₹7,500)
          affiliateTrackingId: "OK-AFF-HIGH999-TEST",
          minPlacementCtcPaise: 30000000,
          durationWeeks: 8,
          curriculumTrack: "FULL_STACK",
        });
      }).toThrow(/STATUTORY ERROR.*must be between ₹2,500.*and ₹7,500/i);
    });
  });

  describe("2. Unique Affiliate Tracking ID & Attribution Engine", () => {
    it("generates student-specific affiliate tracking URLs containing courseId, affiliateTrackingId, studentId, and clickId", () => {
      const click = tracker.generateStudentAffiliateClick({
        courseId: "ED-FS-101",
        studentId: "student_karimganj_442",
        channel: "rewards_hub",
      });

      expect(click.clickId).toMatch(/^clk_[a-f0-9]{16}$/);
      expect(click.trackingId).toBe("OK-AFF-FS101-PLCMT");
      expect(click.trackingUrl).toContain("course=ED-FS-101");
      expect(click.trackingUrl).toContain("affid=OK-AFF-FS101-PLCMT");
      expect(click.trackingUrl).toContain("sid=student_karimganj_442");
      expect(click.trackingUrl).toContain("ch=rewards_hub");
      expect(click.trackingUrl).toContain(`clk=${click.clickId}`);
    });

    it("strictly validates official OrderKing affiliate convention OK-AFF-<COURSE>-<SLUG>", () => {
      expect(tracker.validateAffiliateTrackingId("OK-AFF-FS101-PLCMT")).toBe(true);
      expect(tracker.validateAffiliateTrackingId("OK-AFF-DA202-FINOPS")).toBe(true);
      expect(tracker.validateAffiliateTrackingId("OK-AFF-AI303-EXEC")).toBe(true);
      expect(tracker.validateAffiliateTrackingId("OK-AFF-FOP104-BANKING")).toBe(true);

      // Invalid tracking IDs
      expect(tracker.validateAffiliateTrackingId("AMAZON-21")).toBe(false);
      expect(tracker.validateAffiliateTrackingId("REF-12345")).toBe(false);
      expect(tracker.validateAffiliateTrackingId("")).toBe(false);
      expect(tracker.validateAffiliateTrackingId("OK-AFF-INVALID")).toBe(false);
    });
  });

  describe("3. Automated Platform Revenue Ledger Crediting & Double-Entry Balance", () => {
    it("confirms enrollment and credits ₹5,500 affiliate commission to platform revenue with balanced double-entry", async () => {
      const studentId = "student_silchar_881";
      const result = await tracker.confirmStudentEnrollment({
        courseId: "ED-FS-101",
        studentId,
        studentName: "Ananya Roy",
        paymentRef: "PAY-RAZOR-FS101-09871",
      });

      expect(result.enrollment.enrollmentId).toMatch(/^ENR-ED-FS-101-[A-F0-9]{8}$/);
      expect(result.enrollment.commissionAmountPaise).toBe(550_000); // ₹5,500.00
      expect(result.enrollment.retainedPlatformRevenuePaise).toBe(550_000);
      expect(result.enrollment.studentCashbackPaise).toBe(0);
      expect(result.enrollment.status).toBe("CONFIRMED");

      // Verify canonical double-entry ledger receipt
      expect(result.ledgerReceipt).toBeDefined();
      expect(result.ledgerReceipt.summary.doubleEntryVariancePaise).toBe(0);
      expect(result.ledgerReceipt.summary.commissionAmountPaise).toBe(550_000);
      expect(result.ledgerReceipt.summary.retainedPlatformRevenuePaise).toBe(550_000);
      expect(result.ledgerReceipt.summary.accountsCredited.platformFeeRevenue).toBe(550_000);
      expect(result.ledgerReceipt.summary.accountDebited.account).toBe("BANK_CLEARING");
      expect(result.ledgerReceipt.summary.accountDebited.amountPaise).toBe(550_000);

      // Verify audit persistence
      const audit = tracker.getEnrollmentAudit(result.enrollment.enrollmentId);
      expect(audit).toBeDefined();
      expect(audit?.studentName).toBe("Ananya Roy");
    });

    it("supports student career scholarship split: ₹7,500 gross commission with ₹1,000 student cashback", async () => {
      const studentId = "student_sribhumi_332";
      const result = await tracker.confirmStudentEnrollment({
        courseId: "ED-AI-303",
        studentId,
        studentName: "Farhan Ahmed",
        paymentRef: "UPI-ICICI-AI303-91823",
        studentCashbackPaise: 100_000, // ₹1,000 scholarship reward to KingPay wallet
      });

      expect(result.enrollment.commissionAmountPaise).toBe(750_000); // ₹7,500
      expect(result.enrollment.studentCashbackPaise).toBe(100_000); // ₹1,000
      expect(result.enrollment.retainedPlatformRevenuePaise).toBe(650_000); // ₹6,500 retained

      expect(result.ledgerReceipt.summary.doubleEntryVariancePaise).toBe(0);
      expect(result.ledgerReceipt.summary.accountsCredited.platformFeeRevenue).toBe(650_000);
      expect(result.ledgerReceipt.summary.accountsCredited.customerWallet).toBe(100_000);
      expect(result.ledgerReceipt.summary.accountDebited.amountPaise).toBe(750_000);
    });

    it("fails closed if student scholarship exceeds gross commission", async () => {
      await expect(
        tracker.confirmStudentEnrollment({
          courseId: "ED-FOP-104", // Commission is ₹2,500 (250,000 paise)
          studentId: "student_fraud_attempt",
          paymentRef: "PAY-TEST-999",
          studentCashbackPaise: 300_000, // ₹3,000 > ₹2,500
        })
      ).rejects.toThrow(/Invalid student cashback.*Must be between 0 and 250000 paise/i);
    });

    it("aggregates platform EdTech revenue metrics across multiple cohorts", async () => {
      // Enroll in ED-DA-202 (₹3,250 commission)
      await tracker.confirmStudentEnrollment({
        courseId: "ED-DA-202",
        studentId: "student_da_1",
        paymentRef: "PAY-DA-1",
      });

      // Enroll in ED-FOP-104 (₹2,500 commission)
      await tracker.confirmStudentEnrollment({
        courseId: "ED-FOP-104",
        studentId: "student_fop_1",
        paymentRef: "PAY-FOP-1",
      });

      const summary = tracker.listPlatformEdTechRevenueSummary();
      expect(summary.totalEnrollments).toBeGreaterThanOrEqual(2);
      expect(summary.totalGrossCommissionsPaise).toBeGreaterThanOrEqual(575_000); // 325,000 + 250,000
      expect(summary.totalRetainedRevenuePaise).toBeGreaterThanOrEqual(575_000);
      expect(summary.cohorts["ED-DA-202"]).toBeGreaterThanOrEqual(1);
      expect(summary.cohorts["ED-FOP-104"]).toBeGreaterThanOrEqual(1);
    });
  });

  describe("4. AI Academic Solver Zero-Hallucination Guardrails", () => {
    it("rigorously refutes perpetual motion and free energy claims with thermodynamics laws", () => {
      const solution = tutor.generateDeterministicNCERTSolution(
        "Build a perpetual motion machine of the second kind for free energy",
        "CBSE",
        11
      );

      expect(solution).toContain("### 1. Given Formula / Concept");
      expect(solution).toContain("First Law of Thermodynamics (Conservation of Energy)");
      expect(solution).toContain("Second Law of Thermodynamics");
      expect(solution).toContain("Carnot Maximum Efficiency Invariant");
      expect(solution).toContain("### 2. Step-by-Step Derivation & Solution");
      expect(solution).toContain("PMM of First Kind - PMM1");
      expect(solution).toContain("PMM of Second Kind - PMM2");
      expect(solution).toContain("Entropic Invariant");
      expect(solution).toContain("### 3. Final Answer");
      expect(solution).toContain("Perpetual Motion Machines (PMM1 and PMM2) are strictly physically impossible.");
    });

    it("rigorously refutes division by zero and '1 = 2' fallacies with real number field axioms", () => {
      const solution = tutor.generateDeterministicNCERTSolution(
        "Prove that 1 = 2 by division by zero",
        "CBSE",
        10
      );

      expect(solution).toContain("### 1. Given Formula / Concept");
      expect(solution).toContain("Field Axioms of Real Numbers");
      expect(solution).toContain("Multiplicative Inverse Existence");
      expect(solution).toContain("### 2. Step-by-Step Derivation & Solution");
      expect(solution).toContain("Definition of Division as Inverse Multiplication");
      expect(solution).toContain("Refutation of '1 = 2' Fallacies");
      expect(solution).toContain("### 3. Final Answer");
      expect(solution).toContain("\\frac{x}{0} \\text{ is strictly undefined for all } x \\in \\mathbb{R}.");
    });
  });
});
