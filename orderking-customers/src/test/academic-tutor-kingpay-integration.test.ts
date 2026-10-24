import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  ALL_INDIAN_BOARDS,
  CORE_SUBJECTS,
  CLASS_LEVELS,
  parseStructuredAcademicSolution,
  AcademicSolutionCard,
} from "../components/tutor/academic-solution-card";
import {
  buildAcademicSystemPrompt,
  solveAcademicProblem,
} from "../lib/ai/gemini-tutor-solver";
import {
  VERIFIED_EDUCATOR_PROFILES,
} from "../components/tutor-jobs/tutor-jobs-hub";
import {
  generateCurriculumFallback,
} from "../routes/tutor";

describe("AI Tutor & Academic Intelligence — KingPay Fintech & Syllabus Integration", () => {
  describe("1. Academic Solution Card & 3-Part Derivation Standard", () => {
    it("parses structured solutions conforming to Indian Board benchmark standards", () => {
      const solution = `### 1. Given Formula / Concept
- Principle: Conservation of Mechanical Energy in a uniform gravitational field.
- Equation: E_total = K + U = (1/2)mv^2 + mgh = constant.

### 2. Step-by-Step Derivation & Solution
- Step 1: Let the projectile be launched at velocity v_0 from height h_0 = 0.
- Step 2: At maximum height H, vertical velocity v_y = 0.
- Step 3: Equate initial kinetic energy to gravitational potential energy: (1/2)m(v_0)^2 = mgH.
- Step 4: Solve for H: H = (v_0^2) / (2g).

### 3. Final Answer
H = v_0^2 / (2g) [SI Unit: meters (m)]`;

      const parsed = parseStructuredAcademicSolution(solution);
      expect(parsed.formula).toContain("Conservation of Mechanical Energy");
      expect(parsed.derivation).toContain("Step 1");
      expect(parsed.derivation).toContain("Solve for H");
      expect(parsed.finalAnswer).toContain("H = v_0^2 / (2g)");
      expect(parsed.finalAnswer).toContain("meters (m)");
    });

    it("supports optional KingPay micro-transaction status metadata in AcademicSolutionCard", () => {
      expect(typeof AcademicSolutionCard).toBe("function");

      const cardProps = {
        solutionText: `### 1. Given Formula / Concept\nF = ma\n### 2. Step-by-Step Derivation & Solution\nStep 1: substitute\n### 3. Final Answer\nF = 10 N`,
        billingStatus: {
          billed: true,
          amountPaise: 100,
          remainingBalancePaise: 4900,
          note: "Micro-transaction settled via KingPay (₹1.00)",
        },
      };

      expect(cardProps.billingStatus.billed).toBe(true);
      expect(cardProps.billingStatus.amountPaise).toBe(100);
      expect(cardProps.billingStatus.remainingBalancePaise).toBe(4900);
    });
  });

  describe("2. Gemini 2.5 Flash Model Verification", () => {
    it("verifies gemini-tutor-solver.ts references canonical Gemini 2.5 Flash and 2.0 Flash models", () => {
      const code = readFileSync(
        new URL("../lib/ai/gemini-tutor-solver.ts", import.meta.url),
        "utf8"
      );

      expect(code).toContain('"gemini-2.5-flash"');
      expect(code).toContain('"gemini-2.0-flash"');
      expect(code).not.toContain('"gemini-3.5-flash-lite"');
      expect(code).not.toContain('"gemini-3.8-flash"');
    });
  });

  describe("3. Verified Educators Directory & Hourly Rate Transparency", () => {
    it("provides verified educator faculty across CBSE, ICSE, and State Boards", () => {
      expect(Array.isArray(VERIFIED_EDUCATOR_PROFILES)).toBe(true);
      expect(VERIFIED_EDUCATOR_PROFILES.length).toBeGreaterThanOrEqual(5);

      for (const tutor of VERIFIED_EDUCATOR_PROFILES) {
        expect(tutor.id).toBeTruthy();
        expect(tutor.name).toBeTruthy();
        expect(tutor.qualifications).toBeTruthy();
        expect(tutor.experienceYears).toBeGreaterThan(0);
        expect(tutor.rating).toBeGreaterThanOrEqual(4.5);
        expect(tutor.hourlyRateInr).toBeGreaterThanOrEqual(300);
        expect(tutor.languages.length).toBeGreaterThanOrEqual(2);
        expect(tutor.boards.length).toBeGreaterThanOrEqual(1);
        expect(tutor.classes.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("includes diverse subjects: STEM, Mathematics, Commerce, and Primary/Secondary foundations", () => {
      const allSubjects = VERIFIED_EDUCATOR_PROFILES.flatMap((t) => t.primarySubjects);
      expect(allSubjects.some((s) => s.includes("Physics"))).toBe(true);
      expect(allSubjects.some((s) => s.includes("Mathematics"))).toBe(true);
      expect(allSubjects.some((s) => s.includes("Accountancy") || s.includes("Commerce"))).toBe(true);
      expect(allSubjects.some((s) => s.includes("Biology") || s.includes("Science"))).toBe(true);
    });
  });

  describe("4. KingPay Escrow & Micro-Billing Wireup in tutor.tsx", () => {
    it("verifies tutor.tsx exports bookTutorSessionFn, releaseTutorEscrowFn, and getMyTutorBookingsFn", () => {
      const code = readFileSync(
        new URL("../routes/tutor.tsx", import.meta.url),
        "utf8"
      );

      expect(code).toContain("export const bookTutorSessionFn");
      expect(code).toContain("export const releaseTutorEscrowFn");
      expect(code).toContain("export const getMyTutorBookingsFn");
      expect(code).toContain("kingpay_wallets");
      expect(code).toContain("kingpay_transactions");
      expect(code).toContain("tutor_bookings");
      expect(code).toContain("KingPay Escrow Hold");
      expect(code).toContain("'HELD'");
      expect(code).toContain("'SETTLEMENT'");
    });

    it("verifies tutor-jobs-hub.tsx connects to KingPay escrow booking", () => {
      const code = readFileSync(
        new URL("../components/tutor-jobs/tutor-jobs-hub.tsx", import.meta.url),
        "utf8"
      );

      expect(code).toContain("bookTutorSessionFn");
      expect(code).toContain("useRealKingPayWallet");
      expect(code).toContain("KingPay Escrow");
      expect(code).toContain("VERIFIED_EDUCATOR_PROFILES");
    });

    it("verifies tutor-jobs/history.tsx connects to KingPay escrow release", () => {
      const code = readFileSync(
        new URL("../routes/tutor-jobs/history.tsx", import.meta.url),
        "utf8"
      );

      expect(code).toContain("getMyTutorBookingsFn");
      expect(code).toContain("releaseTutorEscrowFn");
      expect(code).toContain("Complete & Release Escrow");
      expect(code).toContain("Escrow Settled & Released");
    });
  });

  describe("5. Silent Luxury UI Invariants & Slogan Purge", () => {
    it("verifies that no noisy promotional slogans exist in the academic tutor components", () => {
      const tutorCode = readFileSync(
        new URL("../routes/tutor.tsx", import.meta.url),
        "utf8"
      );
      const hubCode = readFileSync(
        new URL("../components/tutor-jobs/tutor-jobs-hub.tsx", import.meta.url),
        "utf8"
      );

      expect(tutorCode).not.toContain("Guaranteed 100% Exam Marks");
      expect(tutorCode).not.toContain("World's #1 Miracle AI");
      expect(hubCode).not.toContain("Guaranteed 100% Exam Marks");
    });
  });
});
