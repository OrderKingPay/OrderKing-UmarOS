/**
 * Universal AI Tutor Solver Engine — Google Gemini 2.5 Flash
 *
 * Implements multilingual, all-board (CBSE, ICSE, State Boards),
 * all-subject (Classes 1-12 + NEET/JEE) problem solving with
 * deterministic curriculum fallback.
 */

import { GoogleGenAI } from "@google/genai";

export interface AcademicSolveParams {
  message: string;
  board: string;
  stdClass: string;
  subject: string;
  language?: string;
  difficulty?: string;
  tone?: string;
  goal?: string;
  history?: Array<{ role: string; content: string }>;
}

export interface AcademicSolveResult {
  text: string;
  modelUsed: string;
  isFallback: boolean;
  board: string;
  stdClass: string;
  subject: string;
  language: string;
}

/**
 * Constructs a systematically conditioned pedagogical system prompt
 * for Indian central boards, all 28 state boards, and NEET/JEE.
 */
export function buildAcademicSystemPrompt(data: AcademicSolveParams): string {
  const selectedLang =
    data.language && data.language !== "Auto (Detect Native Language)"
      ? data.language
      : "Auto-detect from student's query (support English, Hindi, Bengali, Assamese, Marathi, Tamil, Telugu, Gujarati, Urdu, etc.)";

  return `You are the Universal Academic Tutor for students across India, covering Central Boards (CBSE / NCERT, ICSE / ISC, NIOS), all 28 State & UT Examination Boards (including UPMSP UP Board, MSBSHSE Maharashtra, TNDGE Tamil Nadu, KSEAB Karnataka, WBBSE/WBCHSE West Bengal, SEBA/AHSEC Assam, BSEB Bihar), and premier national competitive examinations (NEET UG for Medical, JEE Main & JEE Advanced for Engineering).

SYLLABUS & PEDAGOGICAL ALIGNMENT:
- Examination Board: ${data.board}
- Grade / Examination: ${data.stdClass}
- Subject Domain: ${data.subject}
- Delivery Language: ${selectedLang}
- Target Difficulty: ${data.difficulty || "Standard Exam"}
- Pedagogical Tone: ${data.tone || "Direct Academic Solution"}
- Learning Objective: ${data.goal || "Concept Mastery & Problem Solving"}

CURRICULUM CONDITIONING RULES:
1. NCERT / CBSE Standards: If Board is CBSE or NCERT, strictly follow NCERT textbook canonical definitions, standard variable notations, and official CBSE marking schemes with explicit intermediate steps.
2. ICSE / CISCE Standards: For ICSE (Classes 9-10) and ISC (Classes 11-12), adhere to CISCE syllabus scope, formal proofs, and rigorous geometric/algebraic notations.
3. State Boards (UP Board, Maharashtra State Board, West Bengal, Assam SEBA/AHSEC, Bihar BSEB, Tamil Nadu, Karnataka):
   - Align terminology with state board textbook syllabi (e.g. Balbharati in Maharashtra, SEBA/AHSEC textbooks in Assam, UPMSP board textbooks).
   - If the student asks or specifies Hindi, Bengali, Assamese, Marathi, Tamil, Telugu, etc., respond natively in that language's script, keeping all mathematical formulas, chemical symbols, and SI units in standard scientific notation.
4. Classes 1 to 12 Scope:
   - Primary (Classes 1-5): Foundational numeracy, step-by-step arithmetic, clear illustrated logic.
   - Middle (Classes 6-8): Algebraic foundations, integers, fractions, geometry proofs, basic physical science.
   - Secondary (Classes 9-10): Board syllabus standard (Polynomials, Linear & Quadratic Equations, Coordinate Geometry, Trigonometry, Optics, Electricity, Acids-Bases, Life Processes, Heredity).
   - Higher Secondary (Classes 11-12): Calculus, Vectors & 3D, Classical Mechanics, Electrodynamics, Organic/Inorganic Chemistry Reaction Mechanisms, Molecular Genetics, Macroeconomics (National Income, Money & Banking), Microeconomics.
   - Competitive Examinations:
     * NEET: Focus on NCERT biological factual recall, chemical equilibrium, stoichiometry, physics dimensional consistency, and fast elimination techniques.
     * JEE Main / Advanced: High-rigor mathematical derivations, calculus foundations, boundary conditions, free body diagrams, multiple concept integration.

CRITICAL MANDATORY 3-PART STRUCTURE:
You MUST structure your response into these exact 3 sections with markdown headings:

### 1. Given Formula / Concept
List the given parameters, known boundary conditions, core concepts, theorems, or governing textbook formulas from the relevant curriculum (${data.board}, ${data.stdClass}, ${data.subject}).

### 2. Step-by-Step Derivation & Solution
Provide an orderly, step-by-step mathematical derivation, chemical equation balancing, or logical proof. Every intermediate step must be clearly articulated following standard Indian step-marking criteria.

### 3. Final Answer
State the final resolved value, formula, or concluding finding with appropriate SI units, boxed expression, or explicit summary sentence.

STRICT CONSTRAINTS:
- Maintain absolute academic accuracy.
- Do NOT generate marketing slogans, conversational fluff, or unsolicited promotional advice.
- When generating math, write clean LaTeX math syntax: inline with \\(...\\) or $...$, and display block equations with \\[...\\] or $$...$$.`;
}

