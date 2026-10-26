import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { 
  ALL_INDIAN_BOARDS, 
  CORE_SUBJECTS, 
  CLASS_LEVELS, 
  parseStructuredAcademicSolution 
} from "../routes/tutor";

describe("Academic Tutor — All-India Central & 28 State Boards Reality Suite", () => {
  describe("1. Board, Subject, and Class Invariants", () => {
    it("includes CBSE, ICSE, and all specified State Boards (Assam SEBA/AHSEC, UP, Bihar, Maharashtra, West Bengal, etc.)", () => {
      const boards = ALL_INDIAN_BOARDS as readonly string[];

      // Central Boards
      expect(boards.some((b) => b.includes("CBSE"))).toBe(true);
      expect(boards.some((b) => b.includes("ICSE"))).toBe(true);
      expect(boards.some((b) => b.includes("NIOS"))).toBe(true);

      // Specifically highlighted State Boards
      expect(boards.some((b) => b.includes("SEBA"))).toBe(true);
      expect(boards.some((b) => b.includes("AHSEC"))).toBe(true);
      expect(boards.some((b) => b.includes("UP Board"))).toBe(true);
      expect(boards.some((b) => b.includes("Bihar Board"))).toBe(true);
      expect(boards.some((b) => b.includes("Maharashtra State Board"))).toBe(true);
      expect(boards.some((b) => b.includes("West Bengal"))).toBe(true);

      // Other 28 state boards check
      expect(boards.some((b) => b.includes("Tamil Nadu"))).toBe(true);
      expect(boards.some((b) => b.includes("Karnataka"))).toBe(true);
      expect(boards.some((b) => b.includes("Kerala"))).toBe(true);
      expect(boards.some((b) => b.includes("Gujarat"))).toBe(true);
      expect(boards.some((b) => b.includes("Rajasthan"))).toBe(true);
      expect(boards.some((b) => b.includes("Punjab"))).toBe(true);
      expect(boards.some((b) => b.includes("Telangana"))).toBe(true);
      expect(boards.some((b) => b.includes("Andhra Pradesh"))).toBe(true);
      expect(boards.some((b) => b.includes("Odisha"))).toBe(true);
      expect(boards.some((b) => b.includes("Assam"))).toBe(true);

      expect(boards.length).toBeGreaterThanOrEqual(30);
    });

    it("strictly includes the 9 core subjects", () => {
      const expectedSubjects = [
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "Accountancy",
        "Economics",
        "Business Studies",
        "Political Science",
        "History",
      ];

      for (const subj of expectedSubjects) {
        expect(CORE_SUBJECTS).toContain(subj);
      }
    });

    it("strictly includes the 5 class levels from Class 9 to Degree STEM", () => {
      const expectedClasses = [
        "Class 9",
        "Class 10",
        "Class 11",
        "Class 12",
        "Degree STEM",
      ];

      for (const lvl of expectedClasses) {
        expect(CLASS_LEVELS).toContain(lvl);
      }
    });
  });

  describe("2. Clean Structured Derivation Parser", () => {
    it("extracts Given Formula / Concept, Step-by-Step Derivation & Solution, and Final Answer from structured output", () => {
      const sampleOutput = `### 1. Given Formula / Concept
- Governing Equation: standard polynomial P(x) = ax^2 + bx + c
- Quadratic root formulation: x = (-b +- sqrt(b^2 - 4ac)) / (2a)

### 2. Step-by-Step Derivation & Solution
- Step 1: Divide both sides by leading coefficient a.
- Step 2: Complete the square by adding (b / 2a)^2.
- Step 3: Extract square roots on both sides.

### 3. Final Answer
x = [-b +- sqrt(b^2 - 4ac)] / (2a)`;

      const parsed = parseStructuredAcademicSolution(sampleOutput);

      expect(parsed.formula).toBeTruthy();
      expect(parsed.formula).toContain("Governing Equation");
      expect(parsed.derivation).toBeTruthy();
      expect(parsed.derivation).toContain("Step 1");
      expect(parsed.derivation).toContain("Complete the square");
      expect(parsed.finalAnswer).toBeTruthy();
      expect(parsed.finalAnswer).toContain("x = [-b +- sqrt(b^2 - 4ac)] / (2a)");
    });

    it("gracefully falls back when headings are markdown bold instead of hashes", () => {
      const boldOutput = `**Given Formula / Concept**
- Target Integral: I = integral sin^2(x) dx
- Trigonometric identity: cos(2x) = 1 - 2sin^2(x)

**Step-by-Step Derivation & Solution**
- Step 1: Substitute identity: I = integral (1 - cos(2x))/2 dx.
- Step 2: Integrate term by term: x/2 - sin(2x)/4 + C.

**Final Answer**
I = x/2 - sin(2x)/4 + C`;

      const parsed = parseStructuredAcademicSolution(boldOutput);

      expect(parsed.formula).toContain("Target Integral");
      expect(parsed.derivation).toContain("Integrate term by term");
      expect(parsed.finalAnswer).toContain("I = x/2 - sin(2x)/4 + C");
    });
  });

  describe("3. Slogan Purge & Strict Academic Tutor Labeling", () => {
    it("purges all marketing slogans and preachy banners from supreme-kingpay-experience.tsx", () => {
      const code = readFileSync(
        new URL("../components/fintech/supreme-kingpay-experience.tsx", import.meta.url),
        "utf8"
      );

      // Verify purged slogans
      expect(code).not.toContain("Live 24x7 Exam Marking Assistant");
      expect(code).not.toContain("Interactive AI Academic Derivation Console");
      expect(code).not.toContain("Zero Commission · Direct Student-Educator Connect");
      expect(code).not.toContain("Zero commission platform · Direct student sessions");

      // Verify strict "Academic Tutor" label
      expect(code).toContain("Academic Tutor");
      expect(code).toContain("ALL_INDIAN_BOARDS");
      expect(code).toContain("CORE_SUBJECTS");
      expect(code).toContain("CLASS_LEVELS");
      expect(code).toContain("AcademicSolutionCard");
    });

    it("verifies tutor.tsx contains strictly Academic Tutor branding and no ungrounded claims", () => {
      const code = readFileSync(
        new URL("../routes/tutor.tsx", import.meta.url),
        "utf8"
      );

      expect(code).not.toContain("LearnKing AI & Opportunities");
      expect(code).not.toContain("End-to-End Encrypted (AES-256)");
      expect(code).toContain("Academic Tutor");
      expect(code).toContain("ALL_INDIAN_BOARDS");
      expect(code).toContain("CORE_SUBJECTS");
      expect(code).toContain("CLASS_LEVELS");
      expect(code).toContain("Given Formula / Concept");
      expect(code).toContain("Step-by-Step Derivation & Solution");
      expect(code).toContain("Final Answer");
    });
  });
});
