import { describe, it, expect, beforeEach } from "vitest";
import { AITutor, AcademicRateLimiter, parseAcademicSolution } from "./ai-tutor";
import { CurriculumManager } from "./curriculum-manager";

describe("Umar OS AI Tutor & Academic Specialist Certification Suite", () => {
  let curriculumManager: CurriculumManager;
  let aiTutor: AITutor;
  const testStudentId = "test-student-101";

  beforeEach(() => {
    curriculumManager = new CurriculumManager();
    aiTutor = new AITutor(curriculumManager);
    aiTutor.registerStudent(testStudentId, "CBSE", 10);
  });

  describe("1. Rate Limiting Certification", () => {
    it("allows up to 20 requests per minute and blocks the 21st request", () => {
      const limiter = new AcademicRateLimiter(60_000, 20);
      const studentId = "student-rate-limit-check";

      // First 20 queries must be allowed
      for (let i = 0; i < 20; i++) {
        const check = limiter.isAllowed(studentId);
        expect(check.allowed).toBe(true);
        expect(check.remaining).toBe(20 - (i + 1));
      }

      // 21st query must be blocked
      const blockedCheck = limiter.isAllowed(studentId);
      expect(blockedCheck.allowed).toBe(false);
      expect(blockedCheck.remaining).toBe(0);
      expect(blockedCheck.resetMs).toBeGreaterThan(0);
    });

    it("enforces rate limit inside AITutor.resolveAcademicDoubtWithGemini", async () => {
      const restrictiveLimiter = new AcademicRateLimiter(60_000, 2);
      const tutor = new AITutor(curriculumManager, restrictiveLimiter);
      const sId = "student-api-spam-test";
      tutor.registerStudent(sId, "CBSE", 10);

      // Query 1
      await expect(
        tutor.resolveAcademicDoubtWithGemini(sId, "Solve quadratic equation")
      ).resolves.toBeDefined();

      // Query 2
      await expect(
        tutor.resolveAcademicDoubtWithGemini(sId, "Derive irrationality of sqrt(2)")
      ).resolves.toBeDefined();

      // Query 3 should be rate-limited and throw
      await expect(
        tutor.resolveAcademicDoubtWithGemini(sId, "Find zeroes of polynomial")
      ).rejects.toThrow(/Academic rate limit reached/i);
    });
  });

  describe("2. NCERT / CBSE Curriculum Alignment & Zero Hallucination Standard", () => {
    it("derives the Quadratic Formula with completing the square according to NCERT Class 10 Chapter 4", async () => {
      const solution = await aiTutor.resolveAcademicDoubtWithGemini(
        testStudentId,
        "Derive quadratic formula using completing square method"
      );

      expect(solution.formula).toBeTruthy();
      expect(solution.formula).toContain("ax^2 + bx + c = 0");
      expect(solution.formula).toContain("b^2 - 4ac");

      expect(solution.derivation).toBeTruthy();
      expect(solution.derivation).toContain("Divide by leading coefficient");
      expect(solution.derivation).toContain("Complete the square");

      expect(solution.finalAnswer).toBeTruthy();
      expect(solution.finalAnswer).toContain("x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}");
    });

    it("proves irrationality of sqrt(2) according to NCERT Class 10 Chapter 1", async () => {
      const solution = await aiTutor.resolveAcademicDoubtWithGemini(
        testStudentId,
        "Prove that square root of 2 is irrational"
      );

      expect(solution.formula).toContain("Fundamental Theorem of Arithmetic");
      expect(solution.derivation).toContain("Proof by Contradiction Assumption");
      expect(solution.derivation).toContain("co-prime");
      expect(solution.finalAnswer).toContain("\\sqrt{2} \\text{ is strictly irrational.}");
    });

    it("evaluates Polynomial Zeroes and coefficient relationships according to NCERT Class 10 Chapter 2", async () => {
      const solution = await aiTutor.resolveAcademicDoubtWithGemini(
        testStudentId,
        "Relationship between zeroes and coefficients of quadratic polynomial"
      );

      expect(solution.formula).toContain("\\alpha + \\beta = -\\frac{b}{a}");
      expect(solution.formula).toContain("\\alpha \\beta = \\frac{c}{a}");
      expect(solution.derivation).toContain("Equate coefficients");
      expect(solution.finalAnswer).toContain("\\alpha + \\beta = -\\frac{b}{a}");
    });
  });

  describe("3. 3-Part Pedagogical Standard Parser", () => {
    it("parses valid 3-part markdown responses into formula, derivation, and finalAnswer", () => {
      const sampleText = `### 1. Given Formula / Concept
- Principle: Ohm's Law V = I * R.

### 2. Step-by-Step Derivation & Solution
- Step 1: Resistance R = V / I.
- Step 2: For V = 12V and I = 2A, R = 12 / 2 = 6 Ohms.

### 3. Final Answer
**R = 6 \\(\\Omega\\)**`;

      const parsed = parseAcademicSolution(sampleText);
      expect(parsed.formula).toContain("V = I * R");
      expect(parsed.derivation).toContain("R = 12 / 2 = 6 Ohms");
      expect(parsed.finalAnswer).toContain("R = 6");
    });
  });
});
