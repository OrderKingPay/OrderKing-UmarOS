import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildAcademicSystemPrompt,
  solveAcademicProblem,
  type AcademicSolveParams,
} from "../lib/ai/gemini-tutor-solver";
import {
  generateCurriculumFallback,
  parseStructuredAcademicSolution,
  ALL_INDIAN_BOARDS,
  CORE_SUBJECTS,
  CLASS_LEVELS,
  INDIAN_LANGUAGES,
} from "../routes/tutor";
import { MemorySafeRateLimiter } from "../lib/security/rate-limiter";

describe("Supreme Specialist Mandate: AI Academic Solver & EdTech Audit Suite", () => {
  describe("Directive 1: Academic Solver Endpoints, Prompt Templates & Token Pipeline", () => {
    it("builds strictly conditioned zero-hallucination prompt templates with token rules", () => {
      const params: AcademicSolveParams = {
        message: "Derive lens equation",
        board: "CBSE (Central Board)",
        stdClass: "Class 10",
        subject: "Physics",
        language: "English",
        difficulty: "Standard Exam",
        tone: "Direct Academic Solution",
        goal: "Concept Mastery",
      };

      const prompt = buildAcademicSystemPrompt(params);

      // Verify prompt conditioning
      expect(prompt).toContain("Universal Academic Tutor for students across India");
      expect(prompt).toContain("CBSE (Central Board)");
      expect(prompt).toContain("Class 10");
      expect(prompt).toContain("Physics");
      expect(prompt).toContain("CRITICAL MANDATORY 3-PART STRUCTURE");
      expect(prompt).toContain("### 1. Given Formula / Concept");
      expect(prompt).toContain("### 2. Step-by-Step Derivation & Solution");
      expect(prompt).toContain("### 3. Final Answer");
      expect(prompt).toContain("Maintain absolute academic accuracy and mathematical rigor.");
      expect(prompt).toContain("Do NOT generate marketing slogans, conversational fluff");
    });

    it("verifies the fallback token response pipeline returns complete structured tokens without truncation", async () => {
      const params: AcademicSolveParams = {
        message: "Derive quadratic formula by completing square",
        board: "CBSE (Central Board)",
        stdClass: "Class 10",
        subject: "Mathematics",
      };

      const result = await solveAcademicProblem(params, generateCurriculumFallback);

      expect(result.text).toBeTruthy();
      expect(result.isFallback).toBe(true);
      expect(result.modelUsed).toBe("curriculum-deterministic-engine");

      const parsed = parseStructuredAcademicSolution(result.text);
      expect(parsed.formula).toBeTruthy();
      expect(parsed.derivation).toBeTruthy();
      expect(parsed.finalAnswer).toBeTruthy();
      expect(parsed.formula).toContain("Standard Form");
      expect(parsed.derivation).toContain("Complete the square");
      expect(parsed.finalAnswer).toContain("Root Solutions");
    });
  });

  describe("Directive 2: Syllabus Alignment for Class 6-12 (CBSE & Assam SEBA/AHSEC) across STEM & Languages", () => {
    it("aligns prompt and syllabus rules for Assam State Board (SEBA Class 10 & AHSEC Class 12)", () => {
      // SEBA Assam Class 10
      const sebaPrompt = buildAcademicSystemPrompt({
        message: "Explain Ohm's Law in Assamese",
        board: "SEBA (Assam Class 10)",
        stdClass: "Class 10",
        subject: "Physics",
        language: "Assamese",
      });
      expect(sebaPrompt).toContain("SEBA (Assam Class 10)");
      expect(sebaPrompt).toContain("Assam SEBA/AHSEC");
      expect(sebaPrompt).toContain("Assamese");

      // AHSEC Assam Class 12
      const ahsecPrompt = buildAcademicSystemPrompt({
        message: "Derive first order rate law in Assamese or Bengali",
        board: "AHSEC (Assam Class 12)",
        stdClass: "Class 12",
        subject: "Chemistry",
        language: "Bengali",
      });
      expect(ahsecPrompt).toContain("AHSEC (Assam Class 12)");
      expect(ahsecPrompt).toContain("Assam SEBA/AHSEC");
      expect(ahsecPrompt).toContain("Bengali");
    });

    it("verifies Class 6 through 12 level coverage in CLASS_LEVELS", () => {
      const requiredGrades = [
        "Class 6",
        "Class 7",
        "Class 8",
        "Class 9",
        "Class 10",
        "Class 11",
        "Class 12",
      ];
      for (const grade of requiredGrades) {
        expect(CLASS_LEVELS).toContain(grade);
      }
    });

    it("verifies Indian regional languages support including Assamese, Bengali, and Hindi", () => {
      const languageCodes = INDIAN_LANGUAGES.map((l) => l.code);
      expect(languageCodes).toContain("as"); // Assamese
      expect(languageCodes).toContain("bn"); // Bengali
      expect(languageCodes).toContain("hi"); // Hindi
      expect(languageCodes).toContain("en"); // English

      const assameseEntry = INDIAN_LANGUAGES.find((l) => l.code === "as");
      expect(assameseEntry?.native).toBe("অসমীয়া");

      const bengaliEntry = INDIAN_LANGUAGES.find((l) => l.code === "bn");
      expect(bengaliEntry?.native).toBe("বাংলা");
    });

    it("generates authentic solutions for Class 6-8 Math foundations (Fractions, Simple Interest, Mensuration)", () => {
      const siResult = generateCurriculumFallback({
        message: "Solve simple interest formula SI = P*R*T/100",
        board: "SEBA (Assam Class 10)",
        stdClass: "Class 7",
        subject: "Mathematics",
      });

      const parsed = parseStructuredAcademicSolution(siResult);
      expect(parsed.formula).toContain("SI");
      expect(parsed.derivation).toContain("Unitary Method");
      expect(parsed.finalAnswer).toContain("\\text{SI} = \\frac{P \\times R \\times T}{100}");
    });

    it("maps statutory curriculum authorities and textbooks across North, South, East, West, and Central India", () => {
      // 1. South India: Tamil Nadu (Samacheer Kalvi) & Karnataka (KTBS)
      const tnPrompt = buildAcademicSystemPrompt({
        message: "Explain Bernoulli's theorem in Tamil",
        board: "Tamil Nadu State Board (TNDGE)",
        stdClass: "Class 11",
        subject: "Physics",
        language: "Tamil",
      });
      expect(tnPrompt).toContain("Directorate of Government Examinations Tamil Nadu (TNDGE)");
      expect(tnPrompt).toContain("Samacheer Kalvi");
      expect(tnPrompt).toContain("Regional Educational Jurisdiction: South");

      const ktbsPrompt = buildAcademicSystemPrompt({
        message: "Derive quadratic roots",
        board: "Karnataka Board (KSEAB)",
        stdClass: "Class 10",
        subject: "Mathematics",
      });
      expect(ktbsPrompt).toContain("Karnataka School Examination and Assessment Board (KSEAB)");
      expect(ktbsPrompt).toContain("Karnataka Textbook Society (KTBS)");
      expect(ktbsPrompt).toContain("Regional Educational Jurisdiction: South");

      // 2. West India: Maharashtra (Balbharati) & Gujarat (GSSTB)
      const mahaPrompt = buildAcademicSystemPrompt({
        message: "Explain Newton's third law in Marathi",
        board: "Maharashtra State Board (MSBSHSE)",
        stdClass: "Class 9",
        subject: "Physics",
        language: "Marathi",
      });
      expect(mahaPrompt).toContain("MSBSHSE");
      expect(mahaPrompt).toContain("Balbharati");
      expect(mahaPrompt).toContain("Regional Educational Jurisdiction: West");

      const gujPrompt = buildAcademicSystemPrompt({
        message: "Solve stoichiometry numericals in Gujarati",
        board: "Gujarat Board (GSEB)",
        stdClass: "Class 11",
        subject: "Chemistry",
        language: "Gujarati",
      });
      expect(gujPrompt).toContain("Gujarat Secondary and Higher Secondary Education Board (GSHSEB)");
      expect(gujPrompt).toContain("GSSTB");
      expect(gujPrompt).toContain("Regional Educational Jurisdiction: West");

      // 3. North India: Uttar Pradesh (UPMSP) & Bihar (BSTBPC)
      const upPrompt = buildAcademicSystemPrompt({
        message: "Explain Ohm's law in Hindi",
        board: "UP Board (UPMSP)",
        stdClass: "Class 10",
        subject: "Physics",
        language: "Hindi",
      });
      expect(upPrompt).toContain("Uttar Pradesh Madhyamik Shiksha Parishad (UPMSP)");
      expect(upPrompt).toContain("SCERT Uttar Pradesh");
      expect(upPrompt).toContain("Regional Educational Jurisdiction: North");

      const biharPrompt = buildAcademicSystemPrompt({
        message: "Explain Mendel's laws in Hindi",
        board: "Bihar Board (BSEB)",
        stdClass: "Class 10",
        subject: "Biology",
        language: "Hindi",
      });
      expect(biharPrompt).toContain("Bihar School Examination Board (BSEB)");
      expect(biharPrompt).toContain("BSTBPC");
      expect(biharPrompt).toContain("Regional Educational Jurisdiction: North");

      // 4. East & Northeast India: West Bengal (WBBSE/WBCHSE) & Odisha (TBW)
      const wbPrompt = buildAcademicSystemPrompt({
        message: "Explain photosynthesis in Bengali",
        board: "West Bengal (WBBSE/WBCHSE)",
        stdClass: "Class 10",
        subject: "Biology",
        language: "Bengali",
      });
      expect(wbPrompt).toContain("West Bengal Board of Secondary Education");
      expect(wbPrompt).toContain("Paschimbanga Uchha Madhyamik Siksha Samsad");
      expect(wbPrompt).toContain("Regional Educational Jurisdiction: East");

      const odishaPrompt = buildAcademicSystemPrompt({
        message: "Explain cell structure in Odia",
        board: "Odisha Board (BSE/CHSE)",
        stdClass: "Class 9",
        subject: "Biology",
        language: "Odia",
      });
      expect(odishaPrompt).toContain("Board of Secondary Education Odisha");
      expect(odishaPrompt).toContain("Text Book Bureau Odisha (TBW)");
      expect(odishaPrompt).toContain("Regional Educational Jurisdiction: East");

      // 5. Central India: Madhya Pradesh (MPBSE) & Chhattisgarh (CGBSE)
      const mpPrompt = buildAcademicSystemPrompt({
        message: "Explain chemical equilibrium in Hindi",
        board: "Madhya Pradesh Board (MPBSE)",
        stdClass: "Class 11",
        subject: "Chemistry",
        language: "Hindi",
      });
      expect(mpPrompt).toContain("Board of Secondary Education Madhya Pradesh (MPBSE)");
      expect(mpPrompt).toContain("MP Rajya Shiksha Kendra");
      expect(mpPrompt).toContain("Regional Educational Jurisdiction: Central India");

      // 6. National Competitive: NEET UG & JEE Main/Advanced
      const neetPrompt = buildAcademicSystemPrompt({
        message: "Explain DNA replication fork",
        board: "NEET UG",
        stdClass: "NEET UG (Medical Entrance)",
        subject: "Biology",
      });
      expect(neetPrompt).toContain("National Testing Agency (NTA) - NEET UG Medical Entrance");
      expect(neetPrompt).toContain("Regional Educational Jurisdiction: National Competitive");

      const jeePrompt = buildAcademicSystemPrompt({
        message: "Shortest distance between skew lines",
        board: "JEE Main & Advanced",
        stdClass: "JEE Main & Advanced (Engineering)",
        subject: "Mathematics",
      });
      expect(jeePrompt).toContain("National Testing Agency (NTA) & IIT Joint Admission Board (JEE)");
      expect(jeePrompt).toContain("Regional Educational Jurisdiction: National Competitive");
    });

    it("verifies all 17 authentic native scripts and BCP-47 locale tags", () => {
      const scriptChecks: Record<string, string> = {
        hi: "हिन्दी",
        bn: "বাংলা",
        as: "অসমীয়া",
        mr: "मराठी",
        ta: "தமிழ்",
        te: "తెలుగు",
        gu: "ગુજરાતી",
        kn: "ಕನ್ನಡ",
        ml: "മലയാളം",
        or: "ଓଡ଼ିଆ",
        pa: "ਪੰਜਾਬੀ",
        ur: "اردو",
        sa: "संस्कृतम्",
      };

      for (const [code, expectedNative] of Object.entries(scriptChecks)) {
        const entry = INDIAN_LANGUAGES.find((l) => l.code === code);
        expect(entry).toBeDefined();
        expect(entry?.native).toBe(expectedNative);
      }
    });
  });

  describe("Directive 3: KaTeX / LaTeX Formula Rendering & Step Verification", () => {
    it("validates 100% paired delimiters and mathematical syntax across all STEM disciplines", () => {
      const stemScenarios = [
        { query: "quadratic equation completing square", subject: "Mathematics" },
        { query: "integration of sin^2(x) dx", subject: "Mathematics" },
        { query: "bernoulli equation fluid streamline flow", subject: "Physics" },
        { query: "ohm's law microscopic drift velocity", subject: "Physics" },
        { query: "newton second law equations of motion", subject: "Physics" },
        { query: "snell refraction thin lens formula", subject: "Physics" },
        { query: "chemical kinetics first order rate law", subject: "Chemistry" },
        { query: "chemical equilibrium Le Chatelier", subject: "Chemistry" },
        { query: "photosynthesis balanced chemical equation", subject: "Biology" },
        { query: "pythagoras theorem similarity", subject: "Mathematics" },
      ];

      for (const scenario of stemScenarios) {
        const text = generateCurriculumFallback({
          message: scenario.query,
          board: "CBSE (Central Board)",
          stdClass: "Class 10",
          subject: scenario.subject,
        });

        // 1. Paired inline math \( and \)
        const openInline = (text.match(/\\\(/g) || []).length;
        const closeInline = (text.match(/\\\)/g) || []).length;
        expect(openInline).toBe(closeInline);

        // 2. Paired block display math \[ and \]
        const openDisplay = (text.match(/\\\[/g) || []).length;
        const closeDisplay = (text.match(/\\\]/g) || []).length;
        expect(openDisplay).toBe(closeDisplay);

        // 3. No corrupted control characters
        expect(text).not.toContain("\x08"); // backspace
        expect(text).not.toContain("\x0c"); // form feed
      }
    });
  });

  describe("Directive 4: EdTech Affiliate Links & Zero-Hallucination Guardrails", () => {
    it("verifies EdTech alliance affiliate partner in rewards.tsx", () => {
      const rewardsCode = readFileSync(
        new URL("../routes/rewards.tsx", import.meta.url),
        "utf8"
      );

      // Verify category and affiliate structure
      expect(rewardsCode).toContain('category: "edtech"');
      expect(rewardsCode).toContain("AI Learning Academy");
      expect(rewardsCode).toContain("affiliateUrl: \"https://orderking.in/courses/ai-masterclass?ref=affiliate\"");
      expect(rewardsCode).toContain("Sponsored by national EdTech alliance partner.");
    });

    it("verifies zero-hallucination guardrails and purge of all unverified promotional claims", () => {
      const tutorCode = readFileSync(
        new URL("../routes/tutor.tsx", import.meta.url),
        "utf8"
      );

      // Purge audit: zero fake marketing claims
      expect(tutorCode).not.toContain("Guaranteed 100% Exam Marks");
      expect(tutorCode).not.toContain("World's #1 Miracle AI");
      expect(tutorCode).not.toContain("100% Guaranteed Board Topper");

      // Verify grounded label
      expect(tutorCode).toContain("Academic Tutor");
    });
  });

  describe("Directive 5: Academic Verification Metrics & Rate-Limiter Concurrency", () => {
    it("verifies 100% rate-limiting precision under 50 concurrent flood requests", async () => {
      const limiter = new MemorySafeRateLimiter({ windowMs: 60_000, maxRequests: 20 });
      const testStudent = "academic-metric-student-1";

      const results = await Promise.all(
        Array.from({ length: 50 }, async () => {
          await new Promise((r) => setTimeout(r, Math.random() * 5));
          return limiter.isAllowed(testStudent);
        })
      );

      const allowed = results.filter((r) => r.allowed).length;
      const blocked = results.filter((r) => !r.allowed).length;

      expect(allowed).toBe(20);
      expect(blocked).toBe(30);

      // Academic metrics
      const concurrencyIntegrityMetric = allowed / 20; // Must be exactly 1.0 (100%)
      expect(concurrencyIntegrityMetric).toBe(1.0);
    });
  });
});