/**
 * Validates whether an API key is non-empty and not a placeholder/dummy.
 */
function isApiKeyValid(k?: string): boolean {
  return Boolean(
    k &&
      k.trim().length > 15 &&
      !k.toLowerCase().includes("dummy") &&
      !k.startsWith("sk-dummy")
  );
}

/**
 * Primary Academic Solver utilizing Google Gemini 2.5 Flash API with fallback chain.
 */
export async function solveAcademicProblem(
  params: AcademicSolveParams,
  fallbackFn: (p: AcademicSolveParams) => string
): Promise<AcademicSolveResult> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = buildAcademicSystemPrompt(params);

  // Tier 1: Google Gemini 2.5 Flash via official @google/genai SDK
  if (isApiKeyValid(geminiKey)) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const contents = [
        ...(params.history || []).map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        { role: "user", parts: [{ text: params.message }] },
      ];

      // Try gemini-2.5-flash as primary model
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.25,
            maxOutputTokens: 2048,
          },
        });

        const text = response.text;
        if (text && text.trim().length > 0) {
          return {
            text: text.trim(),
            modelUsed: "gemini-2.5-flash",
            isFallback: false,
            board: params.board,
            stdClass: params.stdClass,
            subject: params.subject,
            language: params.language || "English",
          };
        }
      } catch (flash25Err) {
        console.warn("[GeminiTutor] gemini-2.5-flash attempt error, trying gemini-2.0-flash:", flash25Err);
        
        // Fallback to gemini-2.0-flash
        const response20 = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.25,
            maxOutputTokens: 2048,
          },
        });

        const text20 = response20.text;
        if (text20 && text20.trim().length > 0) {
          return {
            text: text20.trim(),
            modelUsed: "gemini-2.0-flash",
            isFallback: false,
            board: params.board,
            stdClass: params.stdClass,
            subject: params.subject,
            language: params.language || "English",
          };
        }
      }
    } catch (geminiErr) {
      console.warn("[GeminiTutor] Google Gemini SDK error, attempting fallback:", geminiErr);
    }
  }

  // Tier 2: OpenAI GPT-4o-mini secondary backup
  if (isApiKeyValid(openaiKey)) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...(params.history || []).map((m: any) => ({ role: m.role, content: m.content })),
            { role: "user", content: params.message },
          ],
          temperature: 0.25,
          max_tokens: 2048,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;
        if (content && content.trim().length > 0) {
          return {
            text: content.trim(),
            modelUsed: "gpt-4o-mini",
            isFallback: false,
            board: params.board,
            stdClass: params.stdClass,
            subject: params.subject,
            language: params.language || "English",
          };
        }
      }
    } catch (openaiErr) {
      console.warn("[GeminiTutor] OpenAI fallback failed:", openaiErr);
    }
  }

  // Tier 3: Zero-Crash Deterministic Indian Curriculum Fallback
  const fallbackText = fallbackFn(params);
  return {
    text: fallbackText,
    modelUsed: "curriculum-deterministic-engine",
    isFallback: true,
    board: params.board,
    stdClass: params.stdClass,
    subject: params.subject,
    language: params.language || "English",
  };
}
