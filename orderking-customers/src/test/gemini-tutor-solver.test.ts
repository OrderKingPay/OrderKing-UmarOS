import { describe, expect, it } from "vitest";
import {
  buildAcademicSystemPrompt,
  solveAcademicProblem,
  type AcademicSolveParams,
} from "../lib/server/gemini-tutor-solver";
import {
  buildAcademicSystemPrompt as buildAiPrompt,
  solveAcademicProblem as solveAiProblem,
} from "../lib/ai/gemini-tutor-solver";
import {
  generateCurriculumFallback,
  parseStructuredAcademicSolution,
  CLASS_LEVELS,
  CORE_SUBJECTS,
  ALL_INDIAN_BOARDS,
} from "../routes/tutor";

describe("Universal AI Tutor — Gemini 2.5 Flash & Curriculum Engine", () => {
  describe("1. Curriculum-Conditioned Prompt Builder", () => {
    it("conditions system prompt with CBSE & NCERT standards", () => {
      const prompt = buildAcademicSystemPrompt({
        message: "Derive quadratic formula",
        board: "CBSE (Central Board)",
        stdClass: "Class 10",
        subject: "Mathematics",
        language: "English",
        difficulty: "Standard Exam",
        tone: "Direct Academic Solution",
      });

      expect(prompt).toContain("CBSE (Central Board)");
      expect(prompt).toContain("Class 10");
      expect(prompt).toContain("Mathematics");
      expect(prompt).toContain("### 1. Given Formula / Concept");
      expect(prompt).toContain("### 2. Step-by-Step Derivation & Solution");
      expect(prompt).toContain("### 3. Final Answer");
      expect(prompt).toContain("NCERT / CBSE Standards");
    });

    it("conditions system prompt for Regional State Boards (Assam SEBA/AHSEC, Maharashtra, UP, etc.)", () => {
      const prompt = buildAcademicSystemPrompt({
        message: "Explain Ohm's Law in Assamese / Bengali",
        board: "SEBA (Assam Class 10)",
        stdClass: "Class 10",
        subject: "Physics",
        language: "Bengali",
      });

      expect(prompt).toContain("SEBA (Assam Class 10)");
      expect(prompt).toContain("Bengali");
      expect(prompt).toContain("State Boards");
    });

    it("conditions prompt for Competitive Entrance Exams (NEET UG & JEE Main/Advanced)", () => {
      const neetPrompt = buildAcademicSystemPrompt({
        message: "Explain DNA replication semi-conservative mechanism",
        board: "CBSE (Central Board)",
        stdClass: "NEET UG (Medical Entrance)",
        subject: "Biology",
      });
      expect(neetPrompt).toContain("NEET UG (Medical Entrance)");
      expect(neetPrompt).toContain("NEET");

      const jeePrompt = buildAcademicSystemPrompt({
        message: "Calculate electric field of uniformly charged ring on axis",
        board: "CBSE (Central Board)",
        stdClass: "JEE Main & Advanced (Engineering)",
        subject: "Physics",
      });
      expect(jeePrompt).toContain("JEE Main & Advanced (Engineering)");
      expect(jeePrompt).toContain("JEE Main / Advanced");
    });

    it("supports Classes 1 through 12 and Primary Foundations", () => {
      const primaryPrompt = buildAcademicSystemPrompt({
        message: "How to calculate area and perimeter of rectangle",
        board: "CBSE (Central Board)",
        stdClass: "Class 5",
        subject: "Mathematics",
      });
      expect(primaryPrompt).toContain("Class 5");
      expect(primaryPrompt).toContain("Primary (Classes 1-5)");
    });

    it("supports Degree STEM curriculum scope", () => {
      const stemPrompt = buildAcademicSystemPrompt({
        message: "Solve Navier-Stokes boundary layer or Green's theorem",
        board: "Degree STEM",
        stdClass: "Degree STEM",
        subject: "Mathematics",
      });
      expect(stemPrompt).toContain("Degree STEM");
      expect(stemPrompt).toContain("Multivariable calculus");
    });

    it("supports multilingual instruction and step marking rules across Indian languages", () => {
      const tamilPrompt = buildAcademicSystemPrompt({
        message: "Explain Carnot engine efficiency in Tamil",
        board: "Tamil Nadu State Board (TNDGE)",
        stdClass: "Class 12",
        subject: "Physics",
        language: "Tamil",
      });
      expect(tamilPrompt).toContain("Tamil");
      expect(tamilPrompt).toContain("MULTILINGUAL DERIVATION & STEP MARKING RULES");
      expect(tamilPrompt).toContain("Step-by-Step Derivation & Solution");
    });

    it("exports canonical solver functions identically from src/lib/ai/gemini-tutor-solver", () => {
      expect(typeof buildAiPrompt).toBe("function");
      expect(typeof solveAiProblem).toBe("function");

      const promptServer = buildAcademicSystemPrompt({
        message: "Explain Doppler effect",
        board: "CBSE (Central Board)",
        stdClass: "Class 11",
        subject: "Physics",
      });
      const promptAi = buildAiPrompt({
        message: "Explain Doppler effect",
        board: "CBSE (Central Board)",
        stdClass: "Class 11",
        subject: "Physics",
      });
      expect(promptAi).toBe(promptServer);
    });
  });

  describe("2. Deterministic Indian Curriculum Fallback Engine", () => {
    it("generates 3-part structured derivation for Mathematics (Quadratic Formula)", () => {
      const res = generateCurriculumFallback({
        message: "Derive quadratic formula by completing the square",
        board: "CBSE (Central Board)",
        stdClass: "Class 10",
        subject: "Mathematics",
      });

      const parsed = parseStructuredAcademicSolution(res);
      expect(parsed.formula).toBeTruthy();
      expect(parsed.formula).toContain("Standard Form");
      expect(parsed.derivation).toBeTruthy();
      expect(parsed.derivation).toContain("Complete the square");
      expect(parsed.finalAnswer).toBeTruthy();
      expect(parsed.finalAnswer).toContain("Root Solutions");
    });

    it("generates 3-part structured derivation for Physics (Bernoulli & Newton)", () => {
      const bernoulli = generateCurriculumFallback({
        message: "State and derive Bernoulli's principle equation",
        board: "CBSE (Central Board)",
        stdClass: "Class 11",
        subject: "Physics",
      });
      const parsedBernoulli = parseStructuredAcademicSolution(bernoulli);
      expect(parsedBernoulli.formula).toContain("Bernoulli's Principle");
      expect(parsedBernoulli.derivation).toContain("Work-Energy Theorem");
      expect(parsedBernoulli.finalAnswer).toContain("Bernoulli Invariant");

      const newton = generateCurriculumFallback({
        message: "Derive three equations of motion v = u + at",
        board: "ICSE / ISC (CISCE)",
        stdClass: "Class 9",
        subject: "Physics",
      });
      const parsedNewton = parseStructuredAcademicSolution(newton);
      expect(parsedNewton.formula).toContain("Newton's Second Law");
      expect(parsedNewton.derivation).toContain("First Equation");
      expect(parsedNewton.finalAnswer).toContain("v = u + at");
    });

    it("generates 3-part structured derivation for Chemistry (Chemical Kinetics & Equilibrium)", () => {
      const kinetics = generateCurriculumFallback({
        message: "Derive integrated rate law for first order reaction and half life Arrhenius",
        board: "CBSE (Central Board)",
        stdClass: "Class 12",
        subject: "Chemistry",
      });
      const parsedKinetics = parseStructuredAcademicSolution(kinetics);
      expect(parsedKinetics.formula).toContain("First-Order Rate Law");
      expect(parsedKinetics.derivation).toContain("Separate Variables");
      expect(parsedKinetics.finalAnswer).toContain("t_{1/2}");

      const eq = generateCurriculumFallback({
        message: "Explain Le Chatelier's principle and Kp = Kc(RT)^delta n",
        board: "UP Board (UPMSP)",
        stdClass: "Class 11",
        subject: "Chemistry",
      });
      const parsedEq = parseStructuredAcademicSolution(eq);
      expect(parsedEq.formula).toContain("Le Chatelier's Principle");
      expect(parsedEq.derivation).toContain("Ideal Gas Law");
      expect(parsedEq.finalAnswer).toContain("K_p = K_c");
    });

    it("generates 3-part structured derivation for Biology (Mendel & Photosynthesis)", () => {
      const mendel = generateCurriculumFallback({
        message: "Explain Mendel's law of segregation and monohybrid cross ratio",
        board: "CBSE (Central Board)",
        stdClass: "Class 10",
        subject: "Biology",
      });
      const parsedMendel = parseStructuredAcademicSolution(mendel);
      expect(parsedMendel.formula).toContain("Mendel's Laws");
      expect(parsedMendel.derivation).toContain("Punnett Square");
      expect(parsedMendel.finalAnswer).toContain("3 : 1");

      const photo = generateCurriculumFallback({
        message: "Explain photosynthesis light and dark reaction",
        board: "Maharashtra State Board (MSBSHSE)",
        stdClass: "Class 10",
        subject: "Biology",
      });
      const parsedPhoto = parseStructuredAcademicSolution(photo);
      expect(parsedPhoto.formula).toContain("Photosynthesis");
      expect(parsedPhoto.derivation).toContain("Calvin Cycle");
      expect(parsedPhoto.finalAnswer).toContain("Primary Byproduct");
    });

    it("generates 3-part structured derivation for Economics (National Income GDP & Law of Demand)", () => {
      const gdp = generateCurriculumFallback({
        message: "Calculate national income GDP using expenditure method",
        board: "CBSE (Central Board)",
        stdClass: "Class 12",
        subject: "Economics",
      });
      const parsedGdp = parseStructuredAcademicSolution(gdp);
      expect(parsedGdp.formula).toContain("GDP");
      expect(parsedGdp.derivation).toContain("Depreciation");
      expect(parsedGdp.finalAnswer).toContain("National Income");

      const demand = generateCurriculumFallback({
        message: "Explain the law of demand and price elasticity of demand",
        board: "West Bengal (WBBSE/WBCHSE)",
        stdClass: "Class 11",
        subject: "Economics",
      });
      const parsedDemand = parseStructuredAcademicSolution(demand);
      expect(parsedDemand.formula).toContain("Law of Demand");
      expect(parsedDemand.derivation).toContain("Substitution Effect");
      expect(parsedDemand.finalAnswer).toContain("E_d");
    });

    it("generates 3-part structured derivation for Primary/Middle School Math (Area, Perimeter, Fractions, SI)", () => {
      const mensuration = generateCurriculumFallback({
        message: "How to calculate circle area and perimeter circumference",
        board: "CBSE (Central Board)",
        stdClass: "Class 7",
        subject: "Mathematics",
      });
      const parsedMensuration = parseStructuredAcademicSolution(mensuration);
      expect(parsedMensuration.formula).toContain("Mensuration");
      expect(parsedMensuration.derivation).toContain("Identify Given Dimensions");
      expect(parsedMensuration.finalAnswer).toContain("A_{\\text{circle}}");

      const arithmetic = generateCurriculumFallback({
        message: "Solve simple interest and unitary method percentage problem",
        board: "Bihar Board (BSEB)",
        stdClass: "Class 6",
        subject: "Mathematics",
      });
      const parsedArithmetic = parseStructuredAcademicSolution(arithmetic);
      expect(parsedArithmetic.formula).toContain("Simple Interest");
      expect(parsedArithmetic.derivation).toContain("Cost Price");
      expect(parsedArithmetic.finalAnswer).toContain("SI");
    });

    it("gracefully wraps general queries in the strict 3-part pedagogical format", () => {
      const general = generateCurriculumFallback({
        message: "Explain magnetic field lines around a bar magnet",
        board: "CBSE (Central Board)",
        stdClass: "Class 10",
        subject: "Physics",
      });
      const parsed = parseStructuredAcademicSolution(general);
      expect(parsed.formula).toBeTruthy();
      expect(parsed.derivation).toBeTruthy();
      expect(parsed.finalAnswer).toBeTruthy();
    });
  });

  describe("3. solveAcademicProblem Integration", () => {
    it("returns deterministic curriculum solution when API keys are absent or invalid", async () => {
      const origGoogle = process.env.GOOGLE_API_KEY;
      const origGemini = process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;
      delete process.env.GEMINI_API_KEY;

      try {
        const params: AcademicSolveParams = {
          message: "Derive Pythagoras theorem",
          board: "CBSE (Central Board)",
          stdClass: "Class 10",
          subject: "Mathematics",
        };

        const result = await solveAcademicProblem(params, generateCurriculumFallback);

        expect(result.text).toBeTruthy();
        expect(result.board).toBe("CBSE (Central Board)");
        expect(result.stdClass).toBe("Class 10");
        expect(result.subject).toBe("Mathematics");

        const parsed = parseStructuredAcademicSolution(result.text);
        expect(parsed.formula).toContain("Pythagoras Theorem");
        expect(parsed.derivation).toContain("Similarity");
        expect(parsed.finalAnswer).toContain("a^2 + b^2 = c^2");
      } finally {
        if (origGoogle) process.env.GOOGLE_API_KEY = origGoogle;
        if (origGemini) process.env.GEMINI_API_KEY = origGemini;
      }
    });
  });

  describe("4. Class Levels and Core Subjects Invariants", () => {
    it("supports Classes 1-12, NEET UG, JEE Main, and Degree STEM", () => {
      for (let i = 1; i <= 12; i++) {
        expect(CLASS_LEVELS).toContain(`Class ${i}`);
      }
      expect(CLASS_LEVELS.some((c) => c.includes("NEET"))).toBe(true);
      expect(CLASS_LEVELS.some((c) => c.includes("JEE"))).toBe(true);
      expect(CLASS_LEVELS).toContain("Degree STEM");
    });

    it("preserves all 9 core subjects and adds foundational school subjects", () => {
      const core = [
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
      for (const subj of core) {
        expect(CORE_SUBJECTS).toContain(subj);
      }
      expect(CORE_SUBJECTS).toContain("General Science (Classes 1-8)");
      expect(CORE_SUBJECTS).toContain("Environmental Studies / EVS");
    });
  });
});
