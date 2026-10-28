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

    it("withstands concurrent flood of 100 requests, strictly allowing exactly 20 and blocking 80", async () => {
      const limiter = new AcademicRateLimiter(60_000, 20);
      const studentId = "flood-victim-101";

      const results = await Promise.all(
        Array.from({ length: 100 }, async (_, idx) => {
          // slight async microtask offset
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
          return limiter.isAllowed(studentId);
        })
      );

      const allowed = results.filter((r) => r.allowed);
      const blocked = results.filter((r) => !r.allowed);

      expect(allowed.length).toBe(20);
      expect(blocked.length).toBe(80);

      // Verify all blocked requests have 0 remaining and valid reset time
      for (const b of blocked) {
        expect(b.remaining).toBe(0);
        expect(b.resetMs).toBeGreaterThan(0);
        expect(b.resetMs).toBeLessThanOrEqual(60_000);
      }
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

    it("derives Newton's three equations of motion according to NCERT Class 9 & Class 11 Physics", async () => {
      const solution = await aiTutor.resolveAcademicDoubtWithGemini(
        testStudentId,
        "Derive kinematics three equations of motion v = u + at"
      );

      expect(solution.formula).toContain("v = u + at");
      expect(solution.formula).toContain("s = ut + \\frac{1}{2}at^2");
      expect(solution.formula).toContain("v^2 = u^2 + 2as");
      expect(solution.derivation).toContain("First Equation");
      expect(solution.derivation).toContain("Second Equation");
      expect(solution.derivation).toContain("Third Equation");
      expect(solution.finalAnswer).toContain("v = u + at");
    });

    it("derives Bernoulli's equation from work-energy theorem according to NCERT Class 11 Physics Chapter 10", async () => {
      const solution = await aiTutor.resolveAcademicDoubtWithGemini(
        testStudentId,
        "Derive Bernoulli's equation for streamline fluid flow"
      );

      expect(solution.formula).toContain("P + \\frac{1}{2} \\rho v^2 + \\rho g h = \\text{Constant}");
      expect(solution.derivation).toContain("Work Done by Pressure Forces");
      expect(solution.derivation).toContain("Work-Energy Equivalence");
      expect(solution.finalAnswer).toContain("Bernoulli Invariant");
    });

    it("derives microscopic Ohm's law and resistivity according to NCERT Class 10 & 12 Physics", async () => {
      const solution = await aiTutor.resolveAcademicDoubtWithGemini(
        testStudentId,
        "Explain Ohm's law and derive relation R = rho L / A with drift velocity"
      );

      expect(solution.formula).toContain("V = I \\cdot R");
      expect(solution.formula).toContain("R = \\rho \\frac{L}{A}");
      expect(solution.derivation).toContain("Electron Drift Velocity");
      expect(solution.derivation).toContain("relaxation time");
      expect(solution.finalAnswer).toContain("\\rho = \\frac{m}{n e^2 \\tau}");
    });

    it("derives thin lens equation according to NCERT Class 10 & 12 Optics", async () => {
      const solution = await aiTutor.resolveAcademicDoubtWithGemini(
        testStudentId,
        "Derive thin lens formula and Snell's law"
      );

      expect(solution.formula).toContain("\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}");
      expect(solution.formula).toContain("n_1 \\sin(i) = n_2 \\sin(r)");
      expect(solution.derivation).toContain("Similar Triangles");
      expect(solution.finalAnswer).toContain("\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}");
    });

    it("evaluates calculus integral of sin^2(x) using power-reduction according to NCERT Class 12 Chapter 7", async () => {
      const solution = await aiTutor.resolveAcademicDoubtWithGemini(
        testStudentId,
        "Evaluate indefinite integration of sin^2(x) dx"
      );

      expect(solution.formula).toContain("\\cos(2x) = 1 - 2\\sin^2(x)");
      expect(solution.derivation).toContain("Decompose into linear integral terms");
      expect(solution.finalAnswer).toContain("\\frac{x}{2} - \\frac{\\sin(2x)}{4} + C");
    });

    it("derives chemical kinetics first-order rate law and half-life according to NCERT Class 12 Chapter 4", async () => {
      const solution = await aiTutor.resolveAcademicDoubtWithGemini(
        testStudentId,
        "Derive integrated rate law for first order reaction and half-life Arrhenius",
        "Chemistry"
      );

      expect(solution.formula).toContain("-\\frac{d[A]}{dt} = k [A]");
      expect(solution.formula).toContain("k = \\frac{2.303}{t} \\log_{10}");
      expect(solution.derivation).toContain("Definite Integration");
      expect(solution.derivation).toContain("Half-Life Determination");
      expect(solution.finalAnswer).toContain("t_{1/2} = \\frac{0.693}{k}");
    });

    it("derives chemical equilibrium Kp = Kc(RT)^delta n according to NCERT Class 11 Chapter 7", async () => {
      const solution = await aiTutor.resolveAcademicDoubtWithGemini(
        testStudentId,
        "Derive relationship between Kp and Kc and state Le Chatelier principle",
        "Chemistry"
      );

      expect(solution.formula).toContain("K_p = K_c (RT)^{\\Delta n_g}");
      expect(solution.derivation).toContain("Gas Law Partial Pressures");
      expect(solution.finalAnswer).toContain("K_p = K_c (RT)^{\\Delta n_g}");
    });

    it("derives electrochemistry Nernst equation according to NCERT Class 12 Chapter 3", async () => {
      const solution = await aiTutor.resolveAcademicDoubtWithGemini(
        testStudentId,
        "Derive Nernst equation for galvanic cell potential at 298 K",
        "Chemistry"
      );

      expect(solution.formula).toContain("E_{\\text{cell}} = E^\\circ_{\\text{cell}} - \\frac{2.303 RT}{nF}");
      expect(solution.formula).toContain("\\frac{0.0591}{n} \\log_{10} Q");
      expect(solution.derivation).toContain("Thermodynamic Relation");
      expect(solution.derivation).toContain("Electrical Work Equivalence");
      expect(solution.finalAnswer).toContain("\\Delta G^\\circ = -nFE^\\circ_{\\text{cell}}");
    });
  });

  describe("3. Closed-Loop KingPay Micropayment Integration", () => {
    it("deducts ₹1.00 (100 paise) micropayment from KingPay wallet balance", async () => {
      const studentId = "kingpay-paying-student";
      aiTutor.registerStudent(studentId, "CBSE", 12);

      const solution = await aiTutor.resolveAcademicDoubtWithGemini(
        studentId,
        "Derive Nernst equation",
        "Chemistry",
        {
          enableKingPayBilling: true,
          walletBalancePaise: 5000, // ₹50.00
          microFeePaise: 100,       // ₹1.00
        }
      );

      expect(solution.billingStatus).toBeDefined();
      expect(solution.billingStatus?.billed).toBe(true);
      expect(solution.billingStatus?.amountPaise).toBe(100);
      expect(solution.billingStatus?.remainingBalancePaise).toBe(4900);
      expect(solution.billingStatus?.note).toContain("Micro-transaction settled via KingPay (₹1.00)");
    });

    it("falls back to complimentary session when student has zero or insufficient KingPay balance", async () => {
      const studentId = "kingpay-complimentary-student";
      aiTutor.registerStudent(studentId, "CBSE", 10);

      const solution = await aiTutor.resolveAcademicDoubtWithGemini(
        studentId,
        "Derive quadratic formula",
        "Mathematics",
        {
          enableKingPayBilling: true,
          walletBalancePaise: 50, // Insufficient (less than ₹1.00)
          microFeePaise: 100,
        }
      );

      expect(solution.billingStatus).toBeDefined();
      expect(solution.billingStatus?.billed).toBe(false);
      expect(solution.billingStatus?.amountPaise).toBe(0);
      expect(solution.billingStatus?.remainingBalancePaise).toBe(50);
      expect(solution.billingStatus?.note).toContain("Complimentary Tier");
    });
  });

  describe("4. 3-Part Pedagogical Standard Parser & LaTeX String Integrity", () => {
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

    it("verifies LaTeX syntax delimiter balance and absence of unescaped control chars across all generated solutions", () => {
      const testQueries = [
        "quadratic equation completing square",
        "irrationality of sqrt(2)",
        "zeroes of polynomial",
        "kinematics equations of motion",
        "bernoulli streamline fluid flow",
        "ohm's law drift velocity resistance",
        "snell lens formula refraction",
        "integration of sin^2(x)",
        "chemical kinetics rate law arrhenius",
        "chemical equilibrium Kp = Kc Le Chatelier",
        "electrochemistry nernst equation cell potential",
      ];

      for (const query of testQueries) {
        const solution = aiTutor.generateDeterministicNCERTSolution(query, "CBSE", 12);
        
        // 1. Must contain all 3 sections
        expect(solution).toContain("### 1. Given Formula / Concept");
        expect(solution).toContain("### 2. Step-by-Step Derivation & Solution");
        expect(solution).toContain("### 3. Final Answer");

        // 2. Check balanced inline math \( and \)
        const openParen = (solution.match(/\\\(/g) || []).length;
        const closeParen = (solution.match(/\\\)/g) || []).length;
        expect(openParen).toBe(closeParen);

        // 3. Check balanced display math \[ and \]
        const openBracket = (solution.match(/\\\[/g) || []).length;
        const closeBracket = (solution.match(/\\\]/g) || []).length;
        expect(openBracket).toBe(closeBracket);

        // 4. Ensure no corrupted backspace (\x08) or form-feed (\x0c) control characters
        expect(solution).not.toContain("\x08");
        expect(solution).not.toContain("\x0c");
      }
    });
  });
});
